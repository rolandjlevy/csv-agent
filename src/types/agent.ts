// Re-exported from lib/agent-core.d.ts so client code (hooks, components)
// has one place to import event types from, without reaching into lib/.
export type { AgentEvent } from "@lib/agent-core";

export interface AgentStats {
  turns: number;
  toolCalls: number;
  durationMs: number;
}

export interface CsvInfo {
  name: string;
  rows: number;
  columns: string[];
}

export type AgentStatus =
  | "idle"
  | "uploading"
  | "ready"
  | "running"
  | "done"
  | "error";
