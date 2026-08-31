// FreeAgent CSV bank-statement export — a deterministic mapping from the
// canonical schema (Date,Description,Amount,Category,Bank) to the CSV
// FreeAgent's own "Upload bank transactions from a bank statement" import
// accepts.
//
// Column format verified against FreeAgent's own "Format a CSV file to
// upload a bank statement" support article (see the PR/report for exact
// sources): exactly three columns in a fixed order — Date, Amount,
// Description — with NO header row (FreeAgent's docs explicitly say not to
// include one). Date is DD/MM/YYYY and Amount is signed with money paid out
// negative, both already matching lib/csv-adapt.js's canonical convention
// exactly, so neither needs reformatting here (unlike the Xero/QuickBooks
// exporters). There is no account/nominal-code column — FreeAgent, like
// QuickBooks Online's native CSV import, has no pre-coding concept for a
// plain bank-statement upload; transactions are categorised afterward
// per-line in FreeAgent's "Explain transaction" screen. accountCodeMap is
// accepted only for interface parity with toXeroCsv and is currently
// unused.
//
// FreeAgent's docs also warn that commas inside the Description field can
// confuse their parser, which suggests it may not be strictly
// RFC4180-quote-aware. csvEscape (standard quoting) is used anyway as the
// safest available default — flagging the uncertainty here rather than
// silently trusting it, since this is used for real bookkeeping.

const { csvEscape } = require('../csv-adapt');

// rows: canonical rows ({ Date, Description, Amount, Category, Bank }, Date
// already DD/MM/YYYY, Amount already signed money-in-positive — both already
// match FreeAgent's expected convention).
// accountCodeMap: accepted for interface parity with the other exporters,
// not used — FreeAgent's bank-statement CSV import has no account field.
// Returns { csv, unmappedCategories, unmappedRowCount } — always
// unmappedCategories: [] / unmappedRowCount: 0 since there is nothing to map.
// csv has NO header row, per FreeAgent's own import requirements.
function toFreeAgentCsv(rows, accountCodeMap = {}) {
  const lines = rows.map((row) =>
    [row.Date, row.Amount, row.Description].map(csvEscape).join(',')
  );

  return {
    csv: `${lines.join('\n')}\n`,
    unmappedCategories: [],
    unmappedRowCount: 0,
  };
}

module.exports = { toFreeAgentCsv };
