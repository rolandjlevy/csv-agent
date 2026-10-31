'use client';

import { useAbout } from '@/components/about-context';
import { CONTACT_HREF, SITE } from '@/lib/site';

const linkClass =
  'inline-flex min-h-11 items-center px-2 underline-offset-4 hover:text-accent hover:underline';

export function Footer() {
  const { open } = useAbout();

  return (
    <footer className="px-4 py-6 text-center text-sm text-text-muted">
      <p>
        Built by {SITE.maker}. &copy; 2026 {SITE.name}.
      </p>
      <nav aria-label="Footer" className="mt-1 flex flex-wrap items-center justify-center">
        <a href={SITE.repo} target="_blank" rel="noreferrer" className={linkClass}>
          Source code
        </a>
        <a href={SITE.linkedin} target="_blank" rel="noreferrer" className={linkClass}>
          LinkedIn
        </a>
        <a href={SITE.portfolio} target="_blank" rel="noreferrer" className={linkClass}>
          Portfolio
        </a>
        <a href={CONTACT_HREF} className={linkClass}>
          Contact
        </a>
        <button type="button" onClick={open} className={linkClass}>
          About
        </button>
        <a href="/privacy" className={linkClass}>
          Privacy
        </a>
      </nav>
    </footer>
  );
}
