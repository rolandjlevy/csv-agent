---
description: 'Rewrite the csv-agent homepage as Statement Sorter — reposition from AI-mechanism framing to bookkeeping-outcome framing.'
agent: agent
---

# Homepage rewrite — reposition as Statement Sorter

## Why this change

The tool is now live at **statementsorter.co.uk** but the homepage still
brands as "CSV Agent" and sells the _mechanism_ (an AI agent that reads
CSVs and chooses its own tools) rather than the _outcome_.

The target user is a **UK bookkeeper or small-practice accountant** who
handles multiple clients' bank exports every month. They do not care that
there's an agent loop or tool-calling under the hood. They care about:
categorisation against a chart of accounts, keeping balance-sheet items
off the P&L, and getting the result into Xero without manual reformatting.

Competitive context: the "bank statement converter" market is crowded
(DocuClipper, CapyParse, Statement Extract, EntryRocket, Datamolino, and
free tools like csvtools.com/csv-to-xero). Almost all of them are
PDF→CSV OCR tools that stop once they have clean rows. **Our
differentiator is what happens after that** — accounting-correct
categorisation, and saved per-client recipes so month two takes seconds.
The homepage must lead with that, not with format conversion or AI.

## Scope

**This is a content, copy, and layout task on the homepage only.**

- Do not change `lib/agent-core.js`, `lib/csv-adapt.js`, `lib/accounts.js`,
  or `tools.js`.
- Do not change the upload handling, sample-data endpoints, or any agent
  behaviour.
- Do change: page copy, headings, layout/structure of the landing view,
  CTA prominence, and the app name/branding where it appears in the UI.

## 1. Rename throughout the UI

Replace "CSV Agent" with **Statement Sorter** everywhere it appears in
user-facing UI: the page heading, `<title>`, meta description, any
favicon alt text, footer, and Open Graph tags if present.

Leave the repo name, package name, and internal module names alone —
this is a UI rename only, not a codebase rename.

## 2. Above the fold

Replace the current hero (heading, subheading, and the "An AI agent that
reads any bank's CSV and answers your questions in plain English —
choosing its own tools as it goes" line) with:

**Heading:** Statement Sorter

**Tagline:** Bank statements in. Categorised books out.

**Supporting line:** Drop any UK bank's CSV. It sorts every transaction
into a proper chart of accounts, keeps transfers and drawings off your
P&L, and exports straight into Xero.

Notes:

- Remove the phrase "choosing its own tools as it goes" entirely. It's
  the most interesting sentence to a developer and the least interesting
  to a bookkeeper. It can live in the GitHub README instead.
- Keep the existing underline/highlight styling treatment if it looks
  good, but apply it to the words that now matter: "chart of accounts",
  "P&L", "Xero".

## 3. Make the messy-sample CTA primary

Currently "✨ Try with a messy bank export" sits below the drop zone as a
secondary action. **Promote it to at least equal prominence with the drop
zone — ideally more.**

Reasoning: a first-time visitor has no CSV to hand, and a bookkeeper will
not upload real client financial data to an unfamiliar tool on first
visit. The messy demo _is_ the conversion path. It's also the only way
the adaptation layer (the most impressive part of the product) becomes
visible before signup.

Implementation: make it a prominent, visually emphasised button. The
drop zone can remain, but the demo button should not read as an
afterthought. Keep "or try with clean sample data" as the smaller
tertiary link.

## 4. Fill the dead space with a benefit strip

There is currently a large empty gap between the subheading and the drop
zone. Use it for **three short columns** (stack vertically on mobile):

**Categorised, not just converted**
Every transaction sorted into income, cost of sales and overheads.
Transfers, drawings and VAT stay off the P&L automatically.

**It remembers your clients**
Save a client's setup once. Next month is one click — no re-mapping
columns, no re-categorising the same merchants.

**Any UK bank, no setup**
An AI agent reads the file and works out the format itself. Monzo,
Starling, Tide, or a building society nobody's heard of.

Note on the third column: this is the _only_ place AI is mentioned, and
it's framed as the reason a capability exists (no template library to
wait for) rather than as a selling point in itself. Do not add
"AI-powered" badges or similar anywhere else.

## 5. Add a "How it works" strip

Below the drop zone / CTA area, four steps, one short line each:

1. **Drop the CSV** — any UK bank, any column layout
2. **It works out the format** — dates, split money in/out columns, £ signs
3. **Review the categorisation** — anything unclear is flagged, not guessed
4. **Download for Xero** — correctly mapped, ready to import

Keep this visually light — numbered steps or simple icons, not heavy
cards.

## 6. Secondary features, lower down and smaller

Below "How it works", a compact list (not big cards):

- **A real P&L, with exceptions flagged** — anything it can't classify is
  surfaced for review, not silently guessed
- **Built for UK practice** — UK dates, VAT handling, UK chart of accounts
  conventions. Not a US tool with UK bolted on
- **Ask anything, in plain English** — "what did they spend on software in
  Q2?" Answered from the categorised data, no exporting required
- **Nothing leaves your browser** — no uploads, no storage, no accounts

Ordering matters: "ask anything in plain English" is table stakes in this
market (many competitors and free tools do it), so it must not appear
above the categorisation or recipe messaging.

## 7. Optional — before/after visual

If straightforward, add a single visual between the tagline and the drop
zone showing a messy bank CSV on the left and a clean categorised P&L on
the right. This communicates the value proposition faster than any copy
above.

Only do this if you can produce something genuinely clear. A poor or
placeholder graphic is worse than none — skip it and note that you did.

## Constraints

- Keep the existing dark theme and visual style. This is a copy and
  layout change, not a redesign.
- Keep the page responsive — the three-column benefit strip must stack
  cleanly on mobile.
- Do not introduce new dependencies for this.
- Do not add testimonials, fake logos, "trusted by" strips, or invented
  social proof.
- Do not add pricing yet unless it already exists elsewhere in the app.
- Do not claim accuracy percentages, bank counts, or user numbers — we
  have no data to support them, and unverifiable claims in this market
  are easy to check and damaging when wrong.

## Verification

- Page renders correctly at mobile, tablet and desktop widths
- "CSV Agent" no longer appears anywhere in user-facing UI (check
  `<title>` and meta tags too)
- Both sample-data paths still work (messy and clean)
- Drag-and-drop upload still works unchanged
- No console errors
- Lighthouse/accessibility: headings in logical order, buttons have
  accessible names, sufficient contrast on the dark theme

## Output format

> **Files changed** — with a one-line reason for each
> **Copy changes** — old vs new for the hero section
> **Layout changes** — what moved, what was added
> **Before/after visual** — whether you added one, and why or why not
> **Verification results** — what you checked
> **Anything left undone** — with reasoning
