// Default chart-of-accounts-category -> QuickBooks Online category NAME
// reference table (not a numeric code, unlike lib/export/xero-accounts.js —
// see below for why) for the 26 canonical categories in lib/accounts.js.
//
// QBO's native CSV bank import (lib/export/quickbooks.js) has no
// account/category field at all, so this table is NOT consumed by the
// exporter — it exists purely as a read-only reference the web UI shows
// next to the QuickBooks export tab, so a bookkeeper hand-categorising rows
// in QBO's "For Review" tab afterward has a suggested starting name per
// category instead of guessing. It's also forward-compatible groundwork
// should a coding-capable QBO export (e.g. a Journal Entry CSV import) get
// added later.
//
// Names, not codes, because QuickBooks Online's default chart of accounts
// varies by company/industry type chosen at signup, and numeric account
// numbering is an opt-in feature most QBO companies never turn on — there
// is no single canonical numeric scheme the way Xero provisions one on
// every new UK organisation. Sourced from independent third-party category
// lists (fitsmallbusiness.com's QBO expense-category guide, qbkaccounting.com,
// several Intuit community threads) rather than a single primary Intuit
// document, since QBO doesn't publish one canonical list — see the PR/report
// for what was cross-checked. Confidence varies per row (see comments);
// several rows also overlap with a neighbouring category (flagged inline) —
// this is a starting point, not a guarantee, same caveat as
// lib/export/xero-accounts.js.
//
// Exclude-bucket categories (Transfer, Drawings, VAT, Tax & PAYE, Loan
// Principal, Capital Expenditure, Uncategorised) are left unmapped (null)
// for the same reason xero-accounts.js leaves them unmapped: these post to
// balance-sheet/control accounts that are highly org-specific, and guessing
// wrong risks misleading a bookkeeper handling a real client's books.
const QUICKBOOKS_ACCOUNT_NAMES = {
  // Income
  'Sales / Revenue': 'Sales', // medium confidence — some company types default to "Services" instead
  'Other Income': 'Other income', // medium

  // Cost of sales
  'Cost of Goods Sold': 'Cost of Goods Sold', // medium-high
  Subcontractors: 'Contract labor', // medium

  // Overheads
  'Wages & Salaries': 'Payroll expenses', // medium
  'Rent & Rates': 'Rent & lease', // high
  Utilities: 'Utilities', // high
  Insurance: 'Insurance', // high
  'Travel & Motoring': 'Car & truck', // medium-high — QBO also splits out a
  // plain "Travel" category (rail/flights/taxi), same single-code
  // simplification xero-accounts.js documents for this category.
  Telecommunications: 'Telephone', // medium — some default sets fold this into Utilities instead
  'Office & Admin Supplies': 'Office supplies & software', // high — overlaps
  // with Subscriptions & Software below, flagged there too.
  'Marketing & Advertising': 'Advertising & marketing', // high
  'Meals & Entertainment': 'Meals & entertainment', // high
  'Loan Interest': 'Interest paid', // high
  'Bank Charges & Fees': 'Bank charges & fees', // high
  'Professional Fees': 'Legal & professional services', // high
  'Subscriptions & Software': 'Dues & subscriptions', // medium — overlaps with
  // Office & Admin Supplies above; QBO doesn't cleanly separate the two.
  'Repairs & Maintenance': 'Repairs & maintenance', // high
  'Other Expenses': 'Other business expenses', // medium

  // Exclude bucket — always requires explicit user judgement, see comment above.
  Transfer: null,
  Drawings: null,
  VAT: null,
  'Tax & PAYE': null,
  'Loan Principal': null,
  'Capital Expenditure': null,
  Uncategorised: null,
};

module.exports = { QUICKBOOKS_ACCOUNT_NAMES };
