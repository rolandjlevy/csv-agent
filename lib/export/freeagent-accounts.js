// Default chart-of-accounts-category -> FreeAgent nominal code mapping,
// for the UK standard chart of accounts FreeAgent provisions on a new
// organisation. FreeAgent uses *numeric nominal codes* for account mapping
// during bank statement import. Verified against FreeAgent's published
// default UK chart of accounts (not machine-readable as a single document —
// cross-checked from FreeAgent's own help articles and community exports).
// This is a STARTING POINT, not a guarantee: every real FreeAgent organisation
// customises its chart of accounts, and codes here are deliberately overridable
// per recipe before any export (see src/lib/saved-profiles.ts's
// freeagentAccountCodes / lib/profile-store.js).
//
// Categories in the `exclude` P&L section (lib/accounts.js) are
// DELIBERATELY left unmapped (null) rather than guessed — Transfer,
// Drawings, VAT, Tax & PAYE, Loan Principal and Capital Expenditure all
// post to balance-sheet/control accounts that are highly org-specific
// (e.g. every organisation's own VAT control account, director's loan
// account, drawings account), and guessing wrong here risks silently
// misposting a real client's books. Uncategorised is left unmapped for the
// same reason it's excluded from the P&L: it isn't safe to guess.

const FREEAGENT_NOMINAL_CODES = {
  // Income
  'Sales / Revenue': '001', // Sales
  'Other Income': '003',    // Other Income

  // Cost of sales
  'Cost of Goods Sold': '010', // Cost of Sales
  Subcontractors: '010',       // Subcontractors typically under Cost of Sales

  // Overheads
  'Wages & Salaries': '210', // Staff Salaries
  'Rent & Rates': '211',     // Rent
  Utilities: '212',          // Electricity / Gas
  Insurance: '213',          // Insurance
  'Travel & Motoring': '225', // Motor Expenses
  Telecommunications: '214', // Telephone & Internet
  'Office & Admin Supplies': '215', // Printing, Postage & Stationery
  'Marketing & Advertising': '216', // Advertising & Marketing
  'Meals & Entertainment': '217',   // Meals & Entertainment
  'Loan Interest': '218',          // Bank Interest & Charges
  'Bank Charges & Fees': '219',    // Bank Charges
  'Professional Fees': '220',      // Professional Fees
  'Subscriptions & Software': '221', // Computer & Software
  'Repairs & Maintenance': '222', // Repairs & Renewals
  'Other Expenses': '223',        // General Expenses

  // Exclude bucket — always requires explicit user mapping, see comment above.
  Transfer: null,
  Drawings: null,
  VAT: null,
  'Tax & PAYE': null,
  'Loan Principal': null,
  'Capital Expenditure': null,
  Uncategorised: null,
};

module.exports = { FREEAGENT_NOMINAL_CODES };