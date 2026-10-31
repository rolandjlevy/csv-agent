"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion } from "framer-motion";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface CsvDropzoneProps {
  onFileAccepted: (file: File) => Promise<void>;
  onSampleClick: (kind: "clean" | "messy") => Promise<void>;
  isLoading: boolean;
}

export function CsvDropzone({ onFileAccepted, onSampleClick, isLoading }: CsvDropzoneProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      setLocalError(null);

      if (rejections.length > 0) {
        const reason = rejections[0].errors[0]?.message ?? "File could not be accepted.";
        setLocalError(reason);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
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

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 px-4">
      <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-bg-surface px-5 py-5 text-center sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => handleSampleClick("messy")}
          disabled={isLoading}
          className="min-h-12 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Try it with a messy bank export
        </button>
        <p className="text-xs leading-relaxed text-text-faint">
          See it untangle the columns, strip the £ signs and sort the lot in a few seconds.
        </p>
        <button
          type="button"
          onClick={() => handleSampleClick("clean")}
          disabled={isLoading}
          className="min-h-11 px-3 text-sm text-text-muted underline-offset-4 hover:text-text hover:underline disabled:opacity-50"
        >
          Or try the clean sample
        </button>
      </div>

      <div className="flex w-full items-center gap-3 text-xs text-text-faint">
        <span className="h-px flex-1 bg-border-subtle" />
        or use your own file
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <div
        {...getRootProps()}
        className={`dropzone-idle w-full cursor-pointer rounded-xl border-2 border-dashed bg-accent-muted transition-colors duration-300 ${
          isDragActive ? "border-accent bg-accent/20" : "border-border hover:border-accent"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps({ "aria-label": "Choose a CSV or TSV file" })} disabled={isLoading} />
        <motion.div
          animate={{ scale: isDragActive ? 1.01 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex flex-col items-center gap-2 px-6 py-8 text-center sm:py-10"
        >
          {isLoading ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="animate-spin text-accent">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-accent"
              aria-hidden="true"
            >
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <path d="M14 3v6h6" />
              <path d="M8 13h8" />
              <path d="M8 17h5" />
            </svg>
          )}
          <p className="text-sm font-medium text-text">
            {isLoading
              ? "Reading file..."
              : isDragActive
                ? "Drop it here"
                : "Drop a CSV here or tap to browse"}
          </p>
          <p className="text-xs text-text-faint">.csv or .tsv · max 5MB</p>
          <p className="mt-1 text-xs font-medium text-text">
            Demo only: please don&rsquo;t upload real client data.
          </p>
        </motion.div>
      </div>

      <p className="text-center text-xs leading-relaxed text-text-faint">
        Everything you run, sample or upload, is sent to our server and to
        Anthropic&rsquo;s AI to be read. The sample data is fictional.{' '}
        <a href="/privacy" className="underline underline-offset-4 hover:text-text-muted">
          Privacy
        </a>
      </p>

      {localError && (
        <p role="alert" className="text-sm text-error">
          {localError}
        </p>
      )}
    </div>
  );
}
