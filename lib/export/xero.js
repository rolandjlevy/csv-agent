// Xero bank-statement CSV export — a deterministic mapping from the
// canonical schema (Date,Description,Amount,Category,Bank) to a "precoded"
// Xero bank-statement import, which pre-populates the account code during
// reconciliation instead of leaving every line for manual coding.
//
// Column format verified against Xero's own "Import a precoded bank
// statement in CSV format" support article and corroborating third-party
// guides (see the PR/report for exact sources and what couldn't be
// independently confirmed): Date, Amount, Payee, Description, Reference,
// AccountCode. TaxType and ContactName (Xero's other two optional precoding
// columns) are deliberately NOT included — this tool has no VAT/tax-rate
// concept to populate TaxType correctly, and auto-populating ContactName
// from noisy bank descriptions risks silently creating garbage contacts in
// the user's real Xero organisation.
//
// Every canonical row is included in the export, not just P&L rows —
// this is a BANK STATEMENT, which must reconcile against the real bank
// feed. Omitting transfers/drawings/VAT/loan-principal/capital-purchase
// rows (lib/accounts.js's "exclude" bucket) would leave real money
// movements out of the imported statement, breaking reconciliation. Xero
// itself keeps those rows off the P&L via the *type* of account they're
// coded to (equity/liability/asset), not by the row being absent from the
// bank import — which is exactly why those categories have no *default*
// account code (see lib/export/xero-accounts.js) and must be explicitly
// mapped by the user to their own real balance-sheet accounts first.

const { csvEscape } = require('../csv-adapt');

const HEADER = ['Date', 'Amount', 'Payee', 'Description', 'Reference', 'AccountCode'];

// rows: canonical rows ({ Date, Description, Amount, Category, Bank }, Date
// already DD/MM/YYYY and Amount already signed money-in-positive per
// lib/csv-adapt.js's own convention — both match what Xero's precoded CSV
// expects, so no reformatting happens here).
// accountCodeMap: { [category]: string | null | undefined } — from
// lib/export/xero-accounts.js merged with any saved recipe overrides.
// Returns { csv, unmappedCategories, unmappedRowCount } — csv is still
// produced even when some rows are unmapped (blank AccountCode), so a
// caller can preview it, but unmappedCategories/unmappedRowCount are what a
// caller MUST check before actually offering the file for download, per
// the "don't silently export blank" requirement.
function toXeroCsv(rows, accountCodeMap = {}) {
  const unmappedCategories = new Set();
  let unmappedRowCount = 0;

  const lines = rows.map((row) => {
    const code = accountCodeMap[row.Category];
    if (!code) {
      unmappedCategories.add(row.Category || '(no category)');
      unmappedRowCount += 1;
    }
    return [row.Date, row.Amount, row.Description, row.Description, '', code || '']
      .map(csvEscape)
      .join(',');
  });

  return {
    csv: `${HEADER.join(',')}\n${lines.join('\n')}\n`,
    unmappedCategories: [...unmappedCategories],
    unmappedRowCount,
  };
}

module.exports = { toXeroCsv, XERO_HEADER: HEADER };
