# 📄 CSV Agent

A minimal, real AI agent. It takes a CSV file and a question, then
decides for itself which tools to call — and in what order — to find
the answer. You can hand it almost any bank's transaction export — it
adapts the file into a canonical schema first, then runs the loop.

There are two ways to use it: a **CLI** and a **web frontend**. Both run
the exact same agent loop — the frontend doesn't reimplement anything,
it just wraps the CLI's core in a streaming HTTP endpoint.

## How the agent works

This isn't a framework demo — it's the whole mechanism, in plain code.

1. You send Claude the question, plus four tool definitions (`read_csv`,
   `analyse`, `generate_pl`, `write_report`).
2. Claude responds with either a tool call or a final answer.
3. If it's a tool call, the loop executes the corresponding function in
   `tools.js` locally and sends the result back as a new message.
4. Claude sees the result and decides what to do next — call another
   tool, or answer.
5. Repeat until Claude stops asking for tools (or a 10-turn safety limit
   is hit).

The loop never hardcodes "read the CSV, then analyse it" — Claude decides
that sequence at runtime based on the question. That decision-making loop
is the entire concept behind an "agent": an LLM repeatedly choosing
actions and observing their results, rather than executing a fixed script.

## Adapting any CSV (the ingestion stage)

The tools expect a canonical `Date,Description,Amount,Category,Bank`
schema, but real bank exports rarely look like that — they have preamble
rows, split "Money In"/"Money Out" columns, `£` mojibake, no Category
column, and so on. So before the loop runs, `lib/csv-adapt.js` normalises
whatever you give it into that canonical shape.

The split of responsibility mirrors the tools: **the LLM decides, plain
JavaScript does the work.** Two small one-off LLM calls happen at
ingestion — `detectProfile()` works out the column mapping and date
format, and `classifyMerchants()` sorts each unique merchant into a
chart-of-accounts category. Every row is then transformed deterministically
in plain JS — no model-side maths, the same property the `analyse` tool
relies on. Files that are already canonical (`looksCanonical()`) skip the
LLM entirely and pass straight through at no cost.

The categories come from a proper chart-of-accounts (`lib/accounts.js`):
income, cost of sales, overheads, and an explicit **exclude** bucket for
balance-sheet movements (transfers, drawings, VAT, tax, loan principal,
capital expenditure) that must never appear on a P&L. The `generate_pl`
tool groups categorised rows into this structure and surfaces any
unclassified transactions as exceptions requiring human review.

## Project structure

```
lib/accounts.js        ← chart-of-accounts definition (income / cost of sales /
                          overheads / exclude) — imported by both csv-adapt and tools
lib/csv-adapt.js       ← ingestion stage: normalises any bank's CSV into the canonical
                          schema before the loop (LLM decides the mapping, JS transforms)
lib/merchant.js        ← merchant-name normalisation shared by the classifier
lib/agent-core.js      ← the loop itself (read this first) — shared by both versions
tools.js               ← four tools, implemented as plain functions (no LLM calls
                          inside them): read_csv, analyse, generate_pl, write_report
data/transactions.csv  ← sample UK bank transactions to query against

agent.js               ← CLI entry point, wraps lib/agent-core.js with console output

src/                   ← Next.js web frontend
├── app/
│   ├── page.tsx           ← UI states: upload → [confirm columns] → ask → working/answer
│   └── api/
│       ├── detect/route.ts← detects the adapt profile for an uploaded CSV (JSON)
│       ├── agent/route.ts ← adapts the CSV then streams the same agent loop as NDJSON
│       └── sample/route.ts← serves data/transactions.csv to the browser
├── components/             ← dropzone, csv preview, column-confirm panel, question chips,
│                             agent feed, answer card, etc.
├── hooks/use-agent.ts      ← drives upload → detect → confirm → ask → stream client-side
├── lib/canonical-preview.ts← client mirror of the deterministic transform (live preview)
└── types/agent.ts
```

`lib/agent-core.js` is the only place the actual loop logic lives. `agent.js`
calls it and prints events to the terminal; `src/app/api/agent/route.ts`
calls it and streams the same events to the browser as NDJSON. Neither
version contains its own copy of the decision loop.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY
```

This one `ANTHROPIC_API_KEY` is used by both versions.

```bash
npm i @anthropic-ai/claude-code -g
# follow authentication steps, then...
claude
```

---

## CLI version

The original way to use csv-agent — a Node.js script you run directly
against a CSV file.

```bash
node agent.js data/transactions.csv "What did I spend most on?"
node agent.js data/transactions.csv "Give me a P&L for this data"
node agent.js data/transactions.csv "How much did I spend on dining out in June?"
node agent.js data/transactions.csv "What's my average daily spend?"
node agent.js data/transactions.csv "Are there any uncategorised transactions?"
node agent.js data/transactions.csv "Write me a monthly spending report and save it"
```

(`npm run cli -- data/transactions.csv "..."` works the same way.)

Before the loop runs you'll see an `🧰 Adapting CSV...` step: the file is
normalised into the canonical schema (with `🧭` lines reporting what was
detected), unless it's already canonical, in which case it passes straight
through. Then each question triggers a different sequence of tool calls —
that's the point. Watch the terminal output: every turn prints which tool
Claude chose, what input it passed, and what came back, so you can see the
decision loop happening live — including a spinner while Claude is
thinking, and a 💭 line whenever Claude narrates its reasoning before
calling a tool.

Files involved: `agent.js`, `lib/csv-adapt.js`, `lib/agent-core.js`, `tools.js`.

## Frontend version

A dark-mode web UI (Next.js 15 + Tailwind + Framer Motion) that lets you
drag a CSV into the browser, pick a question, and watch the agent's
tool calls stream in live instead of reading terminal output.

```bash
npm run dev
# open http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

How it works:

1. You drop a CSV (or click "try with sample data" to load
   `data/transactions.csv`) — it's parsed in the browser with Papaparse
   for the preview table; the raw text is kept in memory.
2. The browser POSTs the raw CSV to `/api/detect`, which returns either
   `{ skipped: true }` (already canonical) or a detected adapt **profile**.
   If a profile comes back, a **column-confirm panel** appears so you can
   remap columns; the canonical preview updates live, computed entirely in
   the browser via `src/lib/canonical-preview.ts` (no server round-trip).
3. You pick a predefined question chip or type your own.
4. The browser POSTs `{ csvData, question, profile }` to `/api/agent`,
   which transforms the CSV using the confirmed profile (skipping
   re-detection), writes the canonical result to a server-side temp file,
   and runs `lib/agent-core.js` against it — the same loop the CLI uses.
5. Every step (`turn_start`, `thinking`, `tool_call`, `tool_result`,
   `answer`, `done`/`error`) is streamed back as one line of NDJSON the
   instant it happens, and rendered live as an animated feed — no
   batching, no WebSockets, no raw JSON shown on screen.
6. The final answer renders as a formatted card with bold text, tables,
   and a "N turns · N tool calls · N.Ns" footer; "Ask another question"
   resets the feed without re-uploading the file.

Nothing is persisted server-side — the temp CSV file is deleted as soon
as the request finishes, and there's no database or auth; it's a local
demo tool.

Files involved: `src/app/**`, `src/components/**`, `src/hooks/use-agent.ts`,
`src/lib/canonical-preview.ts`, `lib/csv-adapt.js`, `lib/agent-core.js`,
`tools.js`.
