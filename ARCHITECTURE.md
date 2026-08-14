# CLAUDE.md

## Architecture (read in this order)

0. `lib/accounts.js` — chart-of-accounts, 26 entries, four `pnl_section` values: `income`, `cost_of_sales`, `overheads`, `exclude`. No imports — kept standalone to avoid a circular dependency with `csv-adapt.js` and `tools.js`.
1. `lib/csv-adapt.js` — ingestion stage (runs *before* the loop). LLM decides the column mapping (`detectProfile`) and classifies merchants into COA categories (`classifyMerchants`); plain JS transforms every row. `looksCanonical` files skip both LLM calls.
2. `lib/agent-core.js` — **the only place the loop lives.** Do not reimplement it in `agent.js` or `route.ts`.
3. `tools.js` — four pure functions, **no LLM calls inside them**: `read_csv`, `analyse`, `generate_pl`, `write_report`.
4. `agent.js` — CLI entry point (thin wrapper).
5. `src/app/api/agent/route.ts` — streams the same loop as NDJSON (thin wrapper).

The `exclude` bucket (`Transfer`, `Drawings`, `VAT`, `Tax & PAYE`, `Loan Principal`, `Capital Expenditure`, `Uncategorised`) must never appear on a P&L. It is the primary correctness moat.

### Frontend files

```
src/app/page.tsx              upload → [confirm columns] → ask → working/answer
src/app/api/detect/route.ts   returns detected profile or { skipped: true }
src/app/api/agent/route.ts    transforms CSV then streams agent loop as NDJSON
src/app/api/sample/route.ts   serves data/transactions.csv
src/components/               dropzone, csv preview, column-confirm, question panel, feed
src/hooks/use-agent.ts        drives upload → detect → confirm → ask → stream
src/lib/canonical-preview.ts  client-side mirror of the deterministic transform
src/types/agent.ts            shared event/profile/answer types
```

Web adapt is two phases: `/api/detect` → column-confirm panel (preview via `canonical-preview.ts`, no server round-trip) → confirmed profile sent to `/api/agent`, which calls `transformAndCategorise(profile)` directly, skipping re-detection.

## Build commands

```bash
npm install
npm run dev                 # http://localhost:3000
npm run build && npm start
npm run lint

node agent.js data/transactions.csv "What did I spend most on?"
npm run cli -- data/transactions.csv "What's my average daily spend?"
```

## Non-obvious constraints

- **CommonJS / ESM boundary:** `lib/agent-core.js` and `tools.js` are CommonJS; `src/` is ESM/TypeScript. Don't mix `require` into `src/` or `import` into the core files.
- **Model IDs:** use `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`. Don't invent or downgrade names. Check `lib/agent-core.js` for current SDK usage.
- **New agent events** must be emitted from `agent-core.js` and handled in *both* `agent.js` and `route.ts`.
- **No persistence:** no database, no auth. Don't add either without being asked.
- **Signed amounts:** canonical CSV uses positive for income, negative for expenses. `generate_pl` uses simple addition throughout; tell Claude to display expense figures as positive £ amounts.
