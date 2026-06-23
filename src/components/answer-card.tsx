"use client";

import { motion } from "framer-motion";
import type { AgentStats } from "@/types/agent";
import { MarkdownLite } from "./markdown-lite";

interface AnswerCardProps {
  text: string;
  stats: AgentStats | null;
}

export function AnswerCard({ text, stats }: AnswerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="rounded-lg border border-border-subtle border-l-2 border-l-accent bg-bg-surface px-6 py-5"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">💬 Answer</p>
      <div className="text-[15px] leading-relaxed text-text">
        <MarkdownLite text={text} />
      </div>

      {stats && (
        <div className="mt-4 rounded-md bg-bg-elevated px-3 py-2 text-xs text-text-faint">
          {stats.turns} turns · {stats.toolCalls} tool calls ·{" "}
          {(stats.durationMs / 1000).toFixed(1)}s
        </div>
      )}
    </motion.div>
  );
}
