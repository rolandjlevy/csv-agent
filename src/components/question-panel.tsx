'use client';

import { useState } from 'react';

// Line icons (24px grid) for each suggested question. The first question is
// the featured one: the most useful thing to ask of a fresh file.
const ICONS = {
  profit: (
    <>
      <path d="M4 17l6-6 4 4 6-7" />
      <path d="M15 8h5v5" />
    </>
  ),
  unclassified: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" />
      <path d="M12 17h.01" />
    </>
  ),
  month: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
      <path d="M9 3v4" />
      <path d="M15 3v4" />
    </>
  ),
  vat: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  most: (
    <>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </>
  ),
  odd: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  subs: (
    <>
      <path d="M4 12a8 8 0 0 1 14-5l2 2" />
      <path d="M20 4v5h-5" />
      <path d="M20 12a8 8 0 0 1-14 5l-2-2" />
      <path d="M4 20v-5h5" />
    </>
  ),
} as const;

const QUESTIONS: { icon: keyof typeof ICONS; text: string }[] = [
  { icon: 'profit', text: "What's my net profit for the period?" },
  { icon: 'unclassified', text: "What's still unclassified?" },
  { icon: 'month', text: 'Total overheads by month?' },
  { icon: 'vat', text: 'Anything that looks like VAT or a transfer?' },
  { icon: 'most', text: 'What did I spend most on?' },
  { icon: 'odd', text: 'Any unusual transactions?' },
  { icon: 'subs', text: 'How much went to subscriptions?' },
];

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className="shrink-0"
    >
      {ICONS[name]}
    </svg>
  );
}

interface QuestionPanelProps {
  onSubmit: (question: string) => void;
}

export function QuestionPanel({ onSubmit }: QuestionPanelProps) {
  const [value, setValue] = useState('');

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <section
      aria-labelledby="ask-title"
      className="flex flex-col gap-5 rounded-lg bg-tint p-6 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_30%,transparent),0_4px_12px_-8px_rgba(2,20,28,0.14)] md:p-7"
    >
      <h2 id="ask-title" className="font-display text-[26px] font-semibold tracking-tight text-text">
        What do you want to know?
      </h2>

      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((q, i) => (
          <button
            key={q.text}
            type="button"
            onClick={() => submit(q.text)}
            className={
              i === 0
                ? 'inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full bg-band px-5 py-2 text-left text-[15px] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-cta dark:text-cta-text'
                : 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-accent/40 bg-bg-surface px-4 py-2 text-left text-sm text-text transition-colors hover:border-accent hover:bg-accent-muted'
            }
          >
            <span className={i === 0 ? 'text-cta dark:text-cta-text' : 'text-accent'}>
              <Icon name={q.icon} />
            </span>
            {q.text}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="question" className="sr-only">
          Ask a question about your data
        </label>
        <input
          id="question"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setValue('');
          }}
          placeholder="Ask anything about your data..."
          className="min-h-[52px] min-w-0 flex-1 rounded-full border-[1.5px] border-accent/60 bg-bg-surface px-5 text-base text-text placeholder:text-text-faint focus:border-accent"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Submit question"
          className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-cta text-cta-text transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </section>
  );
}
