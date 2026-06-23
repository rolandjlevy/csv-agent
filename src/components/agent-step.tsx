"use client";

import { motion, AnimatePresence } from "framer-motion";
import { renderInline } from "./markdown-lite";

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatToolCallSummary(tool: string, input: Record<string, unknown>): string {
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
    default:
      return tool;
  }
}

function formatToolResultSummary(tool: string, result: unknown): string {
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

const stepVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function ThinkingStep({ text }: { text: string }) {
  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-lg border border-border-subtle border-l-2 border-l-thinking-amber bg-thinking-bg px-4 py-3"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-thinking-amber">
        💭 Thinking
      </p>
      <p className="text-sm leading-relaxed text-text-muted">{renderInline(text)}</p>
    </motion.div>
  );
}

interface ToolStepProps {
  tool: string;
  input: Record<string, unknown>;
  result?: unknown;
  durationMs?: number;
}

export function ToolStep({ tool, input, result, durationMs }: ToolStepProps) {
  const pending = result === undefined;
  const isError = result && typeof result === "object" && "error" in result;

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`rounded-lg border border-border-subtle border-l-2 bg-bg-surface px-4 py-3 ${
        isError ? "border-l-error" : "border-l-tool-blue"
      } ${pending ? "tool-card-pending" : ""}`}
    >
      <p className="mb-1 font-mono text-xs font-medium text-tool-blue">🔧 {tool}</p>
      <p className="text-sm text-text-muted">{formatToolCallSummary(tool, input)}</p>

      <AnimatePresence mode="wait">
        {pending ? (
          <motion.p
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs text-text-faint"
          >
            Running...
          </motion.p>
        ) : (
          <motion.p
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-2 flex items-center gap-1.5 text-xs ${
              isError ? "text-error" : "text-text-faint"
            }`}
          >
            <span className={isError ? "text-error" : "text-accent"}>
              {isError ? "✕" : "✅"}
            </span>
            {formatToolResultSummary(tool, result)}
            {durationMs !== undefined && <span> · {formatDuration(durationMs)}</span>}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
