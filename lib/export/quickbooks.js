// QuickBooks Online CSV export — a deterministic mapping from the canonical
// schema (Date,Description,Amount,Category,Bank) to the plain bank-
// transaction CSV that QBO's own "Banking -> Upload from file" import
// accepts (NOT the desktop IIF format, and NOT a Journal Entry import).
//
// Column format verified against Intuit's own "Format CSV files... to get
// bank transactions into QuickBooks" support article and corroborating
// third-party import guides (see the PR/report for exact sources): a flat
// Date,Description,Amount CSV with a header row, signed Amount (negative =
// money out). Multiple independent sources agree this native import path
// accepts ONLY 3 (or 4, Credit/Debit split) columns and has no field for a
// pre-coded account/category — imported rows land in QBO's "For Review" tab
// for the user to categorise by hand or via rules, unlike Xero's precoded
// bank-statement import. Confidence on that "no account column" point is
// medium-high (Intuit's own primary article could not be fetched directly;
// triangulated from agreeing secondary sources instead) — flagging here
// rather than silently guessing wrong, since this is used for real
// bookkeeping. accountCodeMap is accepted only for interface parity with
// toXeroCsv/toFreeAgentCsv and is currently unused.
//
// Dates are converted from canonical DD/MM/YYYY to YYYY-MM-DD: QBO's
// importer doesn't know the file is UK, and ISO dates avoid the classic
// UK/US date-misread corruption risk that a bare DD/MM/YYYY file risks in a
// US-locale-defaulting importer.

const { csvEscape } = require('../csv-adapt');

const HEADER = ['Date', 'Description', 'Amount'];

function toIsoDate(ukDate) {
  const [day, month, year] = String(ukDate).split('/');
  return `${year}-${month}-${day}`;
}

// rows: canonical rows ({ Date, Description, Amount, Category, Bank }, Date
// already DD/MM/YYYY, Amount already signed money-in-positive per
// lib/csv-adapt.js's convention).
// accountCodeMap: accepted for interface parity with the other exporters,
// not used — QBO's native CSV import has no account/category field.
// Returns { csv, unmappedCategories, unmappedRowCount } — always
// unmappedCategories: [] / unmappedRowCount: 0 since there is nothing to map.
function toQuickbooksCsv(rows, accountCodeMap = {}) {
  const lines = rows.map((row) =>
    [toIsoDate(row.Date), row.Description, row.Amount].map(csvEscape).join(',')
  );

  return {
    csv: `${HEADER.join(',')}\n${lines.join('\n')}\n`,
    unmappedCategories: [],
    unmappedRowCount: 0,
  };
}

module.exports = { toQuickbooksCsv, QUICKBOOKS_HEADER: HEADER };
