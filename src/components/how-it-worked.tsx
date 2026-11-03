"use client";

import { useState } from "react";
import type { AgentEvent } from "@lib/agent-core";
import type { AgentStats } from "@/types/agent";
import { formatDuration, formatToolCallSummary, formatToolResultSummary } from "@/lib/step-format";
import { renderInline } from "./markdown-lite";

type Item =
  | { kind: "thinking"; turn: number; text: string }
  | {
      kind: "tool";
      turn: number;
      tool: string;
      input: Record<string, unknown>;
      result?: unknown;
      durationMs?: number;
    };

// Flattens the agent's events into one ordered list, pairing each tool result
// with the call it answers.
function toItems(steps: AgentEvent[]): Item[] {
  const items: Item[] = [];
  for (const event of steps) {
    if (event.type === "thinking") {
      items.push({ kind: "thinking", turn: event.turn, text: event.text });
    } else if (event.type === "tool_call") {
      items.push({ kind: "tool", turn: event.turn, tool: event.tool, input: event.input });
    } else if (event.type === "tool_result") {
      const pending = [...items]
        .reverse()
        .find(
          (item): item is Extract<Item, { kind: "tool" }> =>
            item.kind === "tool" && item.tool === event.tool && item.result === undefined
        );
      if (pending) {
        pending.result = event.result;
        pending.durationMs = event.duration_ms;
      }
    }
  }
  return items;
}

const VISIBLE = 6;

const dotBase = "absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full";

function Dot({ tone }: { tone: "done" | "running" | "error" | "thinking" }) {
  if (tone === "running") {
    return <span aria-hidden="true" className={`${dotBase} bg-tool-blue-bg`}><span className="h-2 w-2 animate-pulse rounded-full bg-tool-blue" /></span>;
  }
  if (tone === "thinking") {
    return <span aria-hidden="true" className={`${dotBase} bg-thinking-bg`}><span className="h-2 w-2 rounded-full bg-thinking-amber" /></span>;
  }
  const colour = tone === "error" ? "bg-error/15 text-error" : "bg-money/15 text-money";
  return (
    <span aria-hidden="true" className={`${dotBase} ${colour}`}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
        {tone === "error" ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
      </svg>
    </span>
  );
}

interface HowItWorkedProps {
  steps: AgentEvent[];
  stats: AgentStats | null;
  status: "running" | "done" | "error";
}

// A compact timeline of what the agent did, live while it works. Long runs
// show the latest steps with a toggle for the rest.
export function HowItWorked({ steps, stats, status }: HowItWorkedProps) {
  const [showAll, setShowAll] = useState(false);
  const items = toItems(steps);
  const hidden = Math.max(0, items.length - VISIBLE);
  const shown = showAll ? items : items.slice(items.length - Math.min(items.length, VISIBLE));
  const lastTurn = items.length ? items[items.length - 1].turn : 1;
  const finalRow = status === "done";

  return (
    <section
      aria-labelledby="how-worked-title"
      className="rounded-lg bg-bg-surface p-5 shadow-[0_0_0_1px_var(--color-border),0_4px_12px_-8px_rgba(2,20,28,0.16)]"
    >
      <h2 id="how-worked-title" className="mb-4 font-display text-[17px] font-semibold tracking-tight text-text">
        How it worked
      </h2>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mb-3 min-h-11 cursor-pointer text-sm font-medium text-accent underline underline-offset-4"
        >
          {showAll ? "Show fewer steps" : `Show all ${items.length} steps`}
        </button>
      )}

      <ol>
        {items.length === 0 && status === "running" && (
          <li className="relative ml-[9px] border-l-2 border-transparent pl-[22px]">
            <Dot tone="running" />
            <p className="text-sm text-text-muted">Starting...</p>
          </li>
        )}

        {shown.map((item, i) => {
          const isLast = i === shown.length - 1 && !finalRow && status !== "running";
          const line = `relative ml-[9px] border-l-2 pb-[18px] pl-[22px] ${
            isLast ? "border-transparent pb-0" : "border-border"
          }`;

          if (item.kind === "thinking") {
            return (
              <li key={i} className={line}>
                <Dot tone="thinking" />
                <p className="text-sm font-semibold text-text">Thinking</p>
                <p className="mt-0.5 line-clamp-3 text-[13px] leading-relaxed text-text-muted">
                  {renderInline(item.text)}
                </p>
              </li>
            );
          }

          const pending = item.result === undefined;
          const isError = !!item.result && typeof item.result === "object" && "error" in item.result;
          return (
            <li key={i} className={line}>
              <Dot tone={pending ? "running" : isError ? "error" : "done"} />
              <p className="font-mono text-[13px] font-medium text-tool-blue">{item.tool}</p>
              <p className="mt-0.5 text-[13px] text-text-muted">{formatToolCallSummary(item.tool, item.input)}</p>
              <p className={`mt-0.5 text-xs ${isError ? "text-error" : "text-text-faint"}`}>
                {pending
                  ? "Running..."
                  : `Turn ${item.turn}, ${formatToolResultSummary(item.tool, item.result)}${
                      item.durationMs !== undefined ? ` in ${formatDuration(item.durationMs)}` : ""
                    }`}
              </p>
            </li>
          );
        })}

        {finalRow && (
          <li className="relative ml-[9px] border-l-2 border-transparent pl-[22px]">
            <Dot tone="done" />
            <p className="text-sm font-semibold text-text">Answer written</p>
            <p className="mt-0.5 text-xs text-text-faint">Turn {lastTurn}</p>
          </li>
        )}
      </ol>

      {stats && (
        <p className="mt-4 border-t border-border-subtle pt-3 text-[13px] text-text-muted">
          {stats.turns} {stats.turns === 1 ? "turn" : "turns"}, {stats.toolCalls}{" "}
          {stats.toolCalls === 1 ? "tool call" : "tool calls"}, {(stats.durationMs / 1000).toFixed(1)} seconds.
        </p>
      )}
    </section>
  );
}
