// Realistic fixture for the classify-merchant smoke-test.
// Each entry is a bank-statement string as it actually appears (truncated,
// reference-numbered, ambiguous) alongside the known-correct COA category.
//
// Cases are chosen to probe the hardest classification decisions:
//   - exclude vs overhead (pension, CIS, Monzo Flex)
//   - must-be-Uncategorised (person-to-person, bare Amazon)
//   - easy-to-misread merchants (Tesco fuel, HP ink, Apple billing)

module.exports = [
  // ── Exclude — balance-sheet movements that must never reach the P&L ───────
  {
    merchant: 'HMRC CIS DEDUCTIONS 7219304851',
    expect: 'Tax & PAYE',
    note: 'Construction Industry Scheme deduction — tax payment, not an overhead',
  },
  {
    merchant: 'LLOYDS BUSINESS LOAN 4567',
    expect: 'Loan Principal',
    note: 'capital repayment on a term loan — not an expense',
  },
  {
    merchant: 'MONZO FLEX 0001234',
    expect: 'Loan Principal',
    note: 'Monzo Flex is a revolving credit line; repayments are principal, not expense',
  },
  {
    merchant: 'STARLING SAVINGS SPACE XFER',
    expect: 'Transfer',
    note: 'movement to a ring-fenced savings pot within the same business account',
  },
  {
    merchant: 'DIVIDENDS TO SHAREHOLDERS',
    expect: 'Drawings',
    note: 'dividend = drawings for a small-company owner; never an expense',
  },
  {
    merchant: 'DELL UK LATITUDE 7450 LAPTOP',
    expect: 'Capital Expenditure',
    note: 'capital asset with multi-year life — depreciates, does not expense directly',
  },

  // ── Tricky exclude — most likely to be mis-routed to a P&L section ────────
  {
    merchant: 'NEST PENSION 04/2026',
    expect: 'Wages & Salaries',
    note: 'EMPLOYER pension contribution IS an allowable overhead (SA103F Box 20) — NOT exclude',
  },
  {
    merchant: 'PAYPAL *JAMES WILSON',
    expect: 'Uncategorised',
    note: 'person-to-person PayPal — could be contractor, supplier, drawings, or personal; cannot determine without context',
  },
  {
    merchant: 'AMAZON.CO.UK MKTPL 00123',
    expect: 'Uncategorised',
    note: 'bare Amazon Marketplace — could be office supplies, stock for resale, or personal; indeterminate',
  },

  // ── Revenue ──────────────────────────────────────────────────────────────
  {
    merchant: 'BACS PAYMENT ACME CORP REF INV042',
    expect: 'Sales / Revenue',
    note: 'named-company BACS = client invoice payment',
  },
  {
    merchant: 'TIDE BANK INTEREST EARNED',
    expect: 'Other Income',
    note: 'interest received on the business account — not trading income',
  },

  // ── Overheads ─────────────────────────────────────────────────────────────
  {
    merchant: 'NOTION.SO SUBSCRIPTION',
    expect: 'Subscriptions & Software',
    note: 'SaaS productivity tool',
  },
  {
    merchant: 'COMPANIESHOUSE.GOV.UK',
    expect: 'Professional Fees',
    note: 'Companies House annual confirmation statement / filing fee',
  },
  {
    merchant: 'DIGITAL OCEAN B.V.',
    expect: 'Subscriptions & Software',
    note: 'cloud hosting provider',
  },
  {
    merchant: 'TESCO FUEL 0982 LONDON',
    expect: 'Travel & Motoring',
    note: 'Tesco petrol station — fuel for business vehicle, NOT groceries',
  },
  {
    merchant: 'ROYAL MAIL ONLINE POSTAGE',
    expect: 'Office & Admin Supplies',
    note: 'postage = office admin consumable',
  },
  {
    merchant: 'AIRBNB * MANCHESTER',
    expect: 'Travel & Motoring',
    note: 'business accommodation while travelling',
  },
  {
    merchant: 'APPLE.COM/BILL 0800 107 6285',
    expect: 'Subscriptions & Software',
    note: 'Apple subscription billing (iCloud / Apple One) — monthly charge, not a capital purchase',
  },
  {
    merchant: 'QS INSURANCE PLC DIRECT DEBIT',
    expect: 'Insurance',
    note: 'business insurance premium',
  },
  {
    merchant: 'HP INSTANT INK SUBSCRIPTION',
    expect: 'Office & Admin Supplies',
    note: 'printer ink subscription is an office consumable — NOT a software subscription',
  },
];
