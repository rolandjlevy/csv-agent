// Default chart-of-accounts-category -> FreeAgent category NAME reference
// table (not a numeric nominal code — see below for why) for the 26
// canonical categories in lib/accounts.js.
//
// FreeAgent's CSV bank-statement import (lib/export/freeagent.js) has no
// account/category field at all, so this table is NOT consumed by the
// exporter — it exists purely as a read-only reference the web UI shows
// next to the FreeAgent export tab, so a bookkeeper hand-categorising rows
// afterward (FreeAgent's "Explain transaction" screen) has a suggested
// starting name per category instead of guessing.
//
// Names, not numeric codes, because FreeAgent's exact per-category nominal
// codes aren't reliably documented publicly beyond its nominal-code RANGE
// structure (001-049 income, 100-199 cost of sales, 200-399 admin
// expenses — confirmed via FreeAgent's own developer API docs) plus a
// handful of example codes scattered across its docs — not enough to
// responsibly assert 15+ exact numbers for a tool used on real client
// books. Sourced from tinytax.co.uk's FreeAgent category-mapping guide,
// FreeAgent's developer API categories docs, and FreeAgent's own
// terminology support article — see the PR/report for what was cross-
// checked. Confidence varies per row (see comments); a few rows are known
// bundles/catch-alls in FreeAgent's own category list, flagged inline.
//
// Exclude-bucket categories are left unmapped (null), same never-guess
// reasoning as lib/export/xero-accounts.js. Transfer specifically is
// doubly correct to leave unmapped: FreeAgent handles transfers as a
// distinct transaction TYPE, not a P&L category at all.
const FREEAGENT_ACCOUNT_NAMES = {
  // Income
  'Sales / Revenue': 'Sales', // high
  'Other Income': 'Other Sales / Sponsorship / Merchandise', // medium

  // Cost of sales
  'Cost of Goods Sold': 'Cost of Sales', // high
  Subcontractors: 'Subcontractor Costs', // high

  // Overheads
  'Wages & Salaries': 'Salaries', // high
  'Rent & Rates': 'Rent, Rates, and Water', // high — bundles Water, minor
  // overlap with Utilities below.
  Utilities: 'Light, Heat, and Power', // high
  Insurance: 'Insurance', // high
  'Travel & Motoring': 'Motor Expenses', // high — FreeAgent also has a
  // separate "Travel, Accommodation, and Subsistence" category, same
  // single-code simplification xero-accounts.js documents for this row.
  Telecommunications: 'Telephone, Internet, and IT', // high
  'Office & Admin Supplies': 'Printing, Postage, and Stationery', // medium-high
  'Marketing & Advertising': 'Advertising and Promotion', // high
  'Meals & Entertainment': 'Client Entertaining', // medium — FreeAgent treats
  // this as a disallowable-for-tax expense category, not a plain overhead,
  // and it doesn't cover staff meals (those fall under Travel/Subsistence).
  'Loan Interest': 'Bank Charges and Interest Paid', // medium — bundled with
  // the row below; FreeAgent doesn't split interest from bank charges.
  'Bank Charges & Fees': 'Bank Charges and Interest Paid', // medium — same bundle
  'Professional Fees': 'Legal and Professional Fees', // high
  'Subscriptions & Software': 'General Administrative Expenses', // low — no
  // dedicated FreeAgent category found for this; falls back to the catch-all.
  'Repairs & Maintenance': 'Repairs and Maintenance', // high
  'Other Expenses': 'General Administrative Expenses', // medium — same catch-all

  // Exclude bucket — always requires explicit user judgement, see comment above.
  Transfer: null, // FreeAgent models this as a transaction type, not a category
  Drawings: null,
  VAT: null,
  'Tax & PAYE': null,
  'Loan Principal': null,
  'Capital Expenditure': null,
  Uncategorised: null,
};

module.exports = { FREEAGENT_ACCOUNT_NAMES };
