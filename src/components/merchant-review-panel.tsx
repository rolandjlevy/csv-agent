"use client";

import { CATEGORY_NAMES } from "@/lib/categories";

interface MerchantReviewPanelProps {
  merchants: { key: string; category: string }[];
  onReclassify: (key: string, category: string) => void;
}

const selectClass =
  "rounded-lg border border-border bg-bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none";

export function MerchantReviewPanel({ merchants, onReclassify }: MerchantReviewPanelProps) {
  if (merchants.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface p-4">
      <p className="text-sm font-medium text-text">
        🏷️ {merchants.length} new merchant{merchants.length === 1 ? "" : "s"} classified this
        run — reclassify if wrong
      </p>
      <ul className="flex flex-col gap-2">
        {merchants.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-3">
            <span className="truncate font-mono text-xs text-text-muted">{m.key}</span>
            <select
              className={selectClass}
              value={m.category}
              onChange={(e) => onReclassify(m.key, e.target.value)}
            >
              {CATEGORY_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
