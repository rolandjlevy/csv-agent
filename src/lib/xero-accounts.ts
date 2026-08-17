// Client-safe copy of lib/export/xero-accounts.js's default category ->
// Xero code table, for the export panel's editable defaults. NOT imported
// directly from lib/export/xero-accounts.js (a CommonJS module) for the
// same reason src/lib/categories.ts doesn't import lib/accounts.js: pulling
// a CommonJS value import into a "use client" component breaks Next's
// dev-mode React Server Components bundling. The actual export mapping is
// always performed server-side (src/app/api/export/route.ts, which DOES
// import the real lib/export modules safely) — this copy only pre-fills
// the UI; if it ever drifts, the server route's mapping still wins. Keep in
// sync with lib/export/xero-accounts.js's XERO_ACCOUNT_CODES.
export const DEFAULT_XERO_ACCOUNT_CODES: Record<string, string | null> = {
  "Sales / Revenue": "200",
  "Other Income": "260",

  "Cost of Goods Sold": "310",
  Subcontractors: "321",

  "Wages & Salaries": "477",
  "Rent & Rates": "469",
  Utilities: "445",
  Insurance: "433",
  "Travel & Motoring": "449",
  Telecommunications: "489",
  "Office & Admin Supplies": "461",
  "Marketing & Advertising": "400",
  "Meals & Entertainment": "420",
  "Loan Interest": "437",
  "Bank Charges & Fees": "404",
  "Professional Fees": "401",
  "Subscriptions & Software": "485",
  "Repairs & Maintenance": "473",
  "Other Expenses": "429",

  // Deliberately unmapped — see lib/export/xero-accounts.js for why.
  Transfer: null,
  Drawings: null,
  VAT: null,
  "Tax & PAYE": null,
  "Loan Principal": null,
  "Capital Expenditure": null,
  Uncategorised: null,
};
