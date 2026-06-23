"use client";

import { useEffect, useRef, useState } from "react";

interface CsvPreviewProps {
  columns: string[];
  rows: Record<string, string>[];
}

// Tints cells that look like signed numbers (e.g. transaction amounts) —
// negative red-ish, positive green-ish — purely cosmetic, doesn't assume
// anything about column names so it's safe for any CSV shape.
function numericToneClass(value: string | undefined): string {
  if (!value) return "text-text-muted";
  const cleaned = value.replace(/[£$,]/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return "text-text-muted";
  const num = parseFloat(cleaned);
  if (num < 0) return "text-error/80";
  if (num > 0) return "text-accent/80";
  return "text-text-muted";
}

export function CsvPreview({ columns, rows }: CsvPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkOverflow = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, rows]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="h-[3px] bg-gradient-to-r from-accent via-tool-blue to-transparent" />

      <div ref={scrollRef} className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-elevated/40">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wide text-text-faint"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border-subtle transition-colors last:border-0 odd:bg-transparent even:bg-bg-elevated/30 hover:bg-bg-elevated/70"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className={`whitespace-nowrap px-3 py-2 ${numericToneClass(row[col])}`}
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overflowing && (
        <div className="pointer-events-none absolute inset-y-[3px] right-0 w-10 bg-gradient-to-l from-bg-surface to-transparent" />
      )}
    </div>
  );
}
