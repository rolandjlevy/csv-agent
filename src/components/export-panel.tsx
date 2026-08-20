"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { DEFAULT_XERO_ACCOUNT_CODES } from "@/lib/xero-accounts";
import { DEFAULT_QUICKBOOKS_ACCOUNT_NAMES } from "@/lib/quickbooks-accounts";
import { DEFAULT_FREEAGENT_NOMINAL_CODES } from "@/lib/freeagent-accounts";
import { getAccountCodes, mergeAccountCodes } from "@/lib/saved-profiles";

interface ExportPanelProps {
  canonicalCsv: string | null;
  activeProfileName: string | null;
}

const inputClass =
  "w-24 rounded-lg border border-border bg-bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none";

type ExportFormat = "xero" | "quickbooks" | "freeagent";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks Online",
  freeagent: "FreeAgent",
};

const FILENAMES: Record<ExportFormat, string> = {
  xero: "xero-import.csv",
  quickbooks: "quickbooks-import.csv",
  freeagent: "freeagent-import.csv",
};

// Triggers a browser download of a CSV string with no server round-trip for
// the file itself (the mapping already happened server-side; this just
// saves the response).
function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getDefaultCodes(format: ExportFormat): Record<string, string | null> {
  switch (format) {
    case "xero":
      return DEFAULT_XERO_ACCOUNT_CODES;
    case "quickbooks":
      return DEFAULT_QUICKBOOKS_ACCOUNT_NAMES;
    case "freeagent":
      return DEFAULT_FREEAGENT_NOMINAL_CODES;
  }
}

// Lets the user review/edit the account code for every category
// actually present in this file before downloading — categories with no
// code (the exclude bucket, by design — see lib/export/*-accounts.js)
// block the download until filled in, rather than exporting silently blank.
export function ExportPanel({ canonicalCsv, activeProfileName }: ExportPanelProps) {
  const categories = useMemo(() => {
    if (!canonicalCsv) return [];
    const { data } = Papa.parse<{ Category?: string }>(canonicalCsv, {
      header: true,
      skipEmptyLines: true,
    });
    return Array.from(new Set(data.map((r) => r.Category).filter((c): c is string => Boolean(c)))).sort();
  }, [canonicalCsv]);

  const [format, setFormat] = useState<ExportFormat>("xero");

  const savedCodes = useMemo(
    () => (activeProfileName ? getAccountCodes(activeProfileName, format) : {}),
    [activeProfileName, format]
  );

  const [codes, setCodes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const defaults = getDefaultCodes(format);
    for (const category of categories) {
      initial[category] = savedCodes[category] ?? defaults[category] ?? "";
    }
    return initial;
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!canonicalCsv || categories.length === 0) return null;

  const setCode = (category: string, code: string) => {
    setCodes((prev) => ({ ...prev, [category]: code }));
    if (activeProfileName && code.trim()) {
      mergeAccountCodes(activeProfileName, format, { [category]: code.trim() });
    }
  };

  // QB Online CSV import doesn't have an account code column, so no unmapped check needed
  const needsCodeMapping = format !== "quickbooks";
  const unmapped = needsCodeMapping ? categories.filter((c) => !codes[c]?.trim()) : [];
  const canDownload = unmapped.length === 0 && !downloading;

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalCsv, format, accountCodeMap: codes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Export failed.");
      if (data.unmappedCategories?.length > 0) {
        throw new Error(`Still missing a code for: ${data.unmappedCategories.join(", ")}`);
      }
      downloadCsv(data.csv, FILENAMES[format]);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  // Reset codes when format changes
  const defaults = getDefaultCodes(format);
  useMemo(() => {
    const initial: Record<string, string> = {};
    for (const category of categories) {
      initial[category] = savedCodes[category] ?? defaults[category] ?? "";
    }
    setCodes(initial);
  }, [format, categories, savedCodes, defaults]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">📤 Export</p>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          className="rounded-lg border border-border bg-bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="xero">Xero</option>
          <option value="quickbooks">QuickBooks Online</option>
          <option value="freeagent">FreeAgent</option>
        </select>
      </div>

      <p className="text-xs text-text-muted">
        {FORMAT_LABELS[format]} — {format === "quickbooks" ? "No account codes needed (categorised in QB after import)" : "Review account codes for each category"}
        {activeProfileName && (
          <span className="font-normal"> — codes save to your &ldquo;{activeProfileName}&rdquo; recipe</span>
        )}
      </p>

      {needsCodeMapping && (
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <li key={category} className="flex items-center justify-between gap-3">
              <span className="truncate text-xs text-text-muted">{category}</span>
              <input
                type="text"
                className={`${inputClass} ${!codes[category]?.trim() ? "border-error/50" : ""}`}
                placeholder="code"
                value={codes[category] ?? ""}
                onChange={(e) => setCode(category, e.target.value)}
              />
            </li>
          ))}
        </ul>
      )}

      {unmapped.length > 0 && (
        <p className="text-xs text-error">
          Add an account code for: {unmapped.join(", ")} before downloading.
        </p>
      )}
      {downloadError && <p className="text-xs text-error">{downloadError}</p>}

      <button
        type="button"
        onClick={handleDownload}
        disabled={!canDownload}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {downloading ? "Preparing…" : `Download for ${FORMAT_LABELS[format]}`}
      </button>
    </div>
  );
}
