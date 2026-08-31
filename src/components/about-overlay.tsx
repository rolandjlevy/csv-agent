'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAbout } from '@/components/about-context';

export function AboutOverlay() {
  const { close } = useAbout();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        role="dialog"
        aria-modal="true"
        aria-label="About Statement Sorter"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg-surface p-6 text-left shadow-xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-4 w-4"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 className="font-display text-lg font-bold text-text">
          About Statement Sorter
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          A minimal, real AI agent that takes a CSV file and a question, then
          decides for itself which tools to call — and in what order — to
          find the answer.
        </p>

        <h2 className="mt-6 font-display text-lg font-bold text-text">
          About me
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          I&rsquo;m a full-stack developer specialising in front-end. I work
          with JavaScript, React, Node, Express and MongoDB — see my other
          projects on{' '}
          <a
            href="https://github.com/rolandjlevy"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            GitHub
          </a>
          , connect on{' '}
          <a
            href="https://www.linkedin.com/in/roland-levy/"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            LinkedIn
          </a>
          , or visit my{' '}
          <a
            href="https://rolandlevy.co.uk/"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            portfolio
          </a>
          .
        </p>
      </motion.div>
    </motion.div>
  );
}
