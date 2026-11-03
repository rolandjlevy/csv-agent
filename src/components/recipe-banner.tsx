"use client";


interface RecipeBannerProps {
  name: string;
  fileName: string;
  onRun: () => void;
  onReview: () => void;
}

// The one-click fast path: shown instead of the full ColumnConfirmPanel when
// a saved profile matches (by bank name or column layout) this file. "Run
// recipe" skips straight to a P&L with no further input; "Review mapping
// instead" falls through to the existing full panel, pre-filled from the
// same match.
export function RecipeBanner({ name, fileName, onRun, onReview }: RecipeBannerProps) {
  return (
    // Opaque (bg-tint, not a translucent tint): this card overlaps the dark band.
    <div className="flex flex-col items-center gap-4 rounded-lg border border-accent/40 bg-tint p-6 text-center">
      <div>
        <p className="text-base font-semibold text-text">
          📎 Apply saved recipe &ldquo;{name}&rdquo;?
        </p>
        <p className="mt-1 text-sm text-text-muted">
          <span className="font-mono text-text">{fileName}</span> matches this recipe&rsquo;s
          bank format — it&rsquo;ll skip straight to a categorised P&amp;L, reusing everything
          it already knows about your merchants.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onRun}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          ▶ Run recipe
        </button>
        <button
          type="button"
          onClick={onReview}
          className="text-sm text-text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          Review mapping instead
        </button>
      </div>
    </div>
  );
}
