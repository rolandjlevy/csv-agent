"use client";

import { useId, useMemo, useState } from "react";
import type { AdaptProfile } from "@/types/agent";
import {
  CANONICAL_COLUMNS,
  canonicalPreview,
  type RawPreview,
} from "@/lib/canonical-preview";
import { CsvPreview } from "@/components/csv-preview";
import { Select } from "@/components/select";
import { CARD } from "@/lib/card-style";
import { listSavedProfiles, type SavedProfile } from "@/lib/saved-profiles";

interface ColumnConfirmPanelProps {
  fileName: string;
  profile: AdaptProfile;
  rawPreview: RawPreview;
  savedProfileMatch?: SavedProfile | null;
  onConfirm: (profile: AdaptProfile, saveAs?: string) => void;
  onCancel: () => void;
}

const DATE_FORMATS: AdaptProfile["dateFormat"][] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const CONVENTIONS: { value: AdaptProfile["amountConvention"]; label: string }[] = [
  { value: "split", label: "Separate money-in / money-out columns" },
  { value: "debit_credit", label: "Separate credit / debit columns" },
  { value: "signed", label: "One signed amount column (+/−)" },
];

// Wraps one control with its label. The label's id is handed to the control, so
// custom controls (the dropdowns) are named for screen readers.
function Field({ label, children }: { label: string; children: (labelId: string) => React.ReactNode }) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-[13px] font-medium text-text-muted">
        {label}
      </span>
      {children(labelId)}
    </div>
  );
}

const selectClass =
  "min-h-11 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text focus:border-accent";

export function ColumnConfirmPanel({
  fileName,
  profile,
  rawPreview,
  savedProfileMatch,
  onConfirm,
  onCancel,
}: ColumnConfirmPanelProps) {
  // All saved profiles (any bank), read once — lets the user pick a
  // different one than whatever we auto-matched, or apply one to a file we
  // didn't recognise at all.
  const savedProfiles = useMemo(() => listSavedProfiles(), []);

  const [edited, setEdited] = useState<AdaptProfile>(savedProfileMatch?.profile ?? profile);
  const [selectedSavedName, setSelectedSavedName] = useState(savedProfileMatch?.name ?? "");
  const [rememberFormat, setRememberFormat] = useState(true);
  const [saveName, setSaveName] = useState(
    savedProfileMatch?.name || profile.bankName || ""
  );

  const selectedSaved = savedProfiles.find((p) => p.name === selectedSavedName) ?? null;

  const applySavedSelection = (name: string) => {
    setSelectedSavedName(name);
    if (!name) {
      setEdited(profile); // "Auto-detected mapping" — revert to the fresh detection
      return;
    }
    const found = savedProfiles.find((p) => p.name === name);
    if (found) {
      setEdited(found.profile);
      setSaveName(found.name);
    }
  };

  // Real, non-empty header names from the source file — what the user picks
  // from when remapping a column.
  const columnOptions = useMemo(
    () => Array.from(new Set(rawPreview.columns.filter((c) => c.trim()))),
    [rawPreview.columns]
  );

  // Live preview — recomputes on every edit, fully client-side.
  const preview = useMemo(() => canonicalPreview(edited, rawPreview, 5), [edited, rawPreview]);

  const set = <K extends keyof AdaptProfile>(key: K, value: AdaptProfile[K]) =>
    setEdited((prev) => ({ ...prev, [key]: value }));

  // Not a component: it is called inline, so the dropdown keeps its open state
  // when the panel re-renders.
  const columnSelect = (labelId: string, value: string | undefined, onChange: (value: string) => void) => (
    <Select
      labelledBy={labelId}
      value={value ?? ""}
      onChange={onChange}
      options={[
        { value: "", label: "— select column —" },
        // Keep the detected value selectable even if it's not a current header.
        ...(value && !columnOptions.includes(value) ? [{ value, label: value }] : []),
        ...columnOptions.map((col) => ({ value: col, label: col })),
      ]}
    />
  );

  const isSplit = edited.amountConvention !== "signed";

  return (
    <div className={`flex flex-col gap-6 ${CARD} md:p-8`}>
      <div>
        <h2 className="font-display text-[22px] font-semibold tracking-tight text-text">Confirm the columns</h2>
        <p className="mt-1 text-sm text-text-muted">
          We detected how to read{" "}
          <span className="font-mono text-text">{fileName}</span>
          {edited.bankName ? ` (${edited.bankName})` : ""}. Edit anything that looks wrong, then
          continue.
        </p>
        <p className="mt-1 text-[13px] text-text-faint">
          Header detected on row {edited.headerRowIndex + 1} of the file.
        </p>
        {selectedSaved && (
          <p className="mt-3 rounded-md bg-tint px-3 py-2 text-sm text-text">
            Using your saved &ldquo;{selectedSaved.name}&rdquo; profile. Review and continue, or edit
            anything that&rsquo;s changed.
          </p>
        )}
      </div>

      {savedProfiles.length > 0 && (
        <Field label="Use a saved profile">
          {(id) => (
            <Select
              labelledBy={id}
              value={selectedSavedName}
              onChange={applySavedSelection}
              options={[
                { value: "", label: "— Auto-detected mapping —" },
                ...savedProfiles.map((p) => ({
                  value: p.name,
                  label: `${p.name}${p.profile.bankName ? ` (${p.profile.bankName})` : ""}`,
                })),
              ]}
            />
          )}
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date column">
          {(id) => columnSelect(id, edited.dateColumn, (v) => set("dateColumn", v))}
        </Field>

        <Field label="Date format">
          {(id) => (
            <Select
              labelledBy={id}
              value={edited.dateFormat}
              onChange={(v) => set("dateFormat", v as AdaptProfile["dateFormat"])}
              options={DATE_FORMATS.map((f) => ({ value: f, label: f }))}
            />
          )}
        </Field>

        <Field label="Description column">
          {(id) => columnSelect(id, edited.descriptionColumn, (v) => set("descriptionColumn", v))}
        </Field>

        <Field label="Amount format">
          {(id) => (
            <Select
              labelledBy={id}
              value={edited.amountConvention}
              onChange={(v) => set("amountConvention", v as AdaptProfile["amountConvention"])}
              options={CONVENTIONS}
            />
          )}
        </Field>

        {isSplit ? (
          <>
            <Field label="Money in / credit column">
              {(id) => columnSelect(id, edited.moneyInColumn, (v) => set("moneyInColumn", v))}
            </Field>
            <Field label="Money out / debit column">
              {(id) => columnSelect(id, edited.moneyOutColumn, (v) => set("moneyOutColumn", v))}
            </Field>
          </>
        ) : (
          <Field label="Amount column">
            {(id) => columnSelect(id, edited.amountColumn, (v) => set("amountColumn", v))}
          </Field>
        )}

        <Field label="Bank / account name">
          {(id) => (
            <input
              type="text"
              aria-labelledby={id}
              className={selectClass}
              value={edited.bankName ?? ""}
              placeholder="e.g. Santander"
              onChange={(e) => set("bankName", e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-text-muted">
          Preview (categories are assigned when you ask a question)
        </span>
        <div className="overflow-hidden rounded-md border border-border-subtle">
          <CsvPreview columns={[...CANONICAL_COLUMNS]} rows={preview} />
        </div>
      </div>

      <label className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <span className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberFormat}
            onChange={(e) => setRememberFormat(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Remember this format as
        </span>
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          disabled={!rememberFormat}
          placeholder="e.g. Barclays Business"
          className="min-w-0 flex-1 basis-40 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-sm text-text focus:border-accent disabled:opacity-50"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-accent underline underline-offset-4 hover:opacity-80"
        >
          &larr; Change file
        </button>
        <button
          type="button"
          onClick={() => onConfirm(edited, rememberFormat ? saveName : undefined)}
          className="min-h-12 cursor-pointer rounded-full bg-cta px-6 text-[15px] font-semibold text-cta-text transition-opacity hover:opacity-90"
        >
          Looks good, continue
        </button>
      </div>
    </div>
  );
}
