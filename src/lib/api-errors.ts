// Turns whatever went wrong on the server into a short message that is safe
// and useful to show a visitor. Raw errors from the Anthropic SDK can contain
// request IDs and API response bodies, so those are logged here and never sent.

const FRIENDLY = {
  unavailable: "The demo's AI service isn't available right now. Please try again later.",
  busy: "The AI service is busy right now. Please try again in a minute.",
  connection: "Couldn't reach the AI service. Please try again.",
  timeout: "That took too long. Try a smaller file, or ask again.",
  generic: "Something went wrong running that. Please try again, or use the sample data.",
} as const;

export function toFriendlyMessage(error: unknown, context = "api"): string {
  console.error(`[${context}]`, error);

  const err = error as { status?: unknown; name?: unknown; message?: unknown } | null;
  const status = typeof err?.status === "number" ? err.status : undefined;
  const name = typeof err?.name === "string" ? err.name : "";
  const message = typeof err?.message === "string" ? err.message : "";

  if (status === 401 || status === 403) return FRIENDLY.unavailable;
  if (status === 429 || status === 529 || (status !== undefined && status >= 500)) {
    return FRIENDLY.busy;
  }
  if (name === "APIConnectionTimeoutError") return FRIENDLY.timeout;
  if (name === "APIConnectionError") return FRIENDLY.connection;
  if (status !== undefined || name.startsWith("API")) return FRIENDLY.generic;

  // Not an API error: these are messages this project wrote itself (for
  // example "Could not detect the CSV structure."). Pass short ones through.
  if (message && message.length <= 200 && !/[{}]/.test(message)) return message;
  return FRIENDLY.generic;
}
