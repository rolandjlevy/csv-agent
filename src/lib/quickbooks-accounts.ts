// Client-safe copy of lib/export/quickbooks-accounts.js's default category
// -> QuickBooks Online category-name reference table, for the export
// panel's read-only reference list. NOT imported directly from
// lib/export/quickbooks-accounts.js (a CommonJS module) for the same
// reason src/lib/xero-accounts.ts doesn't import lib/export/xero-accounts.js:
// pulling a CommonJS value import into a "use client" component breaks
// Next's dev-mode React Server Components bundling. This table is purely
// informational in the UI (QBO's native CSV import has no account field to
// actually populate) — keep in sync with
// lib/export/quickbooks-accounts.js's QUICKBOOKS_ACCOUNT_NAMES.
//
// NOTE (2026-09-07): see lib/export/quickbooks-accounts.js's header — this
// table's sourcing predates Intuit's 2024 QuickBooks Self-Employed ->
// Sole Trader/Simple Start transition and is due a refresh, not verified
// against the current product.
export const DEFAULT_QUICKBOOKS_ACCOUNT_NAMES: Record<string, string | null> = {
  "Sales / Revenue": "Sales",
  "Other Income": "Other income",

  "Cost of Goods Sold": "Cost of Goods Sold",
  Subcontractors: "Contract labor",

  "Wages & Salaries": "Payroll expenses",
  "Rent & Rates": "Rent & lease",
  Utilities: "Utilities",
  Insurance: "Insurance",
  "Travel & Motoring": "Car & truck",
  Telecommunications: "Telephone",
  "Office & Admin Supplies": "Office supplies & software",
  "Marketing & Advertising": "Advertising & marketing",
  "Meals & Entertainment": "Meals & entertainment",
  "Loan Interest": "Interest paid",
  "Bank Charges & Fees": "Bank charges & fees",
  "Professional Fees": "Legal & professional services",
  "Subscriptions & Software": "Dues & subscriptions",
  "Repairs & Maintenance": "Repairs & maintenance",
  "Other Expenses": "Other business expenses",

  // Deliberately unmapped — see lib/export/quickbooks-accounts.js for why.
  Transfer: null,
  Drawings: null,
  VAT: null,
  "Tax & PAYE": null,
  "Loan Principal": null,
  "Capital Expenditure": null,
  Uncategorised: null,
};
