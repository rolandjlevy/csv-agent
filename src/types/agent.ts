// Re-exported from lib/ so client code (hooks, components) has one place to
// import shared types from, without reaching into lib/.
export type { AgentEvent } from "@lib/agent-core";
export type { AdaptProfile } from "@lib/csv-adapt";

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
  | "confirming"
  | "ready"
  | "running"
  | "done"
  | "error";
