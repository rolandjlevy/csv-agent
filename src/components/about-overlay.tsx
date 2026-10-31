'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAbout } from '@/components/about-context';
import { CONTACT_HREF, SITE } from '@/lib/site';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AboutOverlay() {
  const { close } = useAbout();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [close]);

  const linkClass = 'text-accent underline-offset-4 hover:underline';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-product-title"
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-bg-surface p-6 text-left shadow-xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2
          id="about-product-title"
          className="pr-12 font-display text-lg font-bold text-text"
        >
          About Statement Sorter
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Statement Sorter takes a bank CSV export, however messy the layout,
          and turns it into a categorised P&amp;L ready to export into Xero,
          QuickBooks or FreeAgent. Underneath, it&rsquo;s an AI agent: given a
          file and a question, it decides which tools to call and in what
          order, rather than following a fixed script.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          It&rsquo;s a working demo, so please use the sample data rather than
          real client files.
        </p>

        <h2 className="mt-6 font-display text-lg font-bold text-text">
          Built by {SITE.maker}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          I&rsquo;m a full-stack developer with a front-end focus, building
          responsive, user-centric interfaces for complex, data-heavy products
          in React and Next.js. See my other projects on{' '}
          <a href={SITE.github} target="_blank" rel="noreferrer" className={linkClass}>
            GitHub
          </a>
          , connect on{' '}
          <a href={SITE.linkedin} target="_blank" rel="noreferrer" className={linkClass}>
            LinkedIn
          </a>
          , visit my{' '}
          <a href={SITE.portfolio} target="_blank" rel="noreferrer" className={linkClass}>
            portfolio
          </a>
          , or{' '}
          <a href={CONTACT_HREF} className={linkClass}>
            get in touch
          </a>
          .
        </p>
      </motion.div>
    </motion.div>
  );
}
