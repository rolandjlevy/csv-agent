"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { AdaptProfile } from "@/types/agent";
import {
  CANONICAL_COLUMNS,
  canonicalPreview,
  type RawPreview,
} from "@/lib/canonical-preview";
import { CsvPreview } from "@/components/csv-preview";

interface ColumnConfirmPanelProps {
  fileName: string;
  profile: AdaptProfile;
  rawPreview: RawPreview;
  onConfirm: (profile: AdaptProfile) => void;
  onCancel: () => void;
}

const DATE_FORMATS: AdaptProfile["dateFormat"][] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const CONVENTIONS: { value: AdaptProfile["amountConvention"]; label: string }[] = [
  { value: "split", label: "Separate money-in / money-out columns" },
  { value: "debit_credit", label: "Separate credit / debit columns" },
  { value: "signed", label: "One signed amount column (+/−)" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none";

export function ColumnConfirmPanel({
  fileName,
  profile,
  rawPreview,
  onConfirm,
  onCancel,
}: ColumnConfirmPanelProps) {
  const [edited, setEdited] = useState<AdaptProfile>(profile);

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

  const ColumnSelect = ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <select className={selectClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">— select column —</option>
      {/* Keep the detected value selectable even if it's not a current header. */}
      {value && !columnOptions.includes(value) && <option value={value}>{value}</option>}
      {columnOptions.map((col) => (
        <option key={col} value={col}>
          {col}
        </option>
      ))}
    </select>
  );

  const isSplit = edited.amountConvention !== "signed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-lg border border-border-subtle bg-bg-surface p-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-text">Confirm the columns</h2>
        <p className="mt-1 text-sm text-text-muted">
          We detected how to read{" "}
          <span className="font-mono text-text">{fileName}</span>
          {edited.bankName ? ` (${edited.bankName})` : ""}. Edit anything that looks wrong, then
          continue.
        </p>
        <p className="mt-1 text-xs text-text-faint">
          Header detected on row {edited.headerRowIndex + 1} of the file.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date column">
          <ColumnSelect value={edited.dateColumn} onChange={(v) => set("dateColumn", v)} />
        </Field>

        <Field label="Date format">
          <select
            className={selectClass}
            value={edited.dateFormat}
            onChange={(e) => set("dateFormat", e.target.value as AdaptProfile["dateFormat"])}
          >
            {DATE_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description column">
          <ColumnSelect
            value={edited.descriptionColumn}
            onChange={(v) => set("descriptionColumn", v)}
          />
        </Field>

        <Field label="Amount format">
          <select
            className={selectClass}
            value={edited.amountConvention}
            onChange={(e) =>
              set("amountConvention", e.target.value as AdaptProfile["amountConvention"])
            }
          >
            {CONVENTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        {isSplit ? (
          <>
            <Field label="Money in / credit column">
              <ColumnSelect
                value={edited.moneyInColumn}
                onChange={(v) => set("moneyInColumn", v)}
              />
            </Field>
            <Field label="Money out / debit column">
              <ColumnSelect
                value={edited.moneyOutColumn}
                onChange={(v) => set("moneyOutColumn", v)}
              />
            </Field>
          </>
        ) : (
          <Field label="Amount column">
            <ColumnSelect value={edited.amountColumn} onChange={(v) => set("amountColumn", v)} />
          </Field>
        )}

        <Field label="Bank / account name">
          <input
            type="text"
            className={selectClass}
            value={edited.bankName ?? ""}
            placeholder="e.g. Santander"
            onChange={(e) => set("bankName", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
          Preview (categories are assigned when you ask a question)
        </span>
        <CsvPreview columns={[...CANONICAL_COLUMNS]} rows={preview} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          ← Change file
        </button>
        <button
          type="button"
          onClick={() => onConfirm(edited)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Looks good — continue →
        </button>
      </div>
    </motion.div>
  );
}
