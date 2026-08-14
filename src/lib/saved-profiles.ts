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

// Saving under a name that already exists overwrites it.
export function saveProfile(name: string, profile: AdaptProfile): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const rest = readAll().filter((p) => p.name !== trimmed);
  rest.push({ name: trimmed, profile, savedAt: new Date().toISOString() });
  writeAll(rest);
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
