// Default chart-of-accounts-category -> QuickBooks Online account code mapping,
// for the UK standard chart of accounts QuickBooks Online provisions on a new
// organisation. QuickBooks Online uses *names* not numeric codes for account
// mapping during bank statement import — the "Account" column in the CSV
// expects the exact account name as it appears in the user's Chart of Accounts.
// This table maps our categories to the QB Online *default* account names.
// Verified against Intuit's published default UK chart of accounts (not
// machine-readable as a single document — cross-checked from multiple
// community sources and QB Online trial org exports). This is a STARTING POINT,
// not a guarantee: every real QB Online organisation customises its chart of
// accounts, and names here are deliberately overridable per recipe before any
// export (see src/lib/saved-profiles.ts's quickbooksAccountCodes /
// lib/profile-store.js).
//
// Categories in the `exclude` P&L section (lib/accounts.js) are
// DELIBERATELY left unmapped (null) rather than guessed — Transfer,
// Drawings, VAT, Tax & PAYE, Loan Principal and Capital Expenditure all
// post to balance-sheet/control accounts that are highly org-specific
// (e.g. every organisation's own VAT control account, director's loan
// account, drawings account), and guessing wrong here risks silently
// misposting a real client's books. Uncategorised is left unmapped for the
// same reason it's excluded from the P&L: it isn't safe to guess.

const QUICKBOOKS_ACCOUNT_NAMES = {
  // Income
  'Sales / Revenue': 'Sales of Product Income',
  'Other Income': 'Other Income',

  // Cost of sales
  'Cost of Goods Sold': 'Cost of Goods Sold',
  Subcontractors: 'Cost of Goods Sold', // QB Online often uses single COGS account; user can override

  // Overheads
  'Wages & Salaries': 'Wages and Salaries',
  'Rent & Rates': 'Rent',
  Utilities: 'Utilities',
  Insurance: 'Insurance',
  'Travel & Motoring': 'Travel',
  Telecommunications: 'Telephone',
  'Office & Admin Supplies': 'Office Supplies',
  'Marketing & Advertising': 'Advertising',
  'Meals & Entertainment': 'Meals and Entertainment',
  'Loan Interest': 'Interest Paid',
  'Bank Charges & Fees': 'Bank Charges',
  'Professional Fees': 'Professional Fees',
  'Subscriptions & Software': 'Subscriptions',
  'Repairs & Maintenance': 'Repairs and Maintenance',
  'Other Expenses': 'Other Business Expenses',

  // Exclude bucket — always requires explicit user mapping, see comment above.
  Transfer: null,
  Drawings: null,
  VAT: null,
  'Tax & PAYE': null,
  'Loan Principal': null,
  'Capital Expenditure': null,
  Uncategorised: null,
};

module.exports = { QUICKBOOKS_ACCOUNT_NAMES };