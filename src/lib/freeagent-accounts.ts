// Client-safe copy of lib/export/freeagent-accounts.js's default category ->
// FreeAgent nominal-code table, for the export panel's editable defaults.
// NOT imported directly from lib/export/freeagent-accounts.js (a CommonJS module)
// for the same reason src/lib/categories.ts doesn't import lib/accounts.js: pulling
// a CommonJS value import into a "use client" component breaks Next's
// dev-mode React Server Components bundling. The actual export mapping is
// always performed server-side (src/app/api/export/route.ts, which DOES
// import the real lib/export modules safely) — this copy only pre-fills
// the UI; if it ever drifts, the server route's mapping still wins. Keep in
// sync with lib/export/freeagent-accounts.js's FREEAGENT_NOMINAL_CODES.
export const DEFAULT_FREEAGENT_NOMINAL_CODES: Record<string, string | null> = {
  "Sales / Revenue": "001",
  "Other Income": "003",

  "Cost of Goods Sold": "010",
  Subcontractors: "010",

  "Wages & Salaries": "210",
  "Rent & Rates": "211",
  Utilities: "212",
  Insurance: "213",
  "Travel & Motoring": "225",
  Telecommunications: "214",
  "Office & Admin Supplies": "215",
  "Marketing & Advertising": "216",
  "Meals & Entertainment": "217",
  "Loan Interest": "218",
  "Bank Charges & Fees": "219",
  "Professional Fees": "220",
  "Subscriptions & Software": "221",
  "Repairs & Maintenance": "222",
  "Other Expenses": "223",

  // Deliberately unmapped — see lib/export/freeagent-accounts.js for why.
  Transfer: null,
  Drawings: null,
  VAT: null,
  "Tax & PAYE": null,
  "Loan Principal": null,
  "Capital Expenditure": null,
  Uncategorised: null,
};