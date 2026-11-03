// How the agent's tool calls and results read in the "How it worked" list.

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatToolCallSummary(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case "read_csv":
      return "Reading uploaded.csv";
    case "analyse": {
      const parts = [String(input.operation ?? "")];
      if (input.column) parts.push(String(input.column));
      if (input.group_by) parts.push(`by ${input.group_by}`);
      if (input.filter) parts.push(`where ${input.filter}`);
      return parts.join(" · ");
    }
    case "write_report":
      return `Writing report to ${input.file_path ?? "report.md"}`;
    case "generate_pl":
      return "Built the P&L";
    default:
      return tool;
  }
}

export function formatToolResultSummary(tool: string, result: unknown): string {
  if (result && typeof result === "object" && "error" in result) {
    return `Error: ${(result as { error: string }).error}`;
  }

  switch (tool) {
    case "read_csv": {
      const r = result as { total_rows?: number; columns?: unknown[] };
      return `${r.total_rows ?? "?"} rows · ${r.columns?.length ?? "?"} columns`;
    }
    case "analyse": {
      const r = result as { result?: unknown; description?: string };
      if (r.description) {
        if (typeof r.result === "object" && r.result !== null) {
          return `${r.description} · ${Object.keys(r.result).length} groups returned`;
        }
        return `${r.description} · ${r.result}`;
      }
      return JSON.stringify(r.result);
    }
    case "write_report": {
      const r = result as { bytes?: number; file_path?: string };
      return `Saved ${r.bytes ?? "?"} bytes to ${r.file_path ?? "file"}`;
    }
    default:
      return "Done";
  }
}
