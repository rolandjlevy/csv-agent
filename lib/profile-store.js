// Saved adapt-profile storage for the CLI — lets a recurring user skip
// detectProfile() on repeat runs of the same bank's export. One JSON file per
// profile under ~/.csv-agent/profiles/<name>.json. Mirrors the browser's
// localStorage saved-profile feature (src/lib/saved-profiles.ts) but has no
// dependency on it — plain Node fs, matching this file's CommonJS neighbours.

const fs = require('fs');
const os = require('os');
const path = require('path');

function profilesDir() {
  return path.join(os.homedir(), '.csv-agent', 'profiles');
}

function profilePath(name) {
  return path.join(profilesDir(), `${name}.json`);
}

function loadProfile(name) {
  return JSON.parse(fs.readFileSync(profilePath(name), 'utf8'));
}

function saveProfile(name, profile) {
  fs.mkdirSync(profilesDir(), { recursive: true });
  fs.writeFileSync(profilePath(name), JSON.stringify(profile, null, 2), 'utf8');
}

// All saved profiles, for recipe auto-matching — skips any file that isn't
// valid JSON rather than failing the whole run over one corrupt profile.
function listProfiles() {
  let files;
  try {
    files = fs.readdirSync(profilesDir());
  } catch {
    return [];
  }
  const profiles = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const name = file.slice(0, -'.json'.length);
    try {
      profiles.push({ name, profile: loadProfile(name) });
    } catch {
      // corrupt/unreadable — skip it
    }
  }
  return profiles;
}

// ---------------------------------------------------------------------------
// Recipe matching — "does a freshly detected profile match a saved one?"
// Mirrors src/lib/saved-profiles.ts's findMatchingProfile with no dependency
// on it (same reasoning as the rest of this file: plain Node fs vs the
// browser's localStorage).
// ---------------------------------------------------------------------------

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

// Two saved/detected profiles agree structurally: same date/description
// columns, same amount convention, and same amount field(s) for that
// convention. Column names only — never trusts amount VALUES.
function fieldsMatch(a, b) {
  if (norm(a.dateColumn) !== norm(b.dateColumn)) return false;
  if (norm(a.descriptionColumn) !== norm(b.descriptionColumn)) return false;
  if (a.amountConvention !== b.amountConvention) return false;
  if (a.amountConvention === 'signed') {
    return norm(a.amountColumn) !== '' && norm(a.amountColumn) === norm(b.amountColumn);
  }
  return (
    norm(a.moneyInColumn) !== '' &&
    norm(a.moneyInColumn) === norm(b.moneyInColumn) &&
    norm(a.moneyOutColumn) === norm(b.moneyOutColumn)
  );
}

function bankNamesConflict(bankA, bankB) {
  const a = norm(bankA);
  const b = norm(bankB);
  if (!a || !b || a === 'unknown' || b === 'unknown') return false;
  return a !== b;
}

function bankNamesAgree(bankA, bankB) {
  const a = norm(bankA);
  const b = norm(bankB);
  return Boolean(a) && Boolean(b) && a !== 'unknown' && b !== 'unknown' && a === b;
}

// Finds the one saved profile a freshly detected profile matches, or null if
// there's no match or the match is ambiguous — guessing wrong here would
// silently misclassify a P&L, so ties/uncertainty always fall through to the
// manual confirm flow rather than picking one.
function findMatchingProfile(detected, candidates) {
  if (!detected || !Array.isArray(candidates) || candidates.length === 0) return null;

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

module.exports = {
  loadProfile,
  saveProfile,
  listProfiles,
  findMatchingProfile,
  profilesDir,
  profilePath,
};
