require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { runAgentLoop } = require('./lib/agent-core');
const { adaptCsv, transformAndCategorise } = require('./lib/csv-adapt');
const profileStore = require('./lib/profile-store');

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
    result = await transformAndCategorise(raw, profile, { onEvent });
    if (saveProfileName) {
      profileStore.saveProfile(saveProfileName, profile);
      console.log(`💾 Also saved as "${saveProfileName}" (${profileStore.profilePath(saveProfileName)})`);
    }
  } else {
    result = await adaptCsv(raw, { onEvent });
    if (saveProfileName) {
      if (result.profile) {
        profileStore.saveProfile(saveProfileName, result.profile);
        console.log(`💾 Saved profile as "${saveProfileName}" (${profileStore.profilePath(saveProfileName)})`);
      } else {
        console.log(`ℹ️ File is already canonical — nothing detected to save as "${saveProfileName}".`);
      }
    }
  }

  if (result.skipped) return { runPath: filePath, currency: undefined };

  const canonicalPath = path.join(os.tmpdir(), `csv-agent-canonical-${Date.now()}.csv`);
  fs.writeFileSync(canonicalPath, result.csv, 'utf8');
  return { runPath: canonicalPath, currency: result.profile?.currencyCode };
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

// Pulls --profile/--save-profile flags out of argv, leaving the two
// positional args (file, question) in the order they were given.
function parseArgs(argv) {
  const positional = [];
  let profileName;
  let saveProfileName;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--profile') profileName = argv[++i];
    else if (argv[i] === '--save-profile') saveProfileName = argv[++i];
    else positional.push(argv[i]);
  }

  return { filePath: positional[0], question: positional[1], profileName, saveProfileName };
}

function main() {
  const { filePath, question, profileName, saveProfileName } = parseArgs(process.argv.slice(2));

  if (!filePath || !question) {
    console.error(
      'Usage: node agent.js <csv-file> "<question>" [--profile <name>] [--save-profile <name>]'
    );
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
    process.exit(1);
  }

  runAgent(filePath, question, { profileName, saveProfileName }).catch((error) => {
    console.error('Agent crashed:', error);
    process.exit(1);
  });
}

main();
