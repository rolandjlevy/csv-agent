"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { friendlyRejection } from "@/lib/file-errors";

// Vercel rejects request bodies over 4.5MB, and the CSV is sent inside a JSON
// body with other fields, so the limit is kept well below that.
const MAX_FILE_SIZE = 3.5 * 1024 * 1024;

interface IntakeOptions {
  onFileAccepted: (file: File) => Promise<void>;
  onSampleClick: (kind: "clean" | "messy") => Promise<void>;
}

// Everything that gets a CSV into the app: the two sample buttons (in the hero)
// and the own-file dropzone (below it) share one error message, so the state
// lives here and the page hands the result to both.
export function useCsvIntake({ onFileAccepted, onSampleClick }: IntakeOptions) {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      setLocalError(null);

      if (rejections.length > 0) {
        setLocalError(friendlyRejection(rejections[0]));
        return;
      }

      const file = accepted[0];
      if (!file) return;

      try {
        await onFileAccepted(file);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to read CSV.");
      }
    },
    [onFileAccepted]
  );

  // The card is a drop target, and the "Choose a file" button is the one thing
  // that opens the picker, so clicks and key presses on the card itself do nothing.
  const dropzone = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    noKeyboard: true,
    accept: {
      "text/csv": [".csv"],
      "text/tab-separated-values": [".tsv"],
    },
  });

  const handleSampleClick = useCallback(
    async (kind: "clean" | "messy") => {
      setLocalError(null);
      try {
        await onSampleClick(kind);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load sample data.");
      }
    },
    [onSampleClick]
  );

  return { localError, handleSampleClick, dropzone };
}

export type CsvIntake = ReturnType<typeof useCsvIntake>;

export function OwnFileCard({ intake, isLoading }: { intake: CsvIntake; isLoading: boolean }) {
  const { getRootProps, getInputProps, isDragActive, open } = intake.dropzone;

  return (
    <div {...getRootProps()}>
      <section
        aria-labelledby="own-file-title"
        className={`flex flex-wrap items-center gap-x-5 gap-y-4 rounded-md border-2 border-dashed px-7 py-6 transition-colors ${
          isDragActive ? "border-accent bg-accent-muted" : "border-accent/60 bg-bg-surface"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps({ "aria-label": "Choose a CSV or TSV file" })} disabled={isLoading} />
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 16V5" />
            <path d="M7 10l5-5 5 5" />
            <path d="M5 19h14" />
          </svg>
        </span>
        <div className="min-w-[240px] flex-1">
          <h2 id="own-file-title" className="font-display text-[22px] font-semibold tracking-tight text-text">
            Or use your own file
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            {isLoading ? "Reading file..." : isDragActive ? "Drop it here." : "Drop a CSV or TSV here, or choose one. Up to 3.5MB."}
          </p>
        </div>
        <button
          type="button"
          onClick={open}
          disabled={isLoading}
          className="min-h-12 w-full cursor-pointer rounded-full border-2 border-accent bg-bg-surface px-6 py-2.5 text-[15px] font-semibold text-accent transition-colors hover:bg-accent-muted disabled:cursor-default sm:w-auto"
        >
          Choose a file
        </button>
      </section>
    </div>
  );
}

// Quiet by design: two hairlines and an icon, not a coloured box. It still
// says plainly where the file goes, which is the important part.
export function DemoNotice() {
  return (
    <div role="note" className="flex items-start gap-3 border-y border-text-faint/40 px-1 py-4">
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-accent"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
      <p className="text-[13px] leading-relaxed text-text-muted">
        <span className="font-semibold text-text">This is a demo.</span> Everything you run, sample
        or upload, is sent to our server and to Anthropic&rsquo;s AI to be read. Please use fictional
        or anonymised data, not real client files.{" "}
        <a href="/privacy" className="text-accent underline underline-offset-4">
          Privacy
        </a>
      </p>
    </div>
  );
}
