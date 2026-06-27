// Chart-of-accounts for a UK sole trader / small company. Each entry maps to
// one line on a P&L and carries its HMRC Self Assessment box as secondary
// metadata for tax-readiness.
//
// pnl_section values:
//   income        — appears in the Revenue block of the P&L (credit side)
//   cost_of_sales — direct costs deducted before Gross Profit
//   overheads     — operating expenses deducted after Gross Profit
//   exclude       — NEVER appears on the P&L: inter-account transfers,
//                   drawings, VAT, tax, loan principal, capital purchases.
//                   Getting this right is the single biggest way a naive
//                   classifier silently corrupts a P&L.
//
// Kept in its own module (no imports) so both csv-adapt.js and tools.js can
// require it without creating a circular dependency.

const ACCOUNTS = [
  // ── Income ────────────────────────────────────────────────────────────────
  { code: '4000', name: 'Sales / Revenue',         pnl_section: 'income',        sa_box: 'SA103F Box 15' },
  { code: '4100', name: 'Other Income',             pnl_section: 'income',        sa_box: 'SA103F Box 16' },

  // ── Cost of Sales ─────────────────────────────────────────────────────────
  { code: '5000', name: 'Cost of Goods Sold',       pnl_section: 'cost_of_sales', sa_box: 'SA103F Box 17' },
  { code: '5100', name: 'Subcontractors',            pnl_section: 'cost_of_sales', sa_box: 'SA103F Box 17' },

  // ── Overheads ─────────────────────────────────────────────────────────────
  { code: '6000', name: 'Wages & Salaries',         pnl_section: 'overheads',     sa_box: 'SA103F Box 20' },
  { code: '6100', name: 'Rent & Rates',             pnl_section: 'overheads',     sa_box: 'SA103F Box 21' },
  { code: '6110', name: 'Utilities',                pnl_section: 'overheads',     sa_box: 'SA103F Box 21' },
  { code: '6120', name: 'Insurance',                pnl_section: 'overheads',     sa_box: 'SA103F Box 21' },
  { code: '6200', name: 'Travel & Motoring',        pnl_section: 'overheads',     sa_box: 'SA103F Box 23' },
  { code: '6300', name: 'Telecommunications',       pnl_section: 'overheads',     sa_box: 'SA103F Box 23' },
  { code: '6310', name: 'Office & Admin Supplies',  pnl_section: 'overheads',     sa_box: 'SA103F Box 23' },
  { code: '6400', name: 'Marketing & Advertising',  pnl_section: 'overheads',     sa_box: 'SA103F Box 24' },
  { code: '6410', name: 'Meals & Entertainment',    pnl_section: 'overheads',     sa_box: 'SA103F Box 24' },
  { code: '6500', name: 'Loan Interest',            pnl_section: 'overheads',     sa_box: 'SA103F Box 25' },
  { code: '6510', name: 'Bank Charges & Fees',      pnl_section: 'overheads',     sa_box: 'SA103F Box 26' },
  { code: '6600', name: 'Professional Fees',        pnl_section: 'overheads',     sa_box: 'SA103F Box 28' },
  { code: '6700', name: 'Subscriptions & Software', pnl_section: 'overheads',     sa_box: 'SA103F Box 30' },
  { code: '6800', name: 'Repairs & Maintenance',    pnl_section: 'overheads',     sa_box: 'SA103F Box 22' },
  { code: '6900', name: 'Other Expenses',           pnl_section: 'overheads',     sa_box: 'SA103F Box 30' },

  // ── Exclude — NEVER appear on the P&L ─────────────────────────────────────
  { code: '9000', name: 'Transfer',                 pnl_section: 'exclude',       sa_box: null },
  { code: '9010', name: 'Drawings',                 pnl_section: 'exclude',       sa_box: null },
  { code: '9020', name: 'VAT',                      pnl_section: 'exclude',       sa_box: null },
  { code: '9030', name: 'Tax & PAYE',               pnl_section: 'exclude',       sa_box: null },
  { code: '9040', name: 'Loan Principal',           pnl_section: 'exclude',       sa_box: null },
  { code: '9050', name: 'Capital Expenditure',      pnl_section: 'exclude',       sa_box: null },
  { code: '9900', name: 'Uncategorised',            pnl_section: 'exclude',       sa_box: null },
];

module.exports = { ACCOUNTS };
