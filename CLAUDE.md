---
description: "Extend csv-agent into a recurring bookkeeping tool: saved adapt profiles, reusable recipes, accounting-system export, and a messy sample that shows off the ingestion layer."
agent: agent
---

# Direction A — Recurring Bookkeeping Pipelines

## Context

csv-agent is a working AI agent that reads any bank's CSV, adapts it into
a canonical `Date,Description,Amount,Category,Bank` schema via
`lib/csv-adapt.js`, then answers questions using an agentic tool loop
(`lib/agent-core.js`). It has a CLI (`agent.js`) and a Next.js web
frontend, both sharing the same core. The chart-of-accounts in
`lib/accounts.js` already classifies transactions into income, cost of
sales, overheads, and an explicit exclude bucket for balance-sheet
movements. The `generate_pl` tool produces a proper P&L with unclassified
transactions flagged for review.

The adaptation layer is the real differentiator: `detectProfile()` uses a
one-off LLM call to work out column mappings and date formats from any
bank's export, `classifyMerchants()` sorts merchants into the chart of
accounts, and the actual transform is deterministic JS. Files already in
canonical form skip the LLM entirely.

## What's missing (the gap this addresses)

Right now csv-agent is a **one-shot, disposable session**. Upload, ask,
gone. A bookkeeper handling 10 clients' bank exports monthly does the
same adaptation work every time — same bank, same column layout, same
merchant classifications. Nothing is saved between sessions. That's the
gap: **recurring CSV pipelines for non-technical users.**

The target user is a UK bookkeeper or small-practice accountant who:
- Receives bank exports (CSV) from multiple clients monthly
- Needs to categorise transactions against a chart of accounts
- Produces P&L reports or imports into Xero / QuickBooks / FreeAgent
- Currently does this manually in Excel, every month, for every client

## Goals (in priority order)

### 1. Saved adapt profiles — "remember this bank's format"

**✅ Done — 2026-08-14** (CLI: `--profile`/`--save-profile` + `lib/profile-store.js`; web: `src/lib/saved-profiles.ts` + confirm-panel dropdown to pick any saved profile, not just the auto-matched one).

After the first successful adaptation of a bank's CSV, the user should be
able to **save the detected profile** (column mapping, date format, bank
name, any manual overrides from the column-confirm panel) so that next
month's export from the same bank skips detection entirely and applies the
saved mapping instantly.

Implementation notes:
- A profile is a small JSON object: `{ bankName, columnMap, dateFormat,
  delimiter, skipRows, splitAmountColumns, ... }` — whatever
  `detectProfile()` currently returns, plus any user overrides.
- Storage: start with `localStorage` in the browser (no backend needed
  yet). Structure as a named list: "Monzo Current", "Starling Business",
  "Barclays Client A", etc.
- UX: after a successful detect+confirm, show a "Save this profile"
  prompt with an editable name. On subsequent uploads, offer "Use saved
  profile: [name]" before falling back to auto-detection.
- The CLI version should support profiles too — a `--profile <name>`
  flag that reads from a local `~/.csv-agent/profiles/` directory of
  JSON files. `--save-profile <name>` writes one after detection.

### 2. Saved merchant classifications — "remember how I categorise"

`classifyMerchants()` currently runs an LLM call on every session to
sort merchants into the chart of accounts. For a recurring user, most
merchants are the same every month. Save the classification map and
only classify *new* merchants on subsequent runs.

Implementation notes:
- The classification map is `{ merchantName: accountCategory }` — what
  `classifyMerchants()` already produces.
- Persist alongside (or inside) the saved profile: "Monzo Current"
  profile includes its accumulated merchant map.
- On a new file with a saved profile: extract unique merchants, diff
  against the saved map, only send *unknown* merchants to the LLM for
  classification. Merge the results back into the saved map.
- This directly reduces LLM cost on recurring use — the first run is
  full-price, subsequent runs only pay for new merchants.
- Allow manual override: the user should be able to reclassify a
  merchant ("no, Costa Coffee is Client Entertainment, not Dining") and
  have that override stick in the saved map permanently.

### 3. "Run last month's recipe" — one-click recurring pipeline

Combine saved profile + saved merchant map into a **recipe**: drop a new
CSV from the same bank, recipe auto-applies the profile and known
classifications, flags new/unknown merchants for review, and produces
the P&L — all without re-answering any questions.

UX flow:
1. User drops a new CSV.
2. If a saved profile matches (by bank name or column fingerprint),
   offer "Apply saved recipe: [name]?"
3. On yes: adapt with saved profile, classify with saved map (LLM only
   for unknowns), run `generate_pl` automatically.
4. Show the P&L result immediately, with any new merchants highlighted
   for the user to confirm/reclassify before finalising.
5. "Save updated recipe" persists any new classifications.

### 4. Export to accounting-system format

After the P&L is generated (or after categorisation), let the user
export in a format their accounting software accepts directly:

- **Xero CSV import** format (Date, Amount, Payee, Description,
  Reference, Account Code — Xero's own template)
- **QuickBooks IIF** or QuickBooks Online CSV format
- **FreeAgent CSV import** format

This is the conversion trigger — the moment a free tool becomes worth
paying for. A bookkeeper who can go from "raw Monzo export" to
"Xero-ready import file" in 30 seconds, every month, without manual
reformatting, is a bookkeeper who'll pay for the tool.

Implementation notes:
- Each export format is a deterministic mapping from the canonical
  schema + chart-of-accounts categories to the target system's expected
  columns. No LLM needed — pure JS transformation.
- Start with Xero (most common among UK bookkeepers using cloud
  accounting). Add QuickBooks and FreeAgent as separate export
  functions.
- The account-code mapping (Xero account codes are numeric, e.g.
  "200" for Sales, "429" for General Expenses) should be configurable
  per recipe — different clients may use different Xero chart
  structures.
- Export button on the answer card / P&L view: "Download for Xero",
  "Download for QuickBooks".

### 5. Messy sample data — show off the adaptation layer

**This is a separate, standalone task** (see the dedicated section
below). It can be done independently of goals 1-4 and should be done
first, because it immediately improves the demo without any backend
changes.

## Constraints

- Do not change the agent loop (`lib/agent-core.js`) — the agentic
  tool-calling mechanism is working and tested. Goals 1-4 are about
  what happens *before* and *after* the loop, not inside it.
- Do not change `tools.js` unless adding a new tool (e.g. an export
  tool) — existing tools should keep working identically.
- `lib/csv-adapt.js` may need refactoring to accept a saved profile
  instead of always calling `detectProfile()`, but the deterministic
  transform logic should remain the same.
- Start with `localStorage` for persistence. Do not add a database,
  auth, or user accounts yet — keep it a local-first tool that a
  single user can run. Multi-user / cloud persistence is a later
  decision.
- Keep the CLI and web frontend feature-equivalent where it makes
  sense (saved profiles should work in both), but don't force
  feature parity where it's awkward (the column-confirm panel is
  web-only and that's fine).

## Build order

1. **Messy sample data** (standalone, see below) — improves the demo
   immediately, no backend changes. ✅ Done — 2026-08-14.
2. **Saved profiles** (goal 1) — the smallest useful persistence
   feature; unlocks everything else. ✅ Done — 2026-08-14.
3. **Saved merchant classifications** (goal 2) — depends on profiles
   existing.
4. **Recipe flow** (goal 3) — combines 1 + 2 into a one-click
   pipeline.
5. **Export formats** (goal 4) — independent of 1-3 technically, but
   only valuable once the categorisation is reliable (i.e. after
   recipes work).

Do them in this order. Each goal should be a separate commit (or PR)
that works independently — don't build goals 1-4 as one giant change.

---

# Messy Sample Data — Show Off the Adaptation Layer

**✅ Done — 2026-08-14** (`data/sample-messy.csv` + two-button sample picker).

## The problem

The current sample data (`data/transactions.csv`) is already in
canonical format. When a new visitor clicks "try with sample data",
the adaptation layer does nothing visible — the most impressive part
of the tool is invisible. The visitor sees "CSV loaded, ask a
question" and has no idea the tool can handle messy bank exports.

## The fix

Create a second sample file, `data/sample-messy.csv`, that
deliberately contains every real-world problem the adaptation layer
can handle. Make "try with sample data" use this file instead (or
offer both: "Try with clean data" / "Try with messy bank export").

## What the messy sample should contain

Model it on a realistic UK bank export — not a torture test, but the
kind of file a real Monzo/Starling/Barclays CSV export actually
produces. Include ALL of the following:

### Structural mess
- **Preamble rows** before the actual data (2-3 rows of bank name,
  account number, statement period — the kind of header junk real
  bank exports include)
- **Different column names** than the canonical schema: `Transaction
  Date` instead of `Date`, `Transaction Description` or `Merchant`
  instead of `Description`, split `Money In` / `Money Out` columns
  instead of a single `Amount`
- **Extra columns** the tool should ignore: `Balance`, `Transaction
  Type`, `Reference`, `Card Number (Last 4 Digits)`

### Data mess
- **Pound sign in amount values**: e.g. with pound signs prepended to
  numbers — the mojibake problem the README already mentions
- **Mixed date formats within the file**: most rows as `DD/MM/YYYY`
  (UK standard), but a few as `YYYY-MM-DD` (from an amended
  transaction or a mid-statement format change)
- **Commas inside quoted fields**: a description like
  `"ACME Corp, London"` — tests that the parser handles RFC 4180
  quoting correctly
- **Empty rows** scattered in the middle (common in Excel-exported
  CSVs)
- **Trailing whitespace** on some merchant names
- **Inconsistent capitalisation**: `TESCO`, `Tesco`, `tesco` for the
  same merchant
- **A transfer / drawing that should be excluded from the P&L**: a
  row like "Transfer to Savings" or "Owner's Drawing" that the
  chart-of-accounts exclude bucket should catch

### Content (make it realistic, not lorem-ipsum)
- ~30-50 rows of plausible UK transactions: supermarkets (Tesco,
  Sainsbury's), fuel (Shell, BP), SaaS subscriptions (Slack, Notion,
  Adobe), dining (Pret, Wagamama), utilities (British Gas, Thames
  Water), insurance, accountancy fees, a couple of income rows
  (client payments), and the transfer/drawing mentioned above
- Dates spanning 2-3 months so the P&L has something to group by
- A mix of small daily transactions and larger monthly ones

### What the demo should show

When the visitor clicks "try with messy bank export":
1. The file loads and the **column-confirm panel** appears (because
   the file is NOT canonical — this is the key moment that was
   previously invisible).
2. The detected profile is shown: "`Transaction Date` -> Date",
   "`Money In`/`Money Out` -> Amount", etc.
3. The canonical preview updates live as the user confirms columns.
4. The pound signs, preamble rows, and empty rows are visibly stripped.
5. Once confirmed, the agent loop runs and the P&L correctly
   excludes the transfer/drawing.

The visitor should come away thinking: "oh, it handled all of that
automatically — I didn't have to clean the file first." That's the
pitch in action.

## Implementation

- Create `data/sample-messy.csv` with the content described above.
  Hand-write it — do not generate it with a script, because the
  specific messiness patterns need to be deliberate and controlled.
- Update the "try with sample data" button / flow:
  - Option A (simpler): replace the current sample with the messy
    one. The clean canonical version stays in the repo as
    `data/transactions.csv` for testing/reference but isn't the
    default demo.
  - Option B (better UX): offer two buttons — "Try with clean data"
    and "Try with messy bank export". The messy one is visually
    emphasised as the recommended demo path.
- Update `/api/sample/route.ts` to serve the messy file (or both,
  with a query param).
- The CLI should also work with it: `node agent.js data/sample-messy.csv "Give me a P&L"` should produce a correct
  P&L after visible adaptation output.

## Verification

- Run the messy sample through the CLI and confirm:
  - Adapting CSV fires (not skipped)
  - Detection lines show correct column detection
  - The canonical output has clean dates, merged amounts (no pound
    signs), no preamble, no empty rows
  - The P&L excludes the transfer/drawing row
  - Tesco/TESCO/tesco are classified as the same merchant
- Run it through the web frontend and confirm:
  - The column-confirm panel appears
  - The canonical preview is correct
  - The agent produces a correct P&L
- Run the *existing* clean sample and confirm it still works
  unchanged (regression check).