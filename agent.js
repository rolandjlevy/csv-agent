require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const tools = require('./tools');

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 10;
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are a financial data analyst agent. You answer questions about
CSV data files by using your tools.

Rules:
- Always start by reading the CSV file to understand its structure
- Use the analyse tool for any calculations — never calculate
  numbers yourself, use the tool
- If the user asks to save a report, use write_report
- When you have enough information, respond with a clear answer
- Format currency as GBP (£)
- Be specific — cite actual numbers from the data`;

const TOOL_DEFINITIONS = [
  {
    name: 'read_csv',
    description:
      'Read and parse a CSV file. Returns columns, the first 50 rows as JSON objects, and the total row count.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the CSV file',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'analyse',
    description:
      'Perform a calculation on data. Operations: sum, average, count, min, max, group. Use group_by to aggregate by a column. Use filter to narrow rows (e.g. "category=Groceries" or "month=June").',
    input_schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Array of row objects to analyse',
        },
        operation: {
          type: 'string',
          enum: ['sum', 'average', 'count', 'min', 'max', 'group'],
          description: 'The calculation to perform',
        },
        column: {
          type: 'string',
          description: 'Column to calculate on',
        },
        group_by: {
          type: 'string',
          description: 'Optional: column to group results by',
        },
        filter: {
          type: 'string',
          description: 'Optional: filter expression like "category=Groceries" or "month=June"',
        },
      },
      required: ['data', 'operation', 'column'],
    },
  },
  {
    name: 'write_report',
    description: 'Write analysis results to a markdown file.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Markdown content to write',
        },
        file_path: {
          type: 'string',
          description: 'Output file path (e.g. report.md)',
        },
      },
      required: ['content', 'file_path'],
    },
  },
];

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

async function executeTool(name, input) {
  switch (name) {
    case 'read_csv':
      return tools.readCsv(input);
    case 'analyse':
      return tools.analyse(input);
    case 'write_report':
      return tools.writeReport(input);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function runAgent(filePath, question) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log('🚀 Agent starting...');
  console.log(`📂 File: ${filePath}`);
  console.log(`❓ Question: ${question}`);

  const messages = [
    { role: 'user', content: `File: ${filePath}\nQuestion: ${question}` },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    console.log(`\n🔄 Turn ${turn + 1}`);

    const spinner = startSpinner('Thinking...');
    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: TOOL_DEFINITIONS,
        messages,
      });
    } finally {
      stopSpinner(spinner);
    }

    if (response.stop_reason === 'tool_use') {
      // Claude can ask for more than one tool in a single turn — every
      // tool_use block here needs a matching tool_result, or the next
      // API call is rejected.
      const toolBlocks = response.content.filter((block) => block.type === 'tool_use');

      const toolResults = [];
      for (const toolBlock of toolBlocks) {
        console.log(`🔧 Agent calls: ${toolBlock.name}`);
        console.log(`   Input: ${JSON.stringify(toolBlock.input)}`);

        let toolResult;
        try {
          toolResult = await executeTool(toolBlock.name, toolBlock.input);
        } catch (error) {
          toolResult = { error: error.message };
        }
        console.log(`✅ Tool result: ${JSON.stringify(toolResult).slice(0, 200)}`);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: JSON.stringify(toolResult),
        });
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });

      // Loop continues — Claude sees the results and decides what to do next.
    } else {
      const answer = response.content.find((block) => block.type === 'text');
      console.log(`\n💬 Agent answer:\n${answer ? answer.text : '(no text response)'}`);
      return;
    }
  }

  console.log(`\n⚠️ Stopped after ${MAX_TURNS} turns without a final answer.`);
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
