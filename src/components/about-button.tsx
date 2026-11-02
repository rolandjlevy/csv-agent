'use client';

import { useAbout } from '@/components/about-context';

export function AboutButton() {
  const { open } = useAbout();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="About Statement Sorter"
      className="flex min-h-11 cursor-pointer items-center px-3 text-sm text-band-text transition-colors hover:text-white"
    >
      About
    </button>
  );
}
