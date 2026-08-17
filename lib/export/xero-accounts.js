// Default chart-of-accounts-category -> Xero nominal-code mapping, for the
// UK standard chart of accounts Xero provisions on a new organisation.
// Verified against multiple independent sources (Xero's own default UK COA
// is not machine-readable/publicly hosted as a single canonical document —
// see the PR/report for exactly what was cross-checked and where confidence
// is lower). This is a STARTING POINT, not a guarantee: every real Xero
// organisation customises its chart of accounts, and codes here are
// deliberately overridable per recipe before any export (see
// src/lib/saved-profiles.ts's xeroAccountCodes / lib/profile-store.js).
//
// Categories in the `exclude` P&L section (lib/accounts.js) are
// DELIBERATELY left unmapped (null) rather than guessed — Transfer,
// Drawings, VAT, Tax & PAYE, Loan Principal and Capital Expenditure all
// post to balance-sheet/control accounts that are highly org-specific
// (e.g. every organisation's own VAT control account, director's loan
// account, drawings account), and guessing wrong here risks silently
// misposting a real client's books. Uncategorised is left unmapped for the
// same reason it's excluded from the P&L: it isn't safe to guess.
const XERO_ACCOUNT_CODES = {
  // Income
  'Sales / Revenue': '200',
  'Other Income': '260',

  // Cost of sales
  'Cost of Goods Sold': '310',
  Subcontractors: '321',

  // Overheads
  'Wages & Salaries': '477',
  'Rent & Rates': '469',
  Utilities: '445', // Light, Power, Heating
  Insurance: '433',
  'Travel & Motoring': '449', // Motor Vehicle Expenses — closest single code; this
  // category also covers rail/flights/taxi (Xero splits those into
  // 493/494 Travel), a known simplification — see PR report.
  Telecommunications: '489', // Telephone & Internet
  'Office & Admin Supplies': '461', // Printing & Stationery
  'Marketing & Advertising': '400',
  'Meals & Entertainment': '420',
  'Loan Interest': '437',
  'Bank Charges & Fees': '404',
  'Professional Fees': '401', // Audit & Accountancy Fees
  'Subscriptions & Software': '485',
  'Repairs & Maintenance': '473',
  'Other Expenses': '429', // General Expenses

  // Exclude bucket — always requires explicit user mapping, see comment above.
  Transfer: null,
  Drawings: null,
  VAT: null,
  'Tax & PAYE': null,
  'Loan Principal': null,
  'Capital Expenditure': null,
  Uncategorised: null,
};

module.exports = { XERO_ACCOUNT_CODES };
