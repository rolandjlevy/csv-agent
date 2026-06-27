// Classifier smoke-test: sends realistic UK business transaction descriptions
// through classifyMerchants() and checks that the critical exclusion rules
// fire correctly. Requires ANTHROPIC_API_KEY in .env.
//
// Usage:  node stress-test/test-classify.js

require('dotenv').config();
const { classifyMerchants, ACCOUNTS } = require('../lib/csv-adapt');

// Each entry: the merchant string the classifier will see, and the expected
// account name. Grouped by the rule being exercised.
const CASES = [
  // ── Exclusion rules — these MUST never land on the P&L ──────────────────
  { merchant: 'HMRC VAT RETURN 1234567890',       expect: 'VAT',                  rule: 'VAT payment' },
  { merchant: 'HMRC VAT REPAYMENT',               expect: 'VAT',                  rule: 'VAT refund' },
  { merchant: 'HMRC SELF ASSESSMENT',             expect: 'Tax & PAYE',            rule: 'SA tax payment' },
  { merchant: 'HMRC PAYE 1234ABC5678DE',          expect: 'Tax & PAYE',            rule: 'PAYE payment' },
  { merchant: 'TRANSFER TO SAVINGS 12345678',     expect: 'Transfer',              rule: 'own-account transfer' },
  { merchant: 'BANK TRANSFER J SMITH',            expect: 'Transfer',              rule: 'person-to-person (ambiguous — may be drawings)' },
  { merchant: 'DRAWINGS - R LEVY',                expect: 'Drawings',              rule: 'owner drawings' },
  { merchant: 'DIRECTOR SALARY ROLAND LEVY',      expect: 'Drawings',              rule: 'director salary = drawings' },
  { merchant: 'LOAN REPAYMENT BARCLAYS 12345',    expect: 'Loan Principal',        rule: 'loan principal repayment' },
  { merchant: 'BARCLAYS LOAN INTEREST',           expect: 'Loan Interest',         rule: 'loan interest (IS a P&L expense)' },
  { merchant: 'APPLE MACBOOK PRO 16 INCH',        expect: 'Capital Expenditure',   rule: 'capital equipment' },
  { merchant: 'CANON IMAGERUNNER COPIER',         expect: 'Capital Expenditure',   rule: 'office equipment' },

  // ── Income ──────────────────────────────────────────────────────────────
  { merchant: 'ACME LTD INV 2024-0042',           expect: 'Sales / Revenue',       rule: 'client invoice' },
  { merchant: 'STRIPE PAYOUT',                    expect: 'Sales / Revenue',       rule: 'payment processor payout' },
  { merchant: 'INNOVATE UK GRANT',                expect: 'Other Income',          rule: 'government grant' },

  // ── Cost of Sales ────────────────────────────────────────────────────────
  { merchant: 'ALIBABA.COM ORDER #123',           expect: 'Cost of Goods Sold',    rule: 'stock purchase' },
  { merchant: 'FREELANCER.COM MILESTONE',         expect: 'Subcontractors',        rule: 'freelancer payment' },
  { merchant: 'UPWORK PAYMENT - DEV WORK',        expect: 'Subcontractors',        rule: 'contractor' },

  // ── Overheads ────────────────────────────────────────────────────────────
  { merchant: 'PAYROLL RUN MAY 2026',             expect: 'Wages & Salaries',      rule: 'employee payroll' },
  { merchant: 'OFFICE RENT Q2 2026',              expect: 'Rent & Rates',          rule: 'office rent' },
  { merchant: 'BRITISH GAS BUSINESS',             expect: 'Utilities',             rule: 'gas bill' },
  { merchant: 'SIMPLY BUSINESS INSURANCE',        expect: 'Insurance',             rule: 'business insurance' },
  { merchant: 'TRAINLINE',                        expect: 'Travel & Motoring',     rule: 'rail travel' },
  { merchant: 'UBER 0000123456',                  expect: 'Travel & Motoring',     rule: 'taxi' },
  { merchant: 'EE BUSINESS MOBILE',               expect: 'Telecommunications',    rule: 'mobile phone' },
  { merchant: 'AMAZON OFFICE SUPPLIES',           expect: 'Office & Admin Supplies', rule: 'office supplies' },
  { merchant: 'GOOGLE ADS LONDON',               expect: 'Marketing & Advertising', rule: 'digital ads' },
  { merchant: 'SLACK PRO MONTHLY',               expect: 'Subscriptions & Software', rule: 'SaaS subscription' },
  { merchant: 'ADOBE CREATIVE CLOUD',            expect: 'Subscriptions & Software', rule: 'software licence' },
  { merchant: 'GITHUB.COM',                      expect: 'Subscriptions & Software', rule: 'dev tool subscription' },
  { merchant: 'PRET A MANGER 00456 LONDON',      expect: 'Meals & Entertainment',  rule: 'client meal' },
  { merchant: 'KPMG LLP INVOICE',                expect: 'Professional Fees',     rule: 'accountant' },
  { merchant: 'STRIPE FEES MAY 2026',            expect: 'Bank Charges & Fees',   rule: 'payment processor fees' },
  { merchant: 'BARCLAYS MONTHLY FEE',            expect: 'Bank Charges & Fees',   rule: 'bank account fee' },
];

async function main() {
  const merchants = CASES.map((c) => c.merchant);
  console.log(`\nSending ${merchants.length} merchants to classifyMerchants()...\n`);

  let results;
  try {
    results = await classifyMerchants(merchants);
  } catch (err) {
    console.error('classifyMerchants() threw:', err.message);
    process.exit(1);
  }

  const excludeNames = new Set(
    ACCOUNTS.filter((a) => a.pnl_section === 'exclude').map((a) => a.name)
  );

  let passed = 0;
  let failed = 0;

  // Column widths for readable output
  const W_MERCHANT = 42;
  const W_CAT = 30;

  console.log(
    'Merchant'.padEnd(W_MERCHANT) +
    'Got'.padEnd(W_CAT) +
    'Expected'.padEnd(W_CAT) +
    'Result'
  );
  console.log('─'.repeat(W_MERCHANT + W_CAT + W_CAT + 6));

  for (const c of CASES) {
    const got = results[c.merchant] || '(missing)';
    const ok = got === c.expect;
    if (ok) passed++; else failed++;

    const indicator = ok ? '✓' : '✗';
    const line =
      c.merchant.slice(0, W_MERCHANT - 1).padEnd(W_MERCHANT) +
      got.slice(0, W_CAT - 1).padEnd(W_CAT) +
      c.expect.slice(0, W_CAT - 1).padEnd(W_CAT) +
      indicator;
    console.log(line);
    if (!ok) console.log(`    rule: ${c.rule}`);
  }

  console.log('\n' + '═'.repeat(W_MERCHANT + W_CAT + W_CAT + 6));

  // Special check: any exclude-category transaction mis-routed to a P&L section
  const plMisroutes = CASES.filter((c) => {
    const got = results[c.merchant];
    const shouldExclude = excludeNames.has(c.expect);
    const gotExclude = excludeNames.has(got);
    return shouldExclude && !gotExclude;
  });

  if (plMisroutes.length) {
    console.log(`\nCRITICAL — ${plMisroutes.length} exclusion(s) mis-routed to P&L:`);
    for (const c of plMisroutes) {
      console.log(`  • ${c.merchant} → ${results[c.merchant]} (should be ${c.expect})`);
    }
  }

  console.log(`\nRESULT: ${passed} correct, ${failed} wrong, out of ${CASES.length} cases`);
  if (plMisroutes.length) console.log('CRITICAL FAILURES (exclusion mis-routes): ' + plMisroutes.length);
  console.log('═'.repeat(W_MERCHANT + W_CAT + W_CAT + 6));

  process.exit(failed > 0 ? 1 : 0);
}

main();
