// QuickBooks Online bank-statement CSV import — a deterministic mapping from
// the canonical schema (Date,Description,Amount,Category,Bank) to the QB
// Online "3-column" or "4-column" CSV format for importing bank transactions.
//
// Column format per Intuit's "Import bank transactions using Excel CSV"
// support article: the standard bank import accepts either 3 columns
// (Date, Description, Amount) or 4 columns (Date, Description, Amount,
// Reference). QB Online does NOT support pre-populating the account code
// during bank-statement import — categorisation happens in the Banking
// centre after import. This export therefore produces a clean 4-column
// CSV (Date, Description, Amount, Reference) ready for the standard QB
// Online import flow. The Reference column is populated with the original
// Description (the bank's description), since the Description column is
// often used for a cleaner merchant name.
//
// Every canonical row is included in the export, not just P&L rows —
// this is a BANK STATEMENT, which must reconcile against the real bank
// feed. Omitting transfers/drawings/VAT/loan-principal/capital-purchase
// rows (lib/accounts.js's "exclude" bucket) would leave real money
// movements out of the imported statement, breaking reconciliation.

const { csvEscape } = require('../csv-adapt');

const HEADER = ['Date', 'Description', 'Amount', 'Reference'];

// rows: canonical rows ({ Date, Description, Amount, Category, Bank }, Date
// already DD/MM/YYYY and Amount already signed money-in-positive per
// lib/csv-adapt.js's own convention).
// accountCodeMap: NOT USED for QB Online CSV import (QB doesn't support
// pre-coding on bank import). Kept for API compatibility with the exporter
// registry — will be ignored.
// Returns { csv, unmappedCategories: [], unmappedRowCount: 0 } — QB Online
// CSV never has "unmapped" rows since there's no account code column.
function toQuickBooksCsv(rows, _accountCodeMap = {}) {
  const lines = rows.map((row) => [
    row.Date,
    row.Description,
    row.Amount,
    row.Description, // Reference = original bank description
  ]
    .map(csvEscape)
    .join(','));

  return {
    csv: `${HEADER.join(',')}\n${lines.join('\n')}\n`,
    unmappedCategories: [],
    unmappedRowCount: 0,
  };
}

module.exports = { toQuickBooksCsv, QUICKBOOKS_HEADER: HEADER };