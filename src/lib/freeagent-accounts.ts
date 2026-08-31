// Client-safe copy of lib/export/freeagent-accounts.js's default category
// -> FreeAgent category-name reference table, for the export panel's
// read-only reference list. NOT imported directly from
// lib/export/freeagent-accounts.js (a CommonJS module) — same RSC-bundling
// reason as src/lib/xero-accounts.ts. This table is purely informational in
// the UI (FreeAgent's bank-statement CSV import has no account field to
// actually populate) — keep in sync with
// lib/export/freeagent-accounts.js's FREEAGENT_ACCOUNT_NAMES.
export const DEFAULT_FREEAGENT_ACCOUNT_NAMES: Record<string, string | null> = {
  "Sales / Revenue": "Sales",
  "Other Income": "Other Sales / Sponsorship / Merchandise",

  "Cost of Goods Sold": "Cost of Sales",
  Subcontractors: "Subcontractor Costs",

  "Wages & Salaries": "Salaries",
  "Rent & Rates": "Rent, Rates, and Water",
  Utilities: "Light, Heat, and Power",
  Insurance: "Insurance",
  "Travel & Motoring": "Motor Expenses",
  Telecommunications: "Telephone, Internet, and IT",
  "Office & Admin Supplies": "Printing, Postage, and Stationery",
  "Marketing & Advertising": "Advertising and Promotion",
  "Meals & Entertainment": "Client Entertaining",
  "Loan Interest": "Bank Charges and Interest Paid",
  "Bank Charges & Fees": "Bank Charges and Interest Paid",
  "Professional Fees": "Legal and Professional Fees",
  "Subscriptions & Software": "General Administrative Expenses",
  "Repairs & Maintenance": "Repairs and Maintenance",
  "Other Expenses": "General Administrative Expenses",

  // Deliberately unmapped — see lib/export/freeagent-accounts.js for why.
  Transfer: null,
  Drawings: null,
  VAT: null,
  "Tax & PAYE": null,
  "Loan Principal": null,
  "Capital Expenditure": null,
  Uncategorised: null,
};
