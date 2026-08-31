"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { DEFAULT_XERO_ACCOUNT_CODES } from "@/lib/xero-accounts";
import { DEFAULT_QUICKBOOKS_ACCOUNT_NAMES } from "@/lib/quickbooks-accounts";
import { DEFAULT_FREEAGENT_ACCOUNT_NAMES } from "@/lib/freeagent-accounts";
import { getAccountCodes, mergeAccountCodes } from "@/lib/saved-profiles";

interface ExportPanelProps {
  canonicalCsv: string | null;
  activeProfileName: string | null;
}

type Format = "xero" | "quickbooks" | "freeagent";

interface FormatConfig {
  label: string;
  filename: string;
  defaults: Record<string, string | null>;
  // Whether this target system's import format has an account/category
  // field at all. Xero's precoded bank-statement import does; QuickBooks
  // Online's native CSV import and FreeAgent's bank-statement CSV import
  // don't (see lib/export/quickbooks.js and lib/export/freeagent.js for the
  // researched sourcing) — for those, this panel shows a read-only
  // reference list instead of blocking editable inputs.
  supportsCoding: boolean;
  note?: string;
}

const FORMAT_CONFIG: Record<Format, FormatConfig> = {
  xero: {
    label: "Xero",
    filename: "xero-import.csv",
    defaults: DEFAULT_XERO_ACCOUNT_CODES,
    supportsCoding: true,
  },
  quickbooks: {
    label: "QuickBooks",
    filename: "quickbooks-import.csv",
    defaults: DEFAULT_QUICKBOOKS_ACCOUNT_NAMES,
    supportsCoding: false,
    note: "QuickBooks Online's CSV import has no account field — rows land in \"For Review\" for you to categorise by hand. Suggested category names:",
  },
  freeagent: {
    label: "FreeAgent",
    filename: "freeagent-import.csv",
    defaults: DEFAULT_FREEAGENT_ACCOUNT_NAMES,
    supportsCoding: false,
    note: "FreeAgent's bank-statement CSV import has no account field — you'll categorise each row afterward in \"Explain transaction\". Suggested category names:",
  },
};

const FORMATS = Object.keys(FORMAT_CONFIG) as Format[];

const inputClass =
  "w-24 rounded-lg border border-border bg-bg-surface px-2 py-1 text-xs text-text focus:border-accent focus:outline-none";

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

// Lets the user pick a target accounting system and, for formats whose
// import supports pre-coding (currently only Xero), review/edit the
// account code for every category actually present in this file before
// downloading — categories with no code (the exclude bucket, by design)
// block the download until filled in, rather than exporting silently
// blank. Formats with no pre-coding concept (QuickBooks, FreeAgent) show a
// read-only reference list instead and never block the download.
export function ExportPanel({ canonicalCsv, activeProfileName }: ExportPanelProps) {
  const categories = useMemo(() => {
    if (!canonicalCsv) return [];
    const { data } = Papa.parse<{ Category?: string }>(canonicalCsv, {
      header: true,
      skipEmptyLines: true,
    });
    return Array.from(new Set(data.map((r) => r.Category).filter((c): c is string => Boolean(c)))).sort();
  }, [canonicalCsv]);

  const [format, setFormat] = useState<Format>("xero");
  const config = FORMAT_CONFIG[format];

  const savedCodes = useMemo(
    () => (activeProfileName ? getAccountCodes(activeProfileName, format) : {}),
    [activeProfileName, format]
  );

  const [codes, setCodes] = useState<Record<string, string>>({});

  // Recompute whenever the selected format (or the file) changes — each
  // format has its own defaults and its own saved overrides, so switching
  // tabs must not carry one format's edits into another's.
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const category of categories) {
      initial[category] = savedCodes[category] ?? config.defaults[category] ?? "";
    }
    setCodes(initial);
  }, [format, categories, savedCodes, config.defaults]);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!canonicalCsv || categories.length === 0) return null;

  const setCode = (category: string, code: string) => {
    setCodes((prev) => ({ ...prev, [category]: code }));
    if (activeProfileName && code.trim()) {
      mergeAccountCodes(activeProfileName, format, { [category]: code.trim() });
    }
  };

  const unmapped = config.supportsCoding ? categories.filter((c) => !codes[c]?.trim()) : [];
  const canDownload = unmapped.length === 0 && !downloading;

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalCsv, format, accountCodeMap: config.supportsCoding ? codes : {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Export failed.");
      if (data.unmappedCategories?.length > 0) {
        throw new Error(`Still missing a code for: ${data.unmappedCategories.join(", ")}`);
      }
      downloadCsv(data.csv, config.filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text">
          📤 Export
          {activeProfileName && config.supportsCoding && (
            <span className="font-normal text-text-faint"> — codes save to your &ldquo;{activeProfileName}&rdquo; recipe</span>
          )}
        </p>
        <div className="flex rounded-lg border border-border-subtle p-0.5">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                format === f ? "bg-accent text-bg" : "text-text-muted hover:text-text"
              }`}
            >
              {FORMAT_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {config.supportsCoding ? (
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
      ) : (
        <div className="flex flex-col gap-2">
          {config.note && <p className="text-xs text-text-faint">{config.note}</p>}
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <li key={category} className="flex items-center justify-between gap-3">
                <span className="truncate text-xs text-text-muted">{category}</span>
                <span className="text-xs text-text-faint">{config.defaults[category] ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {config.supportsCoding && unmapped.length > 0 && (
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
        {downloading ? "Preparing…" : `Download for ${config.label}`}
      </button>
    </div>
  );
}
