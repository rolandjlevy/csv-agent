import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { runAgentLoop, type AgentEvent } from "@lib/agent-core";
import { adaptCsv, transformAndCategorise } from "@lib/csv-adapt";
import { toFriendlyMessage } from "@/lib/api-errors";
import {
  checkRateLimit,
  validateCsv,
  validateHistory,
  validateMerchantMap,
  validateProfile,
  validateQuestion,
} from "@/lib/api-guard";

export const runtime = "nodejs";

// The web demo runs on a read-only, shared server, so the write_report tool
// must not save files here (see writeReport in tools.js). The CLI never sets
// this, so it keeps saving reports as before.
process.env.CSV_AGENT_DISABLE_FILE_WRITES = "1";

interface AgentRequestBody {
  csvData?: unknown;
  question?: unknown;
  profile?: unknown;
  // Prior conversation (as returned in an earlier response's "done" event's
  // `messages`) — sent back to continue asking follow-up questions with full
  // context instead of starting a fresh conversation each time.
  history?: unknown;
  // Merchant key -> category carried forward from a saved profile, so only
  // unknown merchants get sent to the classifier.
  knownMerchantMap?: unknown;
}

// A synthetic NDJSON line the route emits itself (not part of the agent
// loop's own event union in lib/agent-core.js) carrying the merchant
// classification result back to the browser so it can persist it.
interface MerchantClassificationEvent {
  type: "merchant_classification";
  merchantMap: Record<string, string>;
  newKeys: string[];
}

// Carries the fully adapted+categorised canonical CSV back to the browser
// once per question, so the export panel has the complete dataset to map
// (the agent loop only ever sees whatever rows individual tool calls happen
// to fetch, which isn't guaranteed to be everything).
interface CanonicalDataEvent {
  type: "canonical_data";
  csv: string;
}

type StreamEvent = AgentEvent | MerchantClassificationEvent | CanonicalDataEvent;

function ndjsonText(event: StreamEvent): string {
  return JSON.stringify(event) + "\n";
}

function ndjsonLine(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(ndjsonText(event));
}

function singleEventResponse(event: AgentEvent, status = 200): Response {
  return new Response(ndjsonText(event), {
    status,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

export async function POST(req: Request): Promise<Response> {
  const limit = checkRateLimit(req);
  if (!limit.ok) {
    return singleEventResponse({ type: "error", message: limit.message }, limit.status);
  }

  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return singleEventResponse({ type: "error", message: "Invalid JSON body." });
  }

  const { csvData, question: rawQuestion, profile: rawProfile, history: rawHistory, knownMerchantMap: rawMerchantMap } = body;

  if (typeof csvData !== "string" || !csvData.trim()) {
    return singleEventResponse({ type: "error", message: "Missing or invalid csvData." }, 400);
  }
  if (typeof rawQuestion !== "string" || !rawQuestion.trim()) {
    return singleEventResponse({ type: "error", message: "Missing or invalid question." }, 400);
  }

  const csvCheck = validateCsv(csvData);
  if (!csvCheck.ok) {
    return singleEventResponse({ type: "error", message: csvCheck.message }, csvCheck.status);
  }
  const questionCheck = validateQuestion(rawQuestion);
  if (!questionCheck.ok) {
    return singleEventResponse({ type: "error", message: questionCheck.message }, questionCheck.status);
  }
  const historyCheck = validateHistory(rawHistory);
  if (!historyCheck.ok) {
    return singleEventResponse({ type: "error", message: historyCheck.message }, historyCheck.status);
  }
  const profileCheck = validateProfile(rawProfile);
  if (!profileCheck.ok) {
    return singleEventResponse({ type: "error", message: profileCheck.message }, profileCheck.status);
  }
  const merchantMapCheck = validateMerchantMap(rawMerchantMap);
  if (!merchantMapCheck.ok) {
    return singleEventResponse({ type: "error", message: merchantMapCheck.message }, merchantMapCheck.status);
  }

  const question = questionCheck.value;
  const priorMessages = historyCheck.value;
  const profile = profileCheck.value;
  const knownMerchantMap = merchantMapCheck.value;

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

        controller.enqueue(ndjsonLine({ type: "canonical_data", csv: adapted.csv }));

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
            message: toFriendlyMessage(error, "api/agent"),
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
