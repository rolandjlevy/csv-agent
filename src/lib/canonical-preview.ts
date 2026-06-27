// Client-side preview of the adapt transform. Mirrors the *deterministic*
// parts of lib/csv-adapt.js (column mapping + amount folding) so the
// confirmation panel can show "this is what we'll extract" and update live as
// the user remaps columns — no server round-trip, no LLM. Categorisation is
// NOT mirrored here (it needs the model); the preview shows Category as "—".

import Papa from "papaparse";
import type { AdaptProfile } from "@/types/agent";

export const CANONICAL_COLUMNS = ["Date", "Description", "Amount", "Category", "Bank"] as const;

export interface RawPreview {
  columns: string[];
  rows: string[][];
}

// Parse the file from its real header row down, in array mode — the same
// approach the server uses, so duplicate/blank header names and ragged
// padding columns can't break it.
export function parseFromHeader(rawText: string, headerRowIndex: number): RawPreview {
  const sliced = rawText.split(/\r?\n/).slice(headerRowIndex).join("\n");
  const result = Papa.parse<string[]>(sliced, { skipEmptyLines: true });
  const data = result.data ?? [];
  const columns = (data[0] ?? []).map((c) => String(c).trim());
  return { columns, rows: data.slice(1) };
}

function parseAmount(value: string | undefined): number {
  if (value == null) return NaN;
  const text = String(value).trim();
  if (!text) return NaN;
  const negativeParens = /^\(.*\)$/.test(text);
  const cleaned = text.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return NaN;
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return NaN;
  return negativeParens ? -Math.abs(num) : num;
}

function normaliseDate(value: string, format: AdaptProfile["dateFormat"]): string {
  const text = String(value || "").trim();
  if (!text) return text;
  const pad = (s: string) => s.padStart(2, "0");

  if (format === "YYYY-MM-DD") {
    const m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? `${pad(m[3])}/${pad(m[2])}/${m[1]}` : text;
  }

  const parts = text.split(/[/\-.]/);
  if (parts.length < 3) return text;
  let [a, b] = parts;
  const c = parts[2];
  if (format === "MM/DD/YYYY") [a, b] = [b, a];
  return `${pad(a)}/${pad(b)}/${c}`;
}

// Produce up to `max` canonical preview rows for the given profile.
export function canonicalPreview(
  profile: AdaptProfile,
  raw: RawPreview,
  max = 5
): Record<string, string>[] {
  const idx = (name?: string) =>
    raw.columns.findIndex((c) => c.toLowerCase() === String(name ?? "").trim().toLowerCase());

  const dDate = idx(profile.dateColumn);
  const dDesc = idx(profile.descriptionColumn);
  const dAmt = idx(profile.amountColumn);
  const dIn = idx(profile.moneyInColumn);
  const dOut = idx(profile.moneyOutColumn);

  const out: Record<string, string>[] = [];
  for (const rec of raw.rows) {
    const description = String(rec[dDesc] ?? "").trim();
    const rawDate = String(rec[dDate] ?? "").trim();
    if (!description && !rawDate) continue;

    let amount: number;
    if (profile.amountConvention === "signed") {
      amount = parseAmount(rec[dAmt]);
    } else {
      const inV = parseAmount(rec[dIn]);
      const outV = parseAmount(rec[dOut]);
      amount = (Number.isNaN(inV) ? 0 : inV) - (Number.isNaN(outV) ? 0 : Math.abs(outV));
    }

    out.push({
      Date: normaliseDate(rawDate, profile.dateFormat),
      Description: description,
      Amount: Number.isNaN(amount) ? "" : String(Math.round(amount * 100) / 100),
      Category: "—",
      Bank: profile.bankName || "Unknown",
    });
    if (out.length >= max) break;
  }
  return out;
}

// Count rows that look like real transactions (have a date or description).
export function countTransactions(profile: AdaptProfile, raw: RawPreview): number {
  const idx = (name?: string) =>
    raw.columns.findIndex((c) => c.toLowerCase() === String(name ?? "").trim().toLowerCase());
  const dDate = idx(profile.dateColumn);
  const dDesc = idx(profile.descriptionColumn);
  return raw.rows.filter(
    (rec) => String(rec[dDesc] ?? "").trim() || String(rec[dDate] ?? "").trim()
  ).length;
}
