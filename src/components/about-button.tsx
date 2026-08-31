'use client';

import { useAbout } from '@/components/about-context';

export function AboutButton() {
  const { open } = useAbout();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="About Statement Sorter"
      className="flex h-9 items-center rounded-full border border-border bg-bg-surface px-3 text-xs font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      About
    </button>
  );
}
