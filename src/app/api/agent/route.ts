import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { runAgentLoop, type AgentEvent, type AgentMessage } from "@lib/agent-core";
import { adaptCsv, transformAndCategorise, type AdaptProfile } from "@lib/csv-adapt";

export const runtime = "nodejs";

interface AgentRequestBody {
  csvData?: unknown;
  question?: unknown;
  profile?: AdaptProfile;
  // Prior conversation (as returned in an earlier response's "done" event's
  // `messages`) — sent back to continue asking follow-up questions with full
  // context instead of starting a fresh conversation each time.
  history?: unknown;
  // Merchant key -> category carried forward from a saved profile, so only
  // unknown merchants get sent to the classifier.
  knownMerchantMap?: Record<string, string>;
}

// A synthetic NDJSON line the route emits itself (not part of the agent
// loop's own event union in lib/agent-core.js) carrying the merchant
// classification result back to the browser so it can persist it.
interface MerchantClassificationEvent {
  type: "merchant_classification";
  merchantMap: Record<string, string>;
  newKeys: string[];
}

type StreamEvent = AgentEvent | MerchantClassificationEvent;

function ndjsonText(event: StreamEvent): string {
  return JSON.stringify(event) + "\n";
}

function ndjsonLine(event: StreamEvent): Uint8Array {
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

  const { csvData, question, profile, history, knownMerchantMap } = body;

  if (typeof csvData !== "string" || !csvData.trim()) {
    return singleEventResponse({ type: "error", message: "Missing or invalid csvData." });
  }
  if (typeof question !== "string" || !question.trim()) {
    return singleEventResponse({ type: "error", message: "Missing or invalid question." });
  }
  const priorMessages: AgentMessage[] | undefined = Array.isArray(history)
    ? (history as AgentMessage[])
    : undefined;
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
          ? await transformAndCategorise(csvData, profile, {
              onEvent: onAdaptEvent,
              knownMerchantMap,
            })
          : await adaptCsv(csvData, { onEvent: onAdaptEvent, knownMerchantMap });

        if (adapted.merchantMap) {
          controller.enqueue(
            ndjsonLine({
              type: "merchant_classification",
              merchantMap: adapted.merchantMap,
              newKeys: adapted.newMerchantKeys,
            })
          );
        }

        await writeFile(tempPath, adapted.csv, "utf8");

        await runAgentLoop(tempPath, question, {
          history: priorMessages,
          currency: adapted.profile?.currencyCode,
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
