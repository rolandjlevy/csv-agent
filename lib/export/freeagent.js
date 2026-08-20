// FreeAgent bank-statement CSV import — a deterministic mapping from
// the canonical schema (Date,Description,Amount,Category,Bank) to the
// FreeAgent "Upload Bank Statement" CSV format.
//
// Column format per FreeAgent's "Import bank transactions" help article
// and community exports: Date, Amount, Description, Reference, Type,
// Category (nominal code). The "Category" column is FreeAgent's term for
// the nominal account code — this is the key differentiator from Xero
// (which uses "AccountCode") and QB (which doesn't support pre-coding).
//
// Every canonical row is included in the export, not just P&L rows —
// this is a BANK STATEMENT, which must reconcile against the real bank
// feed. Omitting transfers/drawings/VAT/loan-principal/capital-purchase
// rows (lib/accounts.js's "exclude" bucket) would leave real money
// movements out of the imported statement, breaking reconciliation. FreeAgent
// itself keeps those rows off the P&L via the *type* of account they're
// coded to (equity/liability/asset), not by the row being absent from the
// bank import — which is exactly why those categories have no *default*
// nominal code (see lib/export/freeagent-accounts.js) and must be
// explicitly mapped by the user to their own real balance-sheet accounts first.

const { csvEscape } = require('../csv-adapt');

const HEADER = ['Date', 'Amount', 'Description', 'Reference', 'Type', 'Category'];

// rows: canonical rows ({ Date, Description, Amount, Category, Bank }, Date
// already DD/MM/YYYY and Amount already signed money-in-positive per
// lib/csv-adapt.js's own convention — FreeAgent expects money-in-positive).
// accountCodeMap: { [category]: string | null | undefined } — from
// lib/export/freeagent-accounts.js merged with any saved recipe overrides.
// Returns { csv, unmappedCategories, unmappedRowCount } — csv is still
// produced even when some rows are unmapped (blank Category), so a
// caller can preview it, but unmappedCategories/unmappedRowCount are what a
// caller MUST check before actually offering the file for download, per
// the "don't silently export blank" requirement.
function toFreeAgentCsv(rows, accountCodeMap = {}) {
  const unmappedCategories = new Set();
  let unmappedRowCount = 0;

  const lines = rows.map((row) => {
    const code = accountCodeMap[row.Category];
    if (!code) {
      unmappedCategories.add(row.Category || '(no category)');
      unmappedRowCount += 1;
    }
    // Type: "Money In" for positive amounts, "Money Out" for negative
    // But our Amount is already signed positive=in, negative=out
    const type = row.Amount && row.Amount.toString().startsWith('-') ? 'Money Out' : 'Money In';
    return [row.Date, row.Amount, row.Description, row.Description, type, code || '']
      .map(csvEscape)
      .join(',');
  });

  return {
    csv: `${HEADER.join(',')}\n${lines.join('\n')}\n`,
    unmappedCategories: [...unmappedCategories],
    unmappedRowCount,
  };
}

module.exports = { toFreeAgentCsv, FREEAGENT_HEADER: HEADER };