"use client";

import { useState, useRef, useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TermProps {
  /** The word(s) shown inline in the sentence. */
  children: React.ReactNode;
  /** The detail revealed on hover/focus. */
  detail: string;
  /** Set when the term sits on the dark teal band, so it reads white. */
  onBand?: boolean;
}

// An inline keyword with a styled popover that reveals more detail on hover or
// keyboard focus. Used in the homepage intro line to keep the sentence short
// while still letting curious visitors dig into each concept.
export function Term({ children, detail, onBand = false }: TermProps) {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(0);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    const padding = 8;
    if (rect.left < padding) {
      setNudge(padding - rect.left);
    } else if (rect.right > window.innerWidth - padding) {
      setNudge(window.innerWidth - padding - rect.right);
    } else {
      setNudge(0);
    }
  }, [open]);

  // Escape dismisses the hint without moving focus (WCAG 1.4.13).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleOpen = () => {
    setNudge(0);
    setOpen(true);
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleOpen}
      onMouseLeave={() => setOpen(false)}
      onFocus={handleOpen}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        className={`cursor-help font-medium underline decoration-dotted underline-offset-4 transition-colors ${
          onBand
            ? "text-white decoration-white/70 hover:decoration-white"
            : "text-text decoration-text-faint hover:text-accent hover:decoration-accent focus:text-accent"
        }`}
      >
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <motion.span
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ marginLeft: nudge }}
            className={`absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg px-3 py-2 text-left text-xs font-normal leading-relaxed shadow-lg ${
              onBand
                ? "bg-[#0f1b33] text-[#e6edf7] dark:bg-bg-elevated dark:text-text dark:ring-1 dark:ring-border"
                : "border border-border bg-bg-elevated text-text-muted"
            }`}
          >
            {detail}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
