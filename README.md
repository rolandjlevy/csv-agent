# csv-agent

A minimal, real AI agent. It takes a CSV file and a question, then
decides for itself which tools to call — and in what order — to find
the answer.

## How it works

This isn't a framework demo — it's the whole mechanism, in plain code.

1. You send Claude the question, plus three tool definitions (`read_csv`,
   `analyse`, `write_report`).
2. Claude responds with either a tool call or a final answer.
3. If it's a tool call, `agent.js` executes the corresponding function in
   `tools.js` locally and sends the result back as a new message.
4. Claude sees the result and decides what to do next — call another
   tool, or answer.
5. Repeat until Claude stops asking for tools (or a 10-turn safety limit
   is hit).

The loop never hardcodes "read the CSV, then analyse it" — Claude decides
that sequence at runtime based on the question. That decision-making loop
is the entire concept behind an "agent": an LLM repeatedly choosing
actions and observing their results, rather than executing a fixed script.

- `agent.js` — the loop itself (read this first)
- `tools.js` — the three tools, implemented as plain functions (no LLM
  calls inside them — `analyse` is just JavaScript math)
- `data/transactions.csv` — sample UK bank transactions to query against

## Setup

```bash
npm install
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY
```

## Usage

```bash
node agent.js data/transactions.csv "What did I spend most on?"
node agent.js data/transactions.csv "How much did I spend on dining out in June?"
node agent.js data/transactions.csv "What's my average daily spend?"
node agent.js data/transactions.csv "Are there any uncategorised transactions?"
node agent.js data/transactions.csv "Write me a monthly spending report and save it"
```

Each question triggers a different sequence of tool calls — that's the
point. Watch the terminal output: every turn prints which tool Claude
chose, what input it passed, and what came back, so you can see the
decision loop happening live.
