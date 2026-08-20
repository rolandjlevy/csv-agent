// Client-safe copy of lib/export/quickbooks-accounts.js's default category ->
// QuickBooks Online account name table, for the export panel's editable defaults.
// NOT imported directly from lib/export/quickbooks-accounts.js (a CommonJS module)
// for the same reason src/lib/categories.ts doesn't import lib/accounts.js: pulling
// a CommonJS value import into a "use client" component breaks Next's
// dev-mode React Server Components bundling. The actual export mapping is
// always performed server-side (src/app/api/export/route.ts, which DOES
// import the real lib/export modules safely) — this copy only pre-fills
// the UI; if it ever drifts, the server route's mapping still wins. Keep in
// sync with lib/export/quickbooks-accounts.js's QUICKBOOKS_ACCOUNT_NAMES.
export const DEFAULT_QUICKBOOKS_ACCOUNT_NAMES: Record<string, string | null> = {
  "Sales / Revenue": "Sales of Product Income",
  "Other Income": "Other Income",

  "Cost of Goods Sold": "Cost of Goods Sold",
  Subcontractors: "Cost of Goods Sold",

  "Wages & Salaries": "Wages and Salaries",
  "Rent & Rates": "Rent",
  Utilities: "Utilities",
  Insurance: "Insurance",
  "Travel & Motoring": "Travel",
  Telecommunications: "Telephone",
  "Office & Admin Supplies": "Office Supplies",
  "Marketing & Advertising": "Advertising",
  "Meals & Entertainment": "Meals and Entertainment",
  "Loan Interest": "Interest Paid",
  "Bank Charges & Fees": "Bank Charges",
  "Professional Fees": "Professional Fees",
  "Subscriptions & Software": "Subscriptions",
  "Repairs & Maintenance": "Repairs and Maintenance",
  "Other Expenses": "Other Business Expenses",

  // Deliberately unmapped — see lib/export/quickbooks-accounts.js for why.
  Transfer: null,
  Drawings: null,
  VAT: null,
  "Tax & PAYE": null,
  "Loan Principal": null,
  "Capital Expenditure": null,
  Uncategorised: null,
};