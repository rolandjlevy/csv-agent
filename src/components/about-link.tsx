'use client';

import { useAbout } from '@/components/about-context';

// Inline text link that opens the About dialog, so the maker's name in the
// header does the same thing as the About button.
export function AboutLink({ children }: { children: React.ReactNode }) {
  const { open } = useAbout();

  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      className="text-accent underline underline-offset-4 hover:opacity-80"
    >
      {children}
    </button>
  );
}
