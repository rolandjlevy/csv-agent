# Adapter Stress-Test Findings

Two harnesses cover the two LLM-driven stages separately:

- **`node stress-test/run.js`** — transformer harness (`applyProfile`): feeds
  each bank fixture the profile a correct `detectProfile` should return, so
  these are pure deterministic results — isolated from any LLM detection error.
- **`node stress-test/test-classify-fixture.js`** — classifier harness
  (`classifyMerchants`): 20 realistic bank-statement strings (including tricky
  exclude-bucket cases) sent to the live LLM; checks known-correct COA
  categories, flags any exclude-coded transaction that lands on the P&L as
  critical.

## Transformer results

All six cases pass.

| Bank export | Quirk tested | Result |
|---|---|---|
| Lloyds | split Debit/Credit columns | ✓ pass |
| Nationwide | 3 preamble rows + £ symbols + split | ✓ pass |
| Barclays | preamble row + parenthesised negatives | ✓ pass |
| Revolut | multi date column + separate Fee | ✓ pass (see Finding 3) |
| HSBC | no header row | ✓ pass (Finding 2 — fixed) |
| Monzo | unquoted thousands separator in amount | ✓ pass (Finding 1 — fixed) |

## Classifier results

19/20 correct on first run; 20/20 after fixing the PayPal/person-name prompt rule
(see Finding 4). No exclude-coded transactions mis-routed to the P&L.

---

## Finding 1 — FIXED: unquoted thousands separators truncated amounts

**Status: fixed in `lib/csv-adapt.js` (`rejoinSplitNumber`).**

`£3,200.00` came out as **£3.00**. `-£1,234.56` came out as **-£1.00**.

Cause: the amount field contained a comma (`3,200.00`) and the bank exported it
*unquoted*. `csv-parse` split on that comma, so the amount column captured only
`£3` and `200.00` spilled into a phantom trailing column. `parseAmount("£3")`
returned `3`. No error was thrown — the row looked fine.

Impact: any transaction ≥ £1,000 from a bank that exports thousands-separated
amounts without quoting was understated by ~3 orders of magnitude, silently.
On a real client this is a P&L that is silently, confidently wrong — the single
most dangerous bug class for a product whose pitch is "you can trust the numbers."

Fix applied: in `applyProfile`, when `relax_column_count` yields a row with more
columns than the header and the amount cell is immediately followed by a
purely-numeric fragment, `rejoinSplitNumber` rejoins them before `parseAmount`.

---

## Finding 2 — FIXED: headerless exports yielded zero rows

**Status: fixed in `lib/csv-adapt.js` (`hasHeaderRow` profile field).**

HSBC personal current-account CSVs export with **no header row**. `applyProfile`
treated `records[0]` as the header, so the first transaction became the header
and every subsequent row failed column lookup → 0 rows, no error.

Fix applied: `detectProfile` can now report `hasHeaderRow: false` with 0-based
column indexes. `applyProfile` synthesises a positional header when absent.

---

## Finding 3 — OPEN: separate Fee column ignored (Revolut, Wise, etc.)

A `-8.40` card payment with a `0.20` Fee is recorded as `-8.40`. True cost is
`-8.60`, and the fee never lands anywhere. Under-states cost and loses a
`Bank Charges & Fees` entry.

Options (not yet decided):
1. **Fold fee into the transaction amount** — simpler, one row, amount is correct.
2. **Emit fee as its own row** — more transparent, enables per-category fee totals.

The chart-of-accounts (`lib/accounts.js`) is now in place, so the right target
account for the fee row is `Bank Charges & Fees` (code 6510). Implement either
option when the next real Revolut/Wise export is tested against a live client.

---

## Finding 4 — FIXED: PayPal/person-name mis-classified as Subcontractors

**Status: fixed in the `classifyMerchants` prompt (`CLASSIFY_PROMPT` rule 8).**

`PAYPAL *JAMES WILSON` was assigned to `Subcontractors` on the first classifier
run. The model inferred "person's name after PAYPAL = freelancer" — a plausible
guess, but guessing is explicitly forbidden for ambiguous cases (it could equally
be drawings, a customer refund, or a personal transfer).

Fix applied: rule 8 in `CLASSIFY_PROMPT` now explicitly covers the
`PAYPAL *<name>` / `WISE *<name>` / `VENMO *<name>` pattern: without an invoice
or business reference, assign `Uncategorised` — never guess. Confirmed 20/20 on
the next run.

---

## Extending this

**Transformer harness (`stress-test/run.js`):** drop a real client export into
`fixtures/`, add a `CASES` entry with the correct profile and expected canonical
rows, and re-run. Build to 5–10 genuinely messy real-world exports; that corpus
*is* the evidence base for any "handles any bank" claim and doubles as a
regression suite.

**Classifier harness (`stress-test/test-classify-fixture.js`):** add new cases to
`fixtures/classify-cases.js` — particularly edge cases where the correct answer
is `Uncategorised`. Run before any change to `CLASSIFY_PROMPT` and after.

**Outstanding validation debt:** neither harness tests the live `detectProfile`
LLM call end-to-end. That needs a real API key and 5–10 actual messy client CSVs
(not synthetic fixtures) before any "handles any bank" claim is made to a
bookkeeper.
