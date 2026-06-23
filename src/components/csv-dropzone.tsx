"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion } from "framer-motion";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface CsvDropzoneProps {
  onFileAccepted: (file: File) => Promise<void>;
  onSampleClick: () => Promise<void>;
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

  const handleSampleClick = useCallback(async () => {
    setLocalError(null);
    try {
      await onSampleClick();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to load sample data.");
    }
  }, [onSampleClick]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4 px-4">
      <div
        {...getRootProps()}
        className={`dropzone-idle w-full cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
          isDragActive ? "border-accent bg-accent-muted" : "border-border bg-bg-surface"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} disabled={isLoading} />
        <motion.div
          animate={{ scale: isDragActive ? 1.01 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex flex-col items-center gap-3 px-8 py-16 text-center"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={isDragActive ? "text-accent" : "text-text-faint"}
          >
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </svg>
          <p className="text-sm font-medium text-text">
            {isLoading
              ? "Reading file..."
              : isDragActive
                ? "Drop it here"
                : "Drop your CSV here or click to browse"}
          </p>
          <p className="text-xs text-text-faint">.csv or .tsv · max 5MB</p>
        </motion.div>
      </div>

      {localError && <p className="text-sm text-error">{localError}</p>}

      <button
        type="button"
        onClick={handleSampleClick}
        disabled={isLoading}
        className="text-sm text-text-muted underline-offset-4 hover:text-accent hover:underline disabled:opacity-50"
      >
        or try with sample data
      </button>
    </div>
  );
}
