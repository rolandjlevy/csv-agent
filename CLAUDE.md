# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`csv-agent` is a minimal but real AI agent: give it a CSV file and a question,
and it decides for itself which tools to call (and in what order) to answer.
It ships in two forms that share the **same** agent loop:

- **CLI** — `agent.js`, run directly against a CSV from the terminal.
- **Web frontend** — a Next.js 15 app under `src/` that wraps the same loop in
  a streaming HTTP endpoint and renders tool calls live in the browser.

The decision loop is never hardcoded — Claude chooses the sequence of tool
calls at runtime based on the question. That loop *is* the whole concept.

## Architecture (read in this order)

0. `lib/accounts.js` — **chart-of-accounts definition** (no imports, no side
   effects). 26 entries across four `pnl_section` values: `income`,
   `cost_of_sales`, `overheads`, and `exclude`. The `exclude` bucket is the
   critical one — transfers, drawings, VAT, tax, loan principal, and capital
   expenditure must never reach the P&L. Imported by both `csv-adapt.js` and
   `tools.js`; kept standalone to avoid a circular dependency.
1. `lib/csv-adapt.js` — **ingestion / adapt stage**, run *before* the loop. Turns
   any bank's CSV export (e.g. Santander, with preamble rows, split Money
   In/Out columns, `£` mojibake, no Category) into the canonical
   `Date,Description,Amount,Category,Bank` schema the tools expect. The LLM
   *decides* the mapping (`detectProfile` → an ingestion profile) and
   *classifies* unique merchants into COA categories (`classifyMerchants`);
   plain JS does every row transformation — **no model-side maths**, same as
   the tools. Files already in canonical form (`looksCanonical`) pass straight
   through with no LLM cost.
2. `lib/agent-core.js` — **the only place the loop lives.** It sends the
   question + tool definitions to Claude, executes whichever tool Claude
   requests, feeds the result back, and repeats until Claude answers or a
   10-turn safety limit is hit. Emits events (`turn_start`, `thinking`,
   `tool_call`, `tool_result`, `answer`, `done`/`error`).
3. `tools.js` — the four tools as plain functions, **no LLM calls inside
   them**: `read_csv`, `analyse` (JavaScript math), `generate_pl` (P&L from
   categorised rows — groups by COA section, surfaces exceptions and excluded
   items), `write_report`.
4. `agent.js` — CLI entry point; calls `agent-core.js` and prints events to
   the terminal.
5. `src/app/api/agent/route.ts` — calls the same `agent-core.js` and streams
   the events to the browser as NDJSON (one JSON object per line).

Both entry points are thin wrappers. **Do not reimplement the loop** in either
one — shared logic belongs in `lib/agent-core.js`.

### Frontend layout

```
src/app/page.tsx              UI states: upload → [confirm columns] → ask → working/answer
src/app/layout.tsx            root layout
src/app/globals.css           Tailwind v4 styles (dark mode)
src/app/api/detect/route.ts   detects the adapt profile for an uploaded CSV (JSON)
src/app/api/agent/route.ts    adapts the CSV then streams the agent loop as NDJSON
src/app/api/sample/route.ts   serves data/transactions.csv to the browser
src/components/                dropzone, csv preview, column-confirm panel, question panel, feed
src/hooks/use-agent.ts         drives upload → detect → confirm → ask → stream client-side
src/lib/canonical-preview.ts   client mirror of the deterministic transform (live panel preview)
src/types/agent.ts             shared event/profile/answer types
```

**Web adapt flow (two phases).** On upload the browser POSTs to `/api/detect`,
which returns either `{ skipped: true }` (file is already canonical) or a
detected `profile`. A non-canonical file shows the **column-confirm panel**
(`ColumnConfirmPanel`) where the user can remap columns — the preview updates
live via `src/lib/canonical-preview.ts` (no server round-trip). The confirmed
profile is sent with the question to `/api/agent`, which calls
`transformAndCategorise(profile)` directly and **skips re-detection**. If
`/api/detect` is unavailable, the run falls back to full server-side
`adaptCsv` auto-detection.

## Commands

```bash
npm install                 # install dependencies
npm run dev                 # Next.js dev server on http://localhost:3000
npm run build && npm start  # production build + serve
npm run lint                # ESLint (eslint-config-next)

# CLI
node agent.js data/transactions.csv "What did I spend most on?"
npm run cli -- data/transactions.csv "What's my average daily spend?"
```

## Tech stack

- Node.js 24, TypeScript 5
- Next.js 15 (App Router), React 19
- Tailwind CSS v4 (PostCSS), Framer Motion
- `@anthropic-ai/sdk` for Claude, `csv-parse` (CLI) / `papaparse` (browser preview)
- The core loop (`lib/agent-core.js`, `tools.js`) is **CommonJS**; the Next.js
  app under `src/` is **ES modules / TypeScript**. Keep that boundary in mind
  when importing across it.

## Conventions

- Match the surrounding file's style — the codebase favours plain, readable
  code over abstraction; the loop is deliberately framework-free.
- Keep tools in `tools.js` pure: data in, data out, no Claude calls inside.
- New agent events must be emitted from `agent-core.js` and handled in *both*
  the CLI (`agent.js`) and the frontend (`route.ts` + `agent-feed`/`agent-step`).
- 2-space indent, LF line endings; Prettier + ESLint enforce formatting.

## Environment & secrets

- Requires `ANTHROPIC_API_KEY` in `.env` (see `.env.example`). Used by **both**
  the CLI and the web frontend.
- **Never commit `.env`** or print the key. `.env`, `node_modules/`, `.next/`,
  and `reports/` are gitignored.
- Nothing is persisted server-side: the frontend writes the uploaded CSV to a
  temp file and deletes it when the request finishes. No database, no auth —
  this is a local demo tool. Don't add persistence or auth without being asked.

## Use the Claude API correctly

When touching agent/tool-use code, use current Claude model IDs (e.g.
`claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`) — do not
invent or downgrade model names. If unsure about API details, check the
`@anthropic-ai/sdk` usage already in `lib/agent-core.js`.
