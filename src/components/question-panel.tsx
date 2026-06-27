"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const PREDEFINED_QUESTIONS = [
  { emoji: "💰", text: "What did I spend most on?" },
  { emoji: "📅", text: "Show me a monthly breakdown" },
  { emoji: "📊", text: "What's my average daily spend?" },
  { emoji: "🔍", text: "Any unusual transactions?" },
  { emoji: "📺", text: "How much went to subscriptions?" },
  { emoji: "🤔", text: "Which of these subscriptions would I miss the least?" },
  {
    emoji: "✂️",
    text: "Canceling which subscriptions save the most while having the smallest impact?",
  },
  { emoji: "💸", text: "Which subscriptions provide the lowest value per dollar?" },
  { emoji: "🎯", text: "Help me build a plan to reduce my spending by £25 per month." },
  { emoji: "📝", text: "Write me a spending report" },
];

interface QuestionPanelProps {
  onSubmit: (question: string) => void;
}

export function QuestionPanel({ onSubmit }: QuestionPanelProps) {
  const [value, setValue] = useState("");

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-text">What do you want to know?</h2>

      <div className="flex flex-wrap gap-2">
        {PREDEFINED_QUESTIONS.map((q, i) => (
          <motion.button
            key={q.text}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => submit(q.text)}
            className="rounded-full border border-border bg-bg-elevated px-3.5 py-1.5 text-sm text-text-muted transition-colors hover:border-accent hover:bg-accent-muted hover:text-text"
          >
            <span className="mr-1.5">{q.emoji}</span>
            {q.text}
          </motion.button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setValue("");
          }}
          placeholder="Ask anything about your data..."
          className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Submit question"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
