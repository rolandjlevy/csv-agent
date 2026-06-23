"use client";

import { motion } from "framer-motion";
import type { AgentEvent } from "@lib/agent-core";
import { ThinkingStep, ToolStep } from "./agent-step";

type TurnItem =
  | { kind: "thinking"; text: string }
  | {
      kind: "tool";
      tool: string;
      input: Record<string, unknown>;
      result?: unknown;
      durationMs?: number;
    };

interface TurnGroup {
  turn: number;
  items: TurnItem[];
}

function groupSteps(steps: AgentEvent[]): TurnGroup[] {
  const groups: TurnGroup[] = [];
  const byTurn = new Map<number, TurnGroup>();

  for (const event of steps) {
    if (event.type === "turn_start") {
      if (!byTurn.has(event.turn)) {
        const group: TurnGroup = { turn: event.turn, items: [] };
        groups.push(group);
        byTurn.set(event.turn, group);
      }
    } else if (event.type === "thinking") {
      byTurn.get(event.turn)?.items.push({ kind: "thinking", text: event.text });
    } else if (event.type === "tool_call") {
      byTurn.get(event.turn)?.items.push({ kind: "tool", tool: event.tool, input: event.input });
    } else if (event.type === "tool_result") {
      const group = byTurn.get(event.turn);
      if (!group) continue;
      const pending = [...group.items]
        .reverse()
        .find((item): item is Extract<TurnItem, { kind: "tool" }> =>
          item.kind === "tool" && item.tool === event.tool && item.result === undefined
        );
      if (pending) {
        pending.result = event.result;
        pending.durationMs = event.duration_ms;
      }
    }
  }

  return groups;
}

interface AgentFeedProps {
  question: string;
  steps: AgentEvent[];
}

export function AgentFeed({ question, steps }: AgentFeedProps) {
  const turns = groupSteps(steps);

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="self-start rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm text-text"
      >
        <span className="mr-1.5">❓</span>
        {question}
      </motion.div>

      {turns.map((group) => (
        <div key={group.turn} className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
            🔄 Turn {group.turn}
          </p>
          <div className="flex flex-col gap-2 border-l border-border-subtle pl-4">
            {group.items.map((item, i) =>
              item.kind === "thinking" ? (
                <ThinkingStep key={i} text={item.text} />
              ) : (
                <ToolStep
                  key={i}
                  tool={item.tool}
                  input={item.input}
                  result={item.result}
                  durationMs={item.durationMs}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
