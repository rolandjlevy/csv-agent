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

module.exports = { loadProfile, saveProfile, profilesDir, profilePath };
