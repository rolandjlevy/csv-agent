import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { runAgentLoop, type AgentEvent } from "@lib/agent-core";

export const runtime = "nodejs";

interface AgentRequestBody {
  csvData?: unknown;
  question?: unknown;
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

  const { csvData, question } = body;

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
        await writeFile(tempPath, csvData, "utf8");

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
