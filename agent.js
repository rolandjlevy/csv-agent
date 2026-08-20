require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { parse } = require('csv-parse/sync');
const { runAgentLoop } = require('./lib/agent-core');
const { adaptCsv, transformAndCategorise } = require('./lib/csv-adapt');
const profileStore = require('./lib/profile-store');
const { toXeroCsv } = require('./lib/export/xero');
const { XERO_ACCOUNT_CODES } = require('./lib/export/xero-accounts');
const { toQuickBooksCsv } = require('./lib/export/quickbooks');
const { QUICKBOOKS_ACCOUNT_NAMES } = require('./lib/export/quickbooks-accounts');
const { toFreeAgentCsv } = require('./lib/export/freeagent');
const { FREEAGENT_NOMINAL_CODES } = require('./lib/export/freeagent-accounts');

const EXPORTERS = {
  xero: toXeroCsv,
  quickbooks: toQuickBooksCsv,
  freeagent: toFreeAgentCsv,
};
const DEFAULT_ACCOUNT_CODES = {
  xero: XERO_ACCOUNT_CODES,
  quickbooks: QUICKBOOKS_ACCOUNT_NAMES,
  freeagent: FREEAGENT_NOMINAL_CODES,
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function startSpinner(label) {
  if (!process.stdout.isTTY) return null; // \r can't overwrite a redirected stream

  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r${SPINNER_FRAMES[i = (i + 1) % SPINNER_FRAMES.length]} ${label}`);
  }, 80);
}

function stopSpinner(interval) {
  if (!interval) return;
  clearInterval(interval);
  process.stdout.write('\r\x1b[K'); // clear the spinner line
}

// Convert whatever CSV the user pointed at into the canonical schema the
// tools expect, returning a path to feed the agent loop plus the detected
// currency (so the agent formats figures correctly instead of assuming
// GBP). Already-canonical files pass straight through with no LLM cost.
//
// --profile <name> skips detectProfile() entirely and reuses a previously
// saved column mapping (~/.csv-agent/profiles/<name>.json). --save-profile
// <name> persists whichever profile actually got used — freshly detected, or
// (if both flags are given together) the reused one, saved again under the
// new name rather than silently ignored.
async function prepareCsv(filePath, { profileName, saveProfileName } = {}) {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
  const onEvent = (event) => console.log(`🧭 ${event.message}`);

  let result;
  let resolvedProfileName = null; // whichever saved profile actually ended up in play, for --export's account-code lookup
  if (profileName) {
    let profile;
    try {
      profile = profileStore.loadProfile(profileName);
    } catch {
      console.error(
        `❌ No saved profile named "${profileName}" found in ${profileStore.profilesDir()}`
      );
      process.exit(1);
    }
    console.log(`📎 Using saved profile "${profileName}" (${profile.bankName || 'Unknown'}) — skipping detection.`);
    result = await transformAndCategorise(raw, profile, {
      onEvent,
      knownMerchantMap: profile.merchantMap || {},
    });
    if (result.newMerchantKeys.length > 0) {
      profileStore.saveProfile(profileName, { ...profile, merchantMap: result.merchantMap });
      console.log(`🧠 Learned ${result.newMerchantKeys.length} new merchant classification(s) — saved back to "${profileName}".`);
    }
    if (saveProfileName) {
      profileStore.saveProfile(saveProfileName, { ...profile, merchantMap: result.merchantMap });
      console.log(`💾 Also saved as "${saveProfileName}" (${profileStore.profilePath(saveProfileName)})`);
    }
    resolvedProfileName = profileName;
  } else {
    // No --profile given — try to auto-match a previously saved recipe by
    // bank name or column layout before falling back to full detection. This
    // is what lets `node agent.js export.csv "question"` reuse a saved
    // merchant map with zero flags once one matching recipe has been saved.
    let matchedName = null;
    result = await adaptCsv(raw, {
      onEvent,
      resolveProfile: (detected) => {
        const match = profileStore.findMatchingProfile(detected, profileStore.listProfiles());
        if (!match) return null;
        matchedName = match.name;
        console.log(`📎 Auto-matched saved recipe "${match.name}" (${match.profile.bankName || 'Unknown'}).`);
        return { profile: match.profile, merchantMap: match.profile.merchantMap || {}, name: match.name };
      },
    });
    resolvedProfileName = matchedName;
    if (matchedName && result.newMerchantKeys.length > 0) {
      profileStore.saveProfile(matchedName, { ...profileStore.loadProfile(matchedName), merchantMap: result.merchantMap });
      console.log(`🧠 Learned ${result.newMerchantKeys.length} new merchant classification(s) — saved back to "${matchedName}".`);
    }
    if (saveProfileName) {
      if (result.profile) {
        profileStore.saveProfile(saveProfileName, { ...result.profile, merchantMap: result.merchantMap });
        console.log(`💾 Saved profile as "${saveProfileName}" (${profileStore.profilePath(saveProfileName)})`);
      } else {
        console.log(`ℹ️ File is already canonical — nothing detected to save as "${saveProfileName}".`);
      }
    }
  }

  if (result.skipped) return { runPath: filePath, currency: undefined, profileName: resolvedProfileName };

  const canonicalPath = path.join(os.tmpdir(), `csv-agent-canonical-${Date.now()}.csv`);
  fs.writeFileSync(canonicalPath, result.csv, 'utf8');
  return { runPath: canonicalPath, currency: result.profile?.currencyCode, profileName: resolvedProfileName };
}

// Adapts the file (same pipeline as a normal run) and writes it out in an
// accounting-system CSV format instead of running the agent loop — no
// question needed. Account codes come from the resolved recipe's
// xeroAccountCodes (if any), merged over the format's built-in defaults;
// any category still unmapped after that aborts WITHOUT writing a file,
// listing exactly what needs mapping, rather than exporting blank codes.
async function exportCsv(filePath, format, outPath, { profileName, saveProfileName }) {
  const exporter = EXPORTERS[format];
  if (!exporter) {
    console.error(`❌ Unknown export format "${format}". Supported: ${Object.keys(EXPORTERS).join(', ')}.`);
    process.exit(1);
  }

  const { runPath, profileName: resolvedProfileName } = await prepareCsv(filePath, {
    profileName,
    saveProfileName,
  });

  const rows = parse(fs.readFileSync(runPath, 'utf8'), { columns: true, skip_empty_lines: true });

  let accountCodeMap = { ...DEFAULT_ACCOUNT_CODES[format] };
  if (resolvedProfileName) {
    const savedCodes = profileStore.loadProfile(resolvedProfileName).accountCodes?.[format];
    if (savedCodes) accountCodeMap = { ...accountCodeMap, ...savedCodes };
  }

  const { csv, unmappedCategories, unmappedRowCount } = exporter(rows, accountCodeMap);

  if (unmappedCategories.length > 0) {
    console.error(
      `❌ ${unmappedRowCount} row(s) have no ${format} account code mapped — nothing written.\n` +
        `   Unmapped categories: ${unmappedCategories.join(', ')}\n` +
        (resolvedProfileName
          ? `   Add them to "accountCodes.${format}" in ${profileStore.profilePath(resolvedProfileName)} and re-run.`
          : `   Save this file as a recipe first (--save-profile <name>), then add an "accountCodes.${format}" map to its profile JSON.`)
    );
    process.exit(1);
  }

  const resolvedOut = outPath || `${path.basename(filePath, path.extname(filePath))}-${format}.csv`;
  fs.writeFileSync(resolvedOut, csv, 'utf8');
  console.log(`💾 Exported ${rows.length} rows to ${format} format: ${resolvedOut}`);
}

// Prompts "Follow-up (press Enter to exit): " and resolves the trimmed
// answer, or '' to end the session.
function askFollowUp(rl) {
  return new Promise((resolve) => {
    rl.question('\n❓ Follow-up (press Enter to exit): ', (answer) => resolve(answer.trim()));
  });
}

async function runAgent(filePath, question, { profileName, saveProfileName } = {}) {
  console.log('🚀 Agent starting...');
  console.log(`📂 File: ${filePath}`);
  console.log(`❓ Question: ${question}`);

  console.log('\n🧰 Adapting CSV...');
  const { runPath, currency } = await prepareCsv(filePath, { profileName, saveProfileName });

  let spinner = null;
  let history = [];
  let currentQuestion = question;

  // Only offer follow-ups in an interactive terminal — a piped/redirected
  // run (e.g. in CI or a script) answers the one question and exits, as before.
  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  const rl = interactive
    ? readline.createInterface({ input: process.stdin, output: process.stdout })
    : null;

  try {
    for (;;) {
      const result = await runAgentLoop(runPath, currentQuestion, {
        history,
        currency,
        onEvent(event) {
          if (event.type !== 'turn_start') {
            stopSpinner(spinner);
            spinner = null;
          }

          switch (event.type) {
            case 'turn_start':
              console.log(`\n🔄 Turn ${event.turn}`);
              spinner = startSpinner('Thinking...');
              break;
            case 'thinking':
              console.log(`💭 ${event.text}`);
              break;
            case 'tool_call':
              console.log(`🔧 Agent calls: ${event.tool}`);
              console.log(`   Input: ${JSON.stringify(event.input)}`);
              break;
            case 'tool_result':
              console.log(`✅ Tool result: ${JSON.stringify(event.result).slice(0, 200)}`);
              break;
            case 'answer':
              console.log(`\n💬 Agent answer:\n${event.text}`);
              break;
            case 'error':
              console.log(`\n⚠️ ${event.message}`);
              break;
          }
        },
      });

      if (!result || !rl) break;
      history = result.messages;

      const next = await askFollowUp(rl);
      if (!next) break;
      currentQuestion = next;
      console.log(`\n❓ Question: ${currentQuestion}`);
    }
  } finally {
    rl?.close();
  }
}

// Pulls --profile/--save-profile/--export/--out flags out of argv, leaving
// the positional args (file, and question — unless --export is given, in
// which case no question is needed) in the order they were given.
function parseArgs(argv) {
  const positional = [];
  let profileName;
  let saveProfileName;
  let exportFormat;
  let outPath;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--profile') profileName = argv[++i];
    else if (argv[i] === '--save-profile') saveProfileName = argv[++i];
    else if (argv[i] === '--export') exportFormat = argv[++i];
    else if (argv[i] === '--out') outPath = argv[++i];
    else positional.push(argv[i]);
  }

  return {
    filePath: positional[0],
    question: positional[1],
    profileName,
    saveProfileName,
    exportFormat,
    outPath,
  };
}

function main() {
  const { filePath, question, profileName, saveProfileName, exportFormat, outPath } = parseArgs(
    process.argv.slice(2)
  );

  if (!filePath || (!question && !exportFormat)) {
    console.error(
      'Usage: node agent.js <csv-file> "<question>" [--profile <name>] [--save-profile <name>]\n' +
        '   or: node agent.js <csv-file> --export xero|quickbooks|freeagent [--out <path>] [--profile <name>] [--save-profile <name>]'
    );
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
    process.exit(1);
  }

  if (exportFormat) {
    exportCsv(filePath, exportFormat, outPath, { profileName, saveProfileName }).catch((error) => {
      console.error('Export failed:', error);
      process.exit(1);
    });
    return;
  }

  runAgent(filePath, question, { profileName, saveProfileName }).catch((error) => {
    console.error('Agent crashed:', error);
    process.exit(1);
  });
}

main();
