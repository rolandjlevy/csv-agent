import { CsvPreview } from "@/components/csv-preview";

interface FileSheetProps {
  name: string;
  totalRows: number;
  columns: string[];
  rows: Record<string, string>[];
  onChangeFile: () => void;
}

// The loaded file as one white sheet: who it is, a preview, and the way out.
export function FileSheet({ name, totalRows, columns, rows, onChangeFile }: FileSheetProps) {
  return (
    <section
      aria-label="Your file"
      className="overflow-hidden rounded-lg bg-bg-surface shadow-[0_0_0_1px_var(--color-border),0_4px_12px_-8px_rgba(2,20,28,0.16)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-[18px] py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M14 3v6h6" />
              <path d="M8 13h8" />
              <path d="M8 17h5" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[15px] font-medium text-text">{name}</p>
            <p className="mt-0.5 text-[13px] text-text-muted">
              {totalRows} rows, {columns.length} columns
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeFile}
          className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-accent underline underline-offset-4 hover:opacity-80"
        >
          &larr; Change file
        </button>
      </div>

      <CsvPreview columns={columns} rows={rows} />

      <p className="border-t border-border-subtle px-[18px] pb-3 pt-2.5 text-xs text-text-faint">
        Showing the first {rows.length} of {totalRows} rows.
      </p>
    </section>
  );
}
