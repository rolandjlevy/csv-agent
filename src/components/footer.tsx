'use client';

import { useAbout } from '@/components/about-context';

export function Footer() {
  const { open } = useAbout();

  return (
    <footer className="px-4 py-6 text-center text-xs text-text-muted">
      &copy; 2026 Statement Sorter. All rights reserved.{' '}
      <a
        href="mailto:rolandjlevy@gmail.com"
        className="underline-offset-4 hover:text-accent hover:underline"
      >
        Contact
      </a>
      .{' '}
      <button
        type="button"
        onClick={open}
        className="underline-offset-4 hover:text-accent hover:underline"
      >
        About
      </button>
      .
    </footer>
  );
}
