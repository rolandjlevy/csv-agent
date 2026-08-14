// A raw Anthropic Messages API message (user/assistant turn) as threaded
// through `history`/`messages` for follow-up questions. Kept loosely typed
// here rather than importing the SDK's MessageParam, matching this file's
// existing dependency-light style.
export type AgentMessage = { role: "user" | "assistant"; content: unknown };

export type AgentEvent =
  | { type: "turn_start"; turn: number }
  | { type: "tool_call"; turn: number; tool: string; input: Record<string, unknown> }
  | { type: "tool_result"; turn: number; tool: string; result: unknown; duration_ms: number }
  | { type: "thinking"; turn: number; text: string }
  | { type: "answer"; text: string }
  | { type: "done"; total_turns: number; duration_ms: number; messages: AgentMessage[] }
  | { type: "error"; message: string };

export interface RunAgentLoopOptions {
  onEvent?: (event: AgentEvent) => void | Promise<void>;
  apiKey?: string;
  /** Prior conversation messages (as returned from an earlier runAgentLoop
   * call's `messages`) — pass back in to ask a follow-up question with full
   * context, instead of starting a fresh conversation. */
  history?: AgentMessage[];
  /** ISO currency code (e.g. "USD", "EUR") detected by csv-adapt's
   * detectProfile. Defaults to GBP when omitted. */
  currency?: string;
}

export interface RunAgentLoopResult {
  text: string;
  totalTurns: number;
  durationMs: number;
  /** Full updated conversation, including this turn — pass as `history` on
   * the next runAgentLoop call to continue the conversation. */
  messages: AgentMessage[];
}

export function runAgentLoop(
  filePath: string,
  question: string,
  options?: RunAgentLoopOptions
): Promise<RunAgentLoopResult | null>;

export function executeTool(name: string, input: Record<string, unknown>): Promise<unknown>;

export function buildSystemPrompt(currencyCode?: string): string;

export const TOOL_DEFINITIONS: Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}>;
export const SYSTEM_PROMPT: string;
export const MODEL: string;
export const MAX_TURNS: number;
export const MAX_TOKENS: number;
