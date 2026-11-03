"use client";

import { CATEGORY_NAMES } from "@/lib/categories";
import { Select } from "@/components/select";
import { CARD } from "@/lib/card-style";

interface MerchantReviewPanelProps {
  merchants: { key: string; category: string }[];
  onReclassify: (key: string, category: string) => void;
  profileName?: string | null;
}

export function MerchantReviewPanel({ merchants, onReclassify, profileName }: MerchantReviewPanelProps) {
  if (merchants.length === 0) return null;

  const count = `${merchants.length} new merchant${merchants.length === 1 ? "" : "s"} classified`;

  return (
    <section aria-labelledby="merchant-title" className={`flex flex-col gap-4 ${CARD}`}>
      <div>
        <h2 id="merchant-title" className="font-display text-[19px] font-semibold tracking-tight text-text">
          {count}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {profileName
            ? `Saved to your \u201c${profileName}\u201d recipe. Change any that look wrong.`
            : "Change any that look wrong."}
        </p>
      </div>
      <ul className="divide-y divide-border-subtle border-t border-border-subtle">
        {merchants.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-3 py-2.5">
            <span className="truncate font-mono text-xs text-text-muted">{m.key}</span>
            <Select
              size="sm"
              align="right"
              ariaLabel={`Category for ${m.key}`}
              value={m.category}
              onChange={(category) => onReclassify(m.key, category)}
              options={CATEGORY_NAMES.map((name) => ({ value: name, label: name }))}
              className="w-56 shrink-0"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
