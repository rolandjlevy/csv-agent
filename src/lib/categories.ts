// Client-safe copy of the chart-of-accounts category names from
// lib/accounts.js, for the merchant review panel's reclassify dropdown.
// Deliberately NOT importing lib/accounts.js directly here: it's a plain
// CommonJS module, and pulling it as a value import into a "use client"
// component breaks Next's dev-mode React Server Components module-boundary
// bundling (works fine in `next build`, fails under `next dev`'s Fast
// Refresh/flight-client-module-loader pipeline). Keep this list in sync with
// the `name` fields in lib/accounts.js's ACCOUNTS array.
export const CATEGORY_NAMES = [
  "Sales / Revenue",
  "Other Income",
  "Cost of Goods Sold",
  "Subcontractors",
  "Wages & Salaries",
  "Rent & Rates",
  "Utilities",
  "Insurance",
  "Travel & Motoring",
  "Telecommunications",
  "Office & Admin Supplies",
  "Marketing & Advertising",
  "Meals & Entertainment",
  "Loan Interest",
  "Bank Charges & Fees",
  "Professional Fees",
  "Subscriptions & Software",
  "Repairs & Maintenance",
  "Other Expenses",
  "Transfer",
  "Drawings",
  "VAT",
  "Tax & PAYE",
  "Loan Principal",
  "Capital Expenditure",
  "Uncategorised",
] as const;
