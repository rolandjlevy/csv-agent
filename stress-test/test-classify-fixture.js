// Classifier fixture test — runs classify-cases.js against the live
// classifyMerchants() LLM call and reports every wrong answer with its
// explanation, so we know exactly what the prompt still needs to handle.
//
// Usage:  node stress-test/test-classify-fixture.js

require('dotenv').config();
const { classifyMerchants, ACCOUNTS } = require('../lib/csv-adapt');
const CASES = require('./fixtures/classify-cases');

const EXCLUDE_NAMES = new Set(
  ACCOUNTS.filter((a) => a.pnl_section === 'exclude').map((a) => a.name)
);

async function main() {
  const merchants = CASES.map((c) => c.merchant);
  console.log(`\nFixture: ${merchants.length} merchants → classifyMerchants()\n`);

  let results;
  try {
    results = await classifyMerchants(merchants);
  } catch (err) {
    console.error('classifyMerchants() threw:', err.message);
    process.exit(1);
  }

  const W = { m: 44, c: 28 };

  console.log(
    'Merchant'.padEnd(W.m) +
    'Got'.padEnd(W.c) +
    'Expected'.padEnd(W.c) +
    ''
  );
  console.log('─'.repeat(W.m + W.c + W.c + 2));

  let passed = 0;
  const failures = [];
  const plMisroutes = [];   // exclude should-be → landed on P&L (most critical)

  for (const c of CASES) {
    const got = results[c.merchant] ?? '(missing)';
    const ok = got === c.expect;
    if (ok) { passed++; } else { failures.push({ ...c, got }); }

    // Critical: an exclude-expected transaction that landed on the P&L
    if (!ok && EXCLUDE_NAMES.has(c.expect) && !EXCLUDE_NAMES.has(got)) {
      plMisroutes.push({ ...c, got });
    }

    const flag = ok ? '✓' : '✗';
    console.log(
      c.merchant.slice(0, W.m - 1).padEnd(W.m) +
      got.slice(0, W.c - 1).padEnd(W.c) +
      c.expect.slice(0, W.c - 1).padEnd(W.c) +
      flag
    );
  }

  console.log('\n' + '═'.repeat(W.m + W.c + W.c + 2));
  console.log(`RESULT: ${passed}/${CASES.length} correct\n`);

  if (failures.length === 0) {
    console.log('All correct — no failures to report.');
  } else {
    console.log(`FAILURES (${failures.length}):`);
    for (const f of failures) {
      const severity = plMisroutes.includes(f) ? ' *** CRITICAL — mis-routed to P&L ***' : '';
      console.log(`\n  Merchant : ${f.merchant}`);
      console.log(`  Got      : ${f.got}${severity}`);
      console.log(`  Expected : ${f.expect}`);
      console.log(`  Why      : ${f.note}`);
    }
  }

  if (plMisroutes.length) {
    console.log(`\n*** ${plMisroutes.length} CRITICAL mis-route(s): exclude-coded transactions landed on the P&L ***`);
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

main();
