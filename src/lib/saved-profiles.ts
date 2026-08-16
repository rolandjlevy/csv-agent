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
// name, case-insensitively. Column-fingerprint matching is out of scope here
// (that's the later "recipes" goal); this only needs to answer the simpler
// question this goal asks.
export function findProfileForBank(bankName: string | undefined): SavedProfile | null {
  const target = (bankName || "").trim().toLowerCase();
  if (!target || target === "unknown") return null;
  return readAll().find((p) => (p.profile.bankName || "").trim().toLowerCase() === target) ?? null;
}
