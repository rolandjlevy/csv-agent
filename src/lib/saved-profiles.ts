// Browser-side saved adapt-profile storage — lets a recurring user skip the
// column-confirm remapping on repeat uploads from the same bank. Plain
// localStorage (no backend), matching CLAUDE.md's "start with localStorage,
// no database" constraint. Mirrors the CLI's lib/profile-store.js but has no
// dependency on it.

import type { AdaptProfile } from "@/types/agent";

const STORAGE_KEY = "csv-agent:profiles";

export interface SavedProfile {
  name: string;
  profile: AdaptProfile;
  merchantMap?: Record<string, string>;
  savedAt: string;
}

function readAll(): SavedProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProfile[]) : [];
  } catch {
    return [];
  }
}

function writeAll(profiles: SavedProfile[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function listSavedProfiles(): SavedProfile[] {
  return readAll();
}

// Saving under a name that already exists overwrites it — but carries its
// merchantMap forward, so re-confirming a bank's column mapping doesn't wipe
// out previously learned merchant classifications.
export function saveProfile(name: string, profile: AdaptProfile): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const all = readAll();
  const existing = all.find((p) => p.name === trimmed);
  const rest = all.filter((p) => p.name !== trimmed);
  rest.push({
    name: trimmed,
    profile,
    merchantMap: existing?.merchantMap,
    savedAt: new Date().toISOString(),
  });
  writeAll(rest);
}

// Merchant key -> category for a saved profile, or {} if the profile is
// missing or has no accumulated map yet.
export function getMerchantMap(name: string): Record<string, string> {
  return readAll().find((p) => p.name === name)?.merchantMap ?? {};
}

// Merges new/updated entries into a saved profile's merchant map. No-op if
// the profile doesn't exist.
export function mergeMerchantMap(name: string, updates: Record<string, string>): void {
  const all = readAll();
  const idx = all.findIndex((p) => p.name === name);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    merchantMap: { ...(all[idx].merchantMap ?? {}), ...updates },
  };
  writeAll(all);
}

// Manual reclassification of a single merchant — sticks permanently in the
// saved profile's map (so it's never re-sent to the LLM, and future runs use
// the corrected category).
export function setMerchantOverride(name: string, merchant: string, category: string): void {
  mergeMerchantMap(name, { [merchant]: category });
}

// Best-effort match for "was this bank's format saved before" — by bank
// name, case-insensitively. Superseded by findMatchingProfile() below for
// anything driving the confirm/recipe flow (it also falls back to a column
// fingerprint); kept as a standalone export since it's a useful narrower
// query in its own right.
export function findProfileForBank(bankName: string | undefined): SavedProfile | null {
  const target = (bankName || "").trim().toLowerCase();
  if (!target || target === "unknown") return null;
  return readAll().find((p) => (p.profile.bankName || "").trim().toLowerCase() === target) ?? null;
}

function norm(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

// Two profiles agree structurally: same date/description columns, same
// amount convention, and same amount field(s) for that convention. Column
// NAMES only — never trusts amount values.
function fieldsMatch(a: AdaptProfile, b: AdaptProfile): boolean {
  if (norm(a.dateColumn) !== norm(b.dateColumn)) return false;
  if (norm(a.descriptionColumn) !== norm(b.descriptionColumn)) return false;
  if (a.amountConvention !== b.amountConvention) return false;
  if (a.amountConvention === "signed") {
    return norm(a.amountColumn) !== "" && norm(a.amountColumn) === norm(b.amountColumn);
  }
  return (
    norm(a.moneyInColumn) !== "" &&
    norm(a.moneyInColumn) === norm(b.moneyInColumn) &&
    norm(a.moneyOutColumn) === norm(b.moneyOutColumn)
  );
}

function bankNamesConflict(bankA: string | undefined, bankB: string | undefined): boolean {
  const a = norm(bankA);
  const b = norm(bankB);
  if (!a || !b || a === "unknown" || b === "unknown") return false;
  return a !== b;
}

function bankNamesAgree(bankA: string | undefined, bankB: string | undefined): boolean {
  const a = norm(bankA);
  const b = norm(bankB);
  return Boolean(a) && Boolean(b) && a !== "unknown" && b !== "unknown" && a === b;
}

// Finds the one saved profile a freshly detected profile matches — by bank
// name first, then by column layout — or null if there's no match or the
// match is ambiguous. Guessing wrong here would silently misclassify a P&L,
// so ties/uncertainty always fall through to the manual confirm flow rather
// than picking one. Mirrors lib/profile-store.js's findMatchingProfile with
// no dependency on it.
export function findMatchingProfile(detected: AdaptProfile | undefined | null): SavedProfile | null {
  if (!detected) return null;
  const candidates = readAll();
  if (candidates.length === 0) return null;

  // Tier 1 — exact bank name.
  const byBank = candidates.filter((c) => bankNamesAgree(detected.bankName, c.profile.bankName));
  if (byBank.length === 1) return byBank[0];
  if (byBank.length > 1) return null;

  // Tier 2 — structural fingerprint. Headerless files (columns addressed by
  // bare index, e.g. "0"/"1") fingerprint on nothing meaningful, so require
  // bank-name agreement rather than trusting index collisions.
  const headerless = detected.hasHeaderRow === false;
  const fingerprinted = candidates.filter((c) => {
    if (bankNamesConflict(detected.bankName, c.profile.bankName)) return false;
    if (headerless || c.profile.hasHeaderRow === false) {
      return bankNamesAgree(detected.bankName, c.profile.bankName);
    }
    return fieldsMatch(detected, c.profile);
  });
  return fingerprinted.length === 1 ? fingerprinted[0] : null;
}
