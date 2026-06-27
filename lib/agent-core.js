// The agent loop, extracted from agent.js so both the CLI (agent.js) and the
// web API route (src/app/api/agent/route.ts) drive the exact same decision
// loop. This file has no console.log / process.stdout calls of its own —
// every observable step is reported through the onEvent callback, and each
// caller decides how to render it (terminal output vs. NDJSON stream).

const Anthropic = require('@anthropic-ai/sdk');
const tools = require('../tools');

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 10;
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are a financial data analyst agent. You answer questions about
CSV data files by using your tools.

Rules:
- Always start by reading the CSV file to understand its structure
- Use the analyse tool for any calculations — never calculate
  numbers yourself, use the tool
- If the user asks to save a report, use write_report (reports are always
  saved into the reports/ folder)
- When you have enough information, respond with a clear answer
- Format currency as GBP (£)
- Be specific — cite actual numbers from the data

Answering subscription / recurring-spend / "what should I cancel" / value-for-money
/ savings-target questions:
- ALWAYS call analyse with operation "breakdown", column "Amount", and
  filter "category=Subscriptions" first. This returns each subscription's
  charge count, total, average charge, monthly_estimate (run-rate) and date
  range. Base every claim on those figures.
- Rank and recommend using the real numbers: monthly_estimate and
  annualised cost (monthly_estimate × 12) for the money saved, and count /
  date range for how regularly it recurs.
- Be honest about what the data does and does not show. It shows cost and
  frequency — NOT how much you use or enjoy a service. So frame "which would
  I miss least" / "value per dollar" as: rank by cost (and note that without
  usage data, the cheapest-but-still-recurring or least-frequent charges are
  the lowest-stakes to cut), and say explicitly that the satisfaction/usage
  side is the user's call. Never invent usage or value data.
- For a savings target (e.g. "reduce by £25/month"), pick a concrete set of
  charges whose monthly_estimate sums to at least the target, show the
  per-item monthly amounts and the running total, and state the resulting
  monthly and annual saving.`;

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
      'Perform a calculation by reading the CSV file directly — operates on every row in the file, not just the preview rows returned by read_csv. Operations: sum, average, count, min, max, group, breakdown. Use group_by to aggregate by a column. Use filter to narrow rows (e.g. "category=Groceries" or "month=June"). Use "breakdown" (with column=Amount and usually filter="category=Subscriptions") to get a per-merchant table — each merchant\'s charge count, total, average charge, monthly_estimate (run-rate) and date range — which groups recurring charges together even when each row\'s description embeds a different date. This is the right operation for subscription/recurring-spend, value-for-money, what-to-cancel, and savings-plan questions.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the CSV file — the same path passed to read_csv',
        },
        operation: {
          type: 'string',
          enum: ['sum', 'average', 'count', 'min', 'max', 'group', 'breakdown'],
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
      required: ['file_path', 'operation', 'column'],
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

// Runs the full tool-use loop for one question against one CSV file.
// onEvent(event) is awaited after every event so a streaming consumer (the
// API route) can apply backpressure; a synchronous console.log-based
// consumer (the CLI) just returns undefined, which awaits fine too.
async function runAgentLoop(filePath, question, { onEvent, apiKey } = {}) {
  const emit = onEvent || (() => {});
  const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });

  const loopStart = Date.now();

  const messages = [
    { role: 'user', content: `File: ${filePath}\nQuestion: ${question}` },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    await emit({ type: 'turn_start', turn: turn + 1 });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages,
    });

    if (response.stop_reason === 'tool_use') {
      // Claude can narrate its reasoning in a text block alongside the
      // tool_use blocks in the same turn — surface that as "thinking".
      const thinkingBlock = response.content.find((block) => block.type === 'text');
      if (thinkingBlock && thinkingBlock.text.trim()) {
        await emit({ type: 'thinking', turn: turn + 1, text: thinkingBlock.text.trim() });
      }

      // Claude can ask for more than one tool in a single turn — every
      // tool_use block here needs a matching tool_result, or the next
      // API call is rejected.
      const toolBlocks = response.content.filter((block) => block.type === 'tool_use');

      const toolResults = [];
      for (const toolBlock of toolBlocks) {
        await emit({
          type: 'tool_call',
          turn: turn + 1,
          tool: toolBlock.name,
          input: toolBlock.input,
        });

        const toolStart = Date.now();
        let toolResult;
        try {
          toolResult = await executeTool(toolBlock.name, toolBlock.input);
        } catch (error) {
          toolResult = { error: error.message };
        }
        const duration_ms = Date.now() - toolStart;

        await emit({
          type: 'tool_result',
          turn: turn + 1,
          tool: toolBlock.name,
          result: toolResult,
          duration_ms,
        });

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
      const answerBlock = response.content.find((block) => block.type === 'text');
      const text = answerBlock ? answerBlock.text : '(no text response)';

      await emit({ type: 'answer', text });
      await emit({
        type: 'done',
        total_turns: turn + 1,
        duration_ms: Date.now() - loopStart,
      });
      return { text, totalTurns: turn + 1, durationMs: Date.now() - loopStart };
    }
  }

  await emit({
    type: 'error',
    message: `Stopped after ${MAX_TURNS} turns without a final answer.`,
  });
  return null;
}

module.exports = {
  runAgentLoop,
  executeTool,
  TOOL_DEFINITIONS,
  SYSTEM_PROMPT,
  MODEL,
  MAX_TURNS,
  MAX_TOKENS,
};
