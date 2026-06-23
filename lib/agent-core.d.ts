export type AgentEvent =
  | { type: "turn_start"; turn: number }
  | { type: "tool_call"; turn: number; tool: string; input: Record<string, unknown> }
  | { type: "tool_result"; turn: number; tool: string; result: unknown; duration_ms: number }
  | { type: "thinking"; turn: number; text: string }
  | { type: "answer"; text: string }
  | { type: "done"; total_turns: number; duration_ms: number }
  | { type: "error"; message: string };

export interface RunAgentLoopOptions {
  onEvent?: (event: AgentEvent) => void | Promise<void>;
  apiKey?: string;
}

export interface RunAgentLoopResult {
  text: string;
  totalTurns: number;
  durationMs: number;
}

export function runAgentLoop(
  filePath: string,
  question: string,
  options?: RunAgentLoopOptions
): Promise<RunAgentLoopResult | null>;

export function executeTool(name: string, input: Record<string, unknown>): Promise<unknown>;

export const TOOL_DEFINITIONS: Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}>;
export const SYSTEM_PROMPT: string;
export const MODEL: string;
export const MAX_TURNS: number;
export const MAX_TOKENS: number;
