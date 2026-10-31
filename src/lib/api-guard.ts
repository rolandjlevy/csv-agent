import type { AgentMessage } from "@lib/agent-core";
import type { AdaptProfile } from "@lib/csv-adapt";

// Server-side guards for the routes that call the Anthropic API. The browser
// already limits file size, but anyone can call these routes directly, so
// every limit is enforced here too.

export const LIMITS = {
  /** Matches the dropzone limit; Vercel rejects request bodies over 4.5MB. */
  maxCsvBytes: 3.5 * 1024 * 1024,
  maxCsvRows: 10_000,
  maxQuestionChars: 500,
  maxHistoryMessages: 40,
  maxHistoryBytes: 300_000,
  maxMerchantMapEntries: 5_000,
  /** LLM-backed requests (detect + agent) allowed per IP per window. */
  rateLimitRequests: 30,
  rateLimitWindowMs: 10 * 60 * 1000,
} as const;

export type GuardResult<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

const fail = (status: number, message: string): { ok: false; status: number; message: string } => ({
  ok: false,
  status,
  message,
});

// ---------------------------------------------------------------------------
// Rate limiting
//
// In-memory, so the counter lives in one server instance only. On a
// serverless host each instance (and each route) has its own counter, and a
// restart resets it, so this is a best-effort brake against casual abuse, not
// a hard guarantee. For a hard limit add a Vercel Firewall rate-limit rule
// (or a shared store such as Upstash) in front of /api/detect and /api/agent,
// and set a spend limit on the Anthropic API key.
// ---------------------------------------------------------------------------

const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRateLimit(
  req: Request,
  { limit = LIMITS.rateLimitRequests, windowMs = LIMITS.rateLimitWindowMs, now = Date.now() } = {}
): GuardResult<null> {
  const ip = clientIp(req);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    const retryAfterMin = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 60_000));
    hits.set(ip, recent);
    return fail(
      429,
      `You've reached the demo's request limit. Try again in about ${retryAfterMin} minute${retryAfterMin === 1 ? "" : "s"}.`
    );
  }

  recent.push(now);
  hits.set(ip, recent);

  // Keep the map from growing forever: drop idle IPs now and then.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(key);
    }
  }
  return { ok: true, value: null };
}

/** Test helper: forget all recorded requests. */
export function resetRateLimit(): void {
  hits.clear();
}

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

export function validateCsv(csvData: string): GuardResult<string> {
  if (Buffer.byteLength(csvData, "utf8") > LIMITS.maxCsvBytes) {
    return fail(413, "That file is over the 3.5MB limit.");
  }
  let rows = 1;
  for (let i = 0; i < csvData.length; i++) {
    if (csvData.charCodeAt(i) === 10) rows++;
  }
  if (rows > LIMITS.maxCsvRows) {
    return fail(413, `That file has more than ${LIMITS.maxCsvRows.toLocaleString("en-GB")} rows, which is over the demo's limit.`);
  }
  return { ok: true, value: csvData };
}

export function validateQuestion(question: string): GuardResult<string> {
  const trimmed = question.trim();
  if (trimmed.length > LIMITS.maxQuestionChars) {
    return fail(400, `Questions are limited to ${LIMITS.maxQuestionChars} characters.`);
  }
  return { ok: true, value: trimmed };
}

const ROLES = new Set(["user", "assistant"]);
const BLOCK_TYPES = new Set(["text", "tool_use", "tool_result"]);
const TOOL_NAMES = new Set(["read_csv", "analyse", "generate_pl", "write_report"]);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * `history` is the conversation the browser got back from an earlier answer.
 * Only that shape is accepted: user/assistant turns made of text, tool_use
 * (for our four tools) and tool_result blocks, within a size limit.
 */
export function validateHistory(history: unknown): GuardResult<AgentMessage[] | undefined> {
  if (history === undefined || history === null) return { ok: true, value: undefined };
  if (!Array.isArray(history)) return fail(400, "Invalid conversation history.");
  if (history.length > LIMITS.maxHistoryMessages) {
    return fail(400, "That conversation is too long. Start a new one by changing the file.");
  }
  if (Buffer.byteLength(JSON.stringify(history), "utf8") > LIMITS.maxHistoryBytes) {
    return fail(400, "That conversation is too long. Start a new one by changing the file.");
  }

  for (const message of history) {
    if (!isObject(message) || typeof message.role !== "string" || !ROLES.has(message.role)) {
      return fail(400, "Invalid conversation history.");
    }
    const { content } = message;
    if (typeof content === "string") continue;
    if (!Array.isArray(content)) return fail(400, "Invalid conversation history.");

    for (const block of content) {
      if (!isObject(block) || typeof block.type !== "string" || !BLOCK_TYPES.has(block.type)) {
        return fail(400, "Invalid conversation history.");
      }
      if (block.type === "tool_use" && (typeof block.name !== "string" || !TOOL_NAMES.has(block.name))) {
        return fail(400, "Invalid conversation history.");
      }
    }
  }
  return { ok: true, value: history as AgentMessage[] };
}

const DATE_FORMATS = new Set(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]);
const AMOUNT_CONVENTIONS = new Set(["signed", "split", "debit_credit"]);
const MAX_FIELD_CHARS = 200;

const optionalString = (v: unknown): boolean =>
  v === undefined || (typeof v === "string" && v.length <= MAX_FIELD_CHARS);

/** A column-mapping profile, as produced by /api/detect and edited in the confirm panel. */
export function validateProfile(profile: unknown): GuardResult<AdaptProfile | undefined> {
  if (profile === undefined || profile === null) return { ok: true, value: undefined };
  const bad = fail(400, "Invalid column mapping.");
  if (!isObject(profile)) return bad;

  const {
    headerRowIndex,
    hasHeaderRow,
    bankName,
    currencyCode,
    dateColumn,
    dateFormat,
    descriptionColumn,
    amountConvention,
    amountColumn,
    moneyInColumn,
    moneyOutColumn,
  } = profile;

  if (!Number.isInteger(headerRowIndex) || (headerRowIndex as number) < 0 || (headerRowIndex as number) > 1_000) {
    return bad;
  }
  if (hasHeaderRow !== undefined && typeof hasHeaderRow !== "boolean") return bad;
  if (typeof dateColumn !== "string" || dateColumn.length > MAX_FIELD_CHARS) return bad;
  if (typeof descriptionColumn !== "string" || descriptionColumn.length > MAX_FIELD_CHARS) return bad;
  if (typeof dateFormat !== "string" || !DATE_FORMATS.has(dateFormat)) return bad;
  if (typeof amountConvention !== "string" || !AMOUNT_CONVENTIONS.has(amountConvention)) return bad;
  if (![bankName, currencyCode, amountColumn, moneyInColumn, moneyOutColumn].every(optionalString)) return bad;

  // Pass on only the known fields, so nothing unexpected reaches the transform.
  const clean = {
    headerRowIndex,
    hasHeaderRow,
    bankName,
    currencyCode,
    dateColumn,
    dateFormat,
    descriptionColumn,
    amountConvention,
    amountColumn,
    moneyInColumn,
    moneyOutColumn,
  };
  for (const key of Object.keys(clean) as (keyof typeof clean)[]) {
    if (clean[key] === undefined) delete clean[key];
  }
  return { ok: true, value: clean as unknown as AdaptProfile };
}

/** Merchant key -> category, carried forward from a saved profile. */
export function validateMerchantMap(map: unknown): GuardResult<Record<string, string> | undefined> {
  if (map === undefined || map === null) return { ok: true, value: undefined };
  const bad = fail(400, "Invalid saved merchant categories.");
  if (!isObject(map)) return bad;

  const entries = Object.entries(map);
  if (entries.length > LIMITS.maxMerchantMapEntries) return bad;
  for (const [key, value] of entries) {
    if (key.length > MAX_FIELD_CHARS || typeof value !== "string" || value.length > 100) return bad;
  }
  return { ok: true, value: map as Record<string, string> };
}
