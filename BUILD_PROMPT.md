# CSV Agent — Build Prompt

---

> **Usage:** Paste this into Claude Code inside an empty project directory.
> It builds a working AI agent from scratch in Node.js.

---

```
You are teaching me how AI agents work by building one with me.
I am a senior full-stack engineer. I understand APIs, async code,
and the Claude API. I have NOT built an agent before.

Build CSV Agent — a minimal but real AI agent as a Node.js CLI tool. The agent
takes a CSV file and a natural language question, then uses tools
in a loop to figure out the answer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THE AGENT DOES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example usage:

  node agent.js data/transactions.csv "What did I spend most on in June?"

The agent:
  1. Receives the question
  2. Decides which tool to call first (probably read_csv)
  3. Gets the CSV data back
  4. Decides to call another tool (probably analyse)
  5. Gets the analysis result
  6. Decides it has enough information
  7. Responds with a final answer in plain English

I should see the agent's thinking and tool calls printed to the
terminal so I can watch the loop in action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  csv-agent/
  ├── agent.js              ← The agent loop (the important file)
  ├── tools.js              ← Tool definitions and implementations
  ├── data/
  │   └── transactions.csv  ← Sample UK bank transactions for testing
  ├── package.json
  ├── .env.example
  ├── .gitignore
  └── README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ANTHROPIC_API_KEY=sk-ant-xxx

That's the only env var. Use dotenv to load it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE THREE TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The agent has access to exactly three tools. It chooses which to
call and in what order. You do NOT hardcode the sequence.

TOOL 1: read_csv
  - Input: { file_path: string }
  - What it does: reads the CSV file, parses it, returns the
    first 50 rows as JSON (to fit in context)
  - Returns: { columns: string[], rows: object[], total_rows: number }

TOOL 2: analyse
  - Input: { data: object[], operation: string, column: string,
             group_by?: string, filter?: string }
  - Operations: "sum", "average", "count", "min", "max", "group"
  - What it does: performs the calculation on the data in memory
  - Returns: { result: any, operation: string, description: string }
  - This is a LOCAL tool — no LLM call, just JavaScript math

TOOL 3: write_report
  - Input: { content: string, file_path: string }
  - What it does: writes a markdown file with the analysis results
  - Returns: { success: boolean, file_path: string, bytes: number }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE AGENT LOOP — THIS IS THE CORE CONCEPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

agent.js must implement this exact loop pattern. Add clear console
logging at each step so I can watch the agent think.

```javascript
// PSEUDOCODE — the agent loop pattern

const messages = [
  { role: 'user', content: `File: ${filePath}\nQuestion: ${question}` }
]

const MAX_TURNS = 10  // safety limit

for (let turn = 0; turn < MAX_TURNS; turn++) {

  // Step 1: Send messages to Claude with tool definitions
  console.log(`\n🔄 Turn ${turn + 1}`)
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOL_DEFINITIONS,  // Claude's tool-use format
    messages: messages,
  })

  // Step 2: Check if Claude wants to use a tool or respond
  if (response.stop_reason === 'tool_use') {
    // Claude chose to call a tool
    const toolBlock = response.content.find(b => b.type === 'tool_use')
    console.log(`🔧 Agent calls: ${toolBlock.name}`)
    console.log(`   Input: ${JSON.stringify(toolBlock.input)}`)

    // Step 3: Execute the tool locally
    const toolResult = await executeTool(toolBlock.name, toolBlock.input)
    console.log(`✅ Tool result: ${JSON.stringify(toolResult).slice(0, 200)}`)

    // Step 4: Feed the result back to Claude
    messages.push({ role: 'assistant', content: response.content })
    messages.push({
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: JSON.stringify(toolResult),
      }]
    })

    // Loop continues — Claude sees the result and decides next step

  } else {
    // Claude decided it has enough info — final answer
    const answer = response.content.find(b => b.type === 'text')
    console.log(`\n💬 Agent answer:\n${answer.text}`)
    break  // Exit the loop
  }
}
```

THIS IS THE ENTIRE CONCEPT. The loop is where the "agent" part
happens. Claude decides the sequence, not you. You just execute
whatever tool it asks for and feed the result back.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM PROMPT FOR THE AGENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
You are a financial data analyst agent. You answer questions about
CSV data files by using your tools.

Rules:
- Always start by reading the CSV file to understand its structure
- Use the analyse tool for any calculations — never calculate
  numbers yourself, use the tool
- If the user asks you to save a report, use write_report
- When you have enough information, respond with a clear answer
- Format currency as GBP (£)
- Be specific — cite actual numbers from the data
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOL DEFINITIONS (CLAUDE API FORMAT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use the Claude API tool-use format:

```javascript
const TOOL_DEFINITIONS = [
  {
    name: 'read_csv',
    description: 'Read and parse a CSV file. Returns columns, first 50 rows as JSON objects, and total row count.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the CSV file'
        }
      },
      required: ['file_path']
    }
  },
  {
    name: 'analyse',
    description: 'Perform a calculation on data. Operations: sum, average, count, min, max, group. Use group_by to aggregate by a column. Use filter to narrow rows (e.g. "month=June").',
    input_schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Array of row objects to analyse'
        },
        operation: {
          type: 'string',
          enum: ['sum', 'average', 'count', 'min', 'max', 'group'],
          description: 'The calculation to perform'
        },
        column: {
          type: 'string',
          description: 'Column to calculate on'
        },
        group_by: {
          type: 'string',
          description: 'Optional: column to group results by'
        },
        filter: {
          type: 'string',
          description: 'Optional: filter expression like "category=Groceries" or "month=June"'
        }
      },
      required: ['data', 'operation', 'column']
    }
  },
  {
    name: 'write_report',
    description: 'Write analysis results to a markdown file.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Markdown content to write'
        },
        file_path: {
          type: 'string',
          description: 'Output file path (e.g. report.md)'
        }
      },
      required: ['content', 'file_path']
    }
  }
]
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAMPLE DATA — data/transactions.csv
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a realistic UK bank statement CSV with:
- 40–50 rows of transactions
- Columns: Date, Description, Amount, Category, Bank
- Date range: 01/05/2026 to 30/06/2026 (two months)
- Banks: mix of Monzo, Chase, Starling
- Categories: Groceries, Dining Out, Transport, Subscriptions,
  Shopping, Bills, Income
- Realistic UK merchants: TESCO, ALDI, DELIVEROO, UBER,
  NETFLIX, SPOTIFY, AMAZON, TFL, BP, COSTA, NANDOS, etc.
- Income entries: SALARY BACS at ~£3,200 once per month
- Amounts: realistic ranges per category
- Include a few uncategorised rows (empty category) so the
  agent has something interesting to comment on

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSOLE OUTPUT — WHAT I SHOULD SEE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When I run:
  node agent.js data/transactions.csv "What did I spend most on?"

I should see something like:

  🚀 Agent starting...
  📂 File: data/transactions.csv
  ❓ Question: What did I spend most on?

  🔄 Turn 1
  🔧 Agent calls: read_csv
     Input: {"file_path":"data/transactions.csv"}
  ✅ Tool result: {"columns":["Date","Description","Amount"...

  🔄 Turn 2
  🔧 Agent calls: analyse
     Input: {"data":[...],"operation":"group","column":"Amount","group_by":"Category"}
  ✅ Tool result: {"result":{"Groceries":-287.43,"Dining Out":-148.90...

  🔄 Turn 3
  💬 Agent answer:
  Your biggest spending category was Groceries at £287.43,
  followed by Dining Out at £148.90. Together they account
  for 62% of your total spending this period.

The key learning moment is watching the agent make its own
decisions about which tools to call and in what order.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT NOT TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Do not hardcode the tool-call sequence — the agent decides
- Do not use LangChain, CrewAI, or any agent framework — build
  the loop from scratch so I understand the mechanics
- Do not skip the console logging — watching the loop is the
  entire learning experience
- Do not use streaming — keep it simple with await
- Do not add more than three tools — simplicity is the point

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTIONS TO TRY AFTER BUILDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Once the agent works, try these to see how it adapts:

  node agent.js data/transactions.csv "What did I spend most on?"
  node agent.js data/transactions.csv "How much did I spend on dining out in June?"
  node agent.js data/transactions.csv "What's my average daily spend?"
  node agent.js data/transactions.csv "Are there any uncategorised transactions?"
  node agent.js data/transactions.csv "Write me a monthly spending report and save it"

Each question should trigger a different sequence of tool calls.
That's the agent pattern — same code, different behaviour based
on the task.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATE ALL FILES NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```