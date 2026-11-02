"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** id of the element that labels this field (preferred over ariaLabel). */
  labelledBy?: string;
  ariaLabel?: string;
  /** Shown when `value` matches no option. */
  placeholder?: string;
  size?: "md" | "sm";
  /** Which edge of the trigger the list lines up with. */
  align?: "left" | "right";
  className?: string;
}

const LIST_MAX_HEIGHT = 256;

// A styled replacement for the native <select>, whose popup the browser draws
// and which can't be themed. It follows the "select-only combobox" pattern:
// focus stays on the trigger, arrow keys move through the options, Enter or
// Space picks one, Escape closes, and typing jumps to a matching option.
export function Select({
  value,
  onChange,
  options,
  labelledBy,
  ariaLabel,
  placeholder = "Select...",
  size = "md",
  align = "left",
  className = "",
}: SelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const openList = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Open upward when there isn't room below and there is more above.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    setDropUp(below < LIST_MAX_HEIGHT + 8 && rect.top > below);
  }, [open]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId only depends on baseId
  }, [open, active]);

  // A press anywhere outside closes the list.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const state = typeahead.current;
    return () => window.clearTimeout(state.timer);
  }, []);

  const jumpTo = (text: string) => {
    const state = typeahead.current;
    window.clearTimeout(state.timer);
    state.text += text.toLowerCase();
    state.timer = window.setTimeout(() => (state.text = ""), 600);
    const from = open ? active : selectedIndex;
    // Repeating one letter cycles through the options that start with it.
    const needle = state.text.split("").every((c) => c === state.text[0]) ? state.text[0] : state.text;
    for (let step = 1; step <= options.length; step++) {
      const i = (from + step) % options.length;
      if (options[i].label.toLowerCase().replace(/^[^a-z0-9]+/, "").startsWith(needle)) {
        if (open) setActive(i);
        else onChange(options[i].value);
        return;
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        jumpTo(event.key);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) jumpTo(event.key);
    }
  };

  const sizing = size === "sm" ? "min-h-9 px-2.5 py-1 text-xs" : "min-h-11 px-3 py-2 text-sm";
  const selected = options[selectedIndex];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-bg-surface text-left text-text transition-colors hover:border-accent ${sizing} ${
          open ? "border-accent" : "border-border"
        }`}
      >
        <span className={`truncate ${selected ? "" : "text-text-faint"}`}>{selected?.label ?? placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          aria-label={labelledBy ? undefined : ariaLabel}
          style={{ maxHeight: LIST_MAX_HEIGHT }}
          className={`absolute z-30 w-max min-w-full max-w-[min(22rem,calc(100vw-2rem))] overflow-auto rounded-lg border border-border bg-bg-surface py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          {options.map((option, i) => {
            const isSelected = i === selectedIndex;
            return (
              <li
                key={option.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                // Keep focus on the trigger: a mouse press must not blur it.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  i === active ? "bg-accent-muted text-text" : "text-text"
                } ${isSelected ? "font-medium" : ""}`}
              >
                <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center text-accent">
                  {isSelected && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <span className="whitespace-nowrap">{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
