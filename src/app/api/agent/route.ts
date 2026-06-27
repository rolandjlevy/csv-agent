import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { runAgentLoop, type AgentEvent } from "@lib/agent-core";
import { adaptCsv, transformAndCategorise, type AdaptProfile } from "@lib/csv-adapt";

export const runtime = "nodejs";

interface AgentRequestBody {
  csvData?: unknown;
  question?: unknown;
  profile?: AdaptProfile;
}

function ndjsonText(event: AgentEvent): string {
  return JSON.stringify(event) + "\n";
}

function ndjsonLine(event: AgentEvent): Uint8Array {
  return new TextEncoder().encode(ndjsonText(event));
}

function singleEventResponse(event: AgentEvent): Response {
  return new Response(ndjsonText(event), {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return singleEventResponse({ type: "error", message: "Invalid JSON body." });
  }

  const { csvData, question, profile } = body;

  if (typeof csvData !== "string" || !csvData.trim()) {
    return singleEventResponse({ type: "error", message: "Missing or invalid csvData." });
  }
  if (typeof question !== "string" || !question.trim()) {
    return singleEventResponse({ type: "error", message: "Missing or invalid question." });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return singleEventResponse({
      type: "error",
      message: "Server is missing ANTHROPIC_API_KEY.",
    });
  }

  const tempPath = path.join(os.tmpdir(), `csv-agent-${randomUUID()}.csv`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Adapt any bank's CSV into the canonical schema first, surfacing each
        // step in the existing feed as a "thinking" event (turn 0). When the
        // browser sends a user-confirmed profile, apply it directly and skip
        // re-detection; otherwise fall back to full auto-detection.
        const onAdaptEvent = (event: { message: string }) => {
          controller.enqueue(ndjsonLine({ type: "thinking", turn: 0, text: event.message }));
        };
        const adapted = profile
          ? await transformAndCategorise(csvData, profile, { onEvent: onAdaptEvent })
          : await adaptCsv(csvData, { onEvent: onAdaptEvent });

        await writeFile(tempPath, adapted.csv, "utf8");

        await runAgentLoop(tempPath, question, {
          onEvent(event) {
            controller.enqueue(ndjsonLine(event));
          },
        });
      } catch (error) {
        controller.enqueue(
          ndjsonLine({
            type: "error",
            message: error instanceof Error ? error.message : "Agent run failed.",
          })
        );
      } finally {
        await unlink(tempPath).catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
