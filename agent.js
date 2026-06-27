require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const { runAgentLoop } = require('./lib/agent-core');
const { adaptCsv } = require('./lib/csv-adapt');

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
// tools expect, returning a path to feed the agent loop. Already-canonical
// files pass straight through with no LLM cost.
async function prepareCsv(filePath) {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
  const result = await adaptCsv(raw, {
    onEvent(event) {
      console.log(`🧭 ${event.message}`);
    },
  });

  if (result.skipped) return filePath;

  const canonicalPath = path.join(os.tmpdir(), `csv-agent-canonical-${Date.now()}.csv`);
  fs.writeFileSync(canonicalPath, result.csv, 'utf8');
  return canonicalPath;
}

async function runAgent(filePath, question) {
  console.log('🚀 Agent starting...');
  console.log(`📂 File: ${filePath}`);
  console.log(`❓ Question: ${question}`);

  console.log('\n🧰 Adapting CSV...');
  const runPath = await prepareCsv(filePath);

  let spinner = null;

  await runAgentLoop(runPath, question, {
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
}

function main() {
  const [, , filePath, question] = process.argv;

  if (!filePath || !question) {
    console.error('Usage: node agent.js <csv-file> "<question>"');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
    process.exit(1);
  }

  runAgent(filePath, question).catch((error) => {
    console.error('Agent crashed:', error);
    process.exit(1);
  });
}

main();
