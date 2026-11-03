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
    <section
      aria-labelledby="recipe-title"
      className="flex flex-col gap-5 rounded-lg border border-accent/40 bg-tint p-6 md:p-8"
    >
      <div>
        <h2 id="recipe-title" className="font-display text-[22px] font-semibold tracking-tight text-text">
          Apply your saved recipe &ldquo;{name}&rdquo;?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          <span className="font-mono text-text">{fileName}</span> matches this recipe&rsquo;s bank
          format. It will skip straight to a categorised P&amp;L and reuse what it already knows
          about your merchants.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <button
          type="button"
          onClick={onRun}
          className="min-h-12 cursor-pointer rounded-full bg-cta px-6 text-[15px] font-semibold text-cta-text transition-opacity hover:opacity-90"
        >
          Run recipe
        </button>
        <button
          type="button"
          onClick={onReview}
          className="min-h-11 cursor-pointer text-sm font-medium text-accent underline underline-offset-4 hover:opacity-80"
        >
          Review mapping instead
        </button>
      </div>
    </section>
  );
}
