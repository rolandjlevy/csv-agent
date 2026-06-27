"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TermProps {
  /** The word(s) shown inline in the sentence. */
  children: React.ReactNode;
  /** The detail revealed on hover/focus. */
  detail: string;
}

// An inline keyword with a styled popover that reveals more detail on hover or
// keyboard focus. Used in the homepage intro line to keep the sentence short
// while still letting curious visitors dig into each concept.
export function Term({ children, detail }: TermProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        className="cursor-help font-medium text-text underline decoration-dotted decoration-text-faint underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus:text-accent focus:outline-none"
      >
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-left text-xs font-normal leading-relaxed text-text-muted shadow-lg"
          >
            {detail}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
