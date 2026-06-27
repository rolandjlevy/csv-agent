# Continuing csv-agent → White-Label Bookkeeping Platform — Handoff to Claude Code

*Paste this as your opening message to Claude Code, run from the root of the
csv-agent repo. It picks up exactly where a Claude.ai chat session left off.*

---

## 1. Persona

Operate as the seven-discipline persona (serial entrepreneur, CTO/product
architect, elite full-stack engineer, growth marketer, financial strategist,
UI/UX designer with fine-art background, top-1% market researcher) from the
original project brief. Be ruthlessly specific, honest about weaknesses before
offering solutions, and never mistake activity for shipping.

## 2. What's already been decided and DONE — don't redo this

**Repositioning, revised from the original brief:** the original plan was to
turn this into "AI-generated management accounts + narrative" sold to UK
bookkeepers/small firms. That positioning was checked against the current
market and rejected: Fathom (Commentary Writer, ~99k companies) and Syft
Analytics (Syft Assist) shipped AI-generated, source-linked, accountant-
reviewed management-accounts narrative as a feature in Q1 2026. Building the
narrative generator as the centrepiece walks straight into two funded,
trusted incumbents.

**The corrected positioning:** Fathom and Syft both sit *downstream* of a
clean general ledger — they require Xero/QuickBooks and don't ingest raw,
messy bank CSVs. That's the gap. The defensible product is **the ingestion
engine** — `lib/csv-adapt.js`, which turns any bank's messy export into
clean, chart-of-accounts-coded transactions — sold either as (a) a feeder
into Xero/QuickBooks for catch-up/no-feed bookkeeping work, or (b) a tool
serving sole-traders/small firms with no ledger yet. The P&L/narrative output
becomes a thin layer on top, not the bet. **Decide (a) vs (b) based on real
route-to-market with Laurie before going further on positioning** — this
doesn't block engineering below.

**Validation done — the engine is now trustworthy:** Built a stress-test
harness (`stress-test/run.js` + `stress-test/fixtures/*.csv`) that runs the
REAL `applyProfile` transformer in `lib/csv-adapt.js` against six fixtures
modelling real UK bank export quirks (Lloyds split columns, Nationwide
preamble + £ symbols, Barclays parenthesised negatives, Revolut multi-date
+ fee column, HSBC headerless export, Monzo mojibake + thousands separator).

Found and FIXED two real bugs in `lib/csv-adapt.js`:
1. **Critical, silent:** unquoted thousands separators in amounts
   (`£3,200.00` unquoted) caused `csv-parse` to split the number across
   columns, truncating `£3,200.00` to `£3.00` with no error. Fixed by
   rejoining split numeric fragments in `applyProfile` before parsing.
2. **Gap:** headerless bank exports (some HSBC personal accounts) produced
   zero rows because the first transaction row was treated as a header.
   Fixed by adding `hasHeaderRow: false` + positional column indexing to the
   profile schema and `applyProfile`.

Both fixes are live in `lib/csv-adapt.js` and confirmed passing:
`node stress-test/run.js` → `RESULT: 6 ok, 0 unexpected failures, out of 6 cases`.

Full detail in `stress-test/FINDINGS.md`, including two known remaining gaps
not yet fixed (separate Fee columns like Revolut/Wise are dropped rather than
added to cost; split-convention rows with neither money-in nor money-out are
correctly now skipped but this should get its own fixture).

**Outstanding validation debt:** the harness only tests the deterministic
transform (`applyProfile`). The two LLM calls (`detectProfile`,
`classifyMerchants`) are NOT yet tested live — that needs a real API key and,
ideally, 5–10 actual messy client CSVs (not synthetic fixtures) before any
"handles any bank" claim is made to a bookkeeper.

## 3. What to do next — Phase 1, taxonomy swap

Replace the personal-finance `CATEGORIES` array in `lib/csv-adapt.js`
(Groceries, Dining Out, etc.) with a proper chart-of-accounts structure that
can actually produce a P&L. Key requirement: HMRC self-assessment expense
boxes are NOT a substitute for chart-of-accounts — SA boxes have no
Income/Cost of Sales/Overheads/Net Profit structure, so COA is mandatory.
Map each COA line to its SA box as a secondary field for tax-readiness.

Critically, add a fourth treatment class beyond income/cost-of-sales/
overheads: **`exclude`** — transfers between own accounts, drawings, VAT
to/from HMRC, tax payments, loan *principal* (vs interest), and capital asset
purchases must NEVER hit the P&L. This is the single biggest way a naive
LLM-categorised P&L ends up silently wrong, and getting it right is as much
the moat as the bank-agnostic parsing is.

A draft `ACCOUNTS` config (code + pnl_section + sa_box per line, including the
`exclude` bucket) was sketched in the prior chat session — reconstruct or
improve on this shape, then rewrite the `classifyMerchants()` prompt to lead
with the exclusion rules explicitly (HMRC VAT payments → vat; HMRC tax/PAYE →
tax; movements to the owner or between own accounts → transfer/drawings; loan
repayments split interest vs principal; genuinely ambiguous → uncategorised,
never guessed). Test the new classifier against realistic transaction
descriptions before treating it as done.

## 4. After that

Per the original brief: build the fourth agent tool (categorised transactions
→ P&L + narrative + exceptions list), then the Supabase multi-tenant schema
(firms / clients / transaction history / category rules / report archive),
then Stripe billing and white-labelling. Treat the narrative generator as
table-stakes polish now, not the differentiator — see section 2 above.
