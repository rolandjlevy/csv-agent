'use client';

import { useAbout } from '@/components/about-context';

export function AboutButton() {
  const { open } = useAbout();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="About Statement Sorter"
      className="flex h-11 items-center rounded-full border border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      About
    </button>
  );
}
