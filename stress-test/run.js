// Adapter stress test — exercises the DETERMINISTIC transformer (applyProfile)
// in lib/csv-adapt.js against realistic messy UK bank exports. This is the part
// of the moat that can silently corrupt a P&L (flipped sign, dropped row, bad
// date), so it is asserted rather than eyeballed. The LLM detection layer
// (detectProfile/classifyMerchants) is validated separately with an API key —
// here we feed each fixture the profile a CORRECT detector should have returned,
// isolating transform bugs from detection bugs.
//
// Usage:  node stress-test/run.js
// Add your own real exports: drop the CSV in fixtures/, add a CASES entry with
// the correct profile + expected rows, re-run.

const fs = require('fs');
const path = require('path');
const { applyProfile } = require('../lib/csv-adapt');

const FIX = path.join(__dirname, 'fixtures');
const read = (f) => fs.readFileSync(path.join(FIX, f), 'utf8');

// Each case: the profile a correct detectProfile SHOULD emit, plus the canonical
// rows we expect out. amount is the signed GBP figure; date is dd/mm/yyyy.
const CASES = [
  {
    name: 'Lloyds — split Debit/Credit columns',
    file: 'lloyds_split.csv',
    bank: 'Lloyds',
    profile: {
      headerRowIndex: 0, dateColumn: 'Transaction Date', dateFormat: 'DD/MM/YYYY',
      descriptionColumn: 'Transaction Description', amountConvention: 'split',
      moneyInColumn: 'Credit Amount', moneyOutColumn: 'Debit Amount',
    },
    expect: [
      { date: '01/05/2026', amount: 3200.00 },
      { date: '02/05/2026', amount: -54.32 },
      { date: '03/05/2026', amount: -89.50 },
      { date: '04/05/2026', amount: -500.00 },
    ],
  },
  {
    name: 'Nationwide — 3 preamble rows + £ symbols + split columns',
    file: 'nationwide_preamble.csv',
    bank: 'Nationwide',
    profile: {
      headerRowIndex: 3, dateColumn: 'Date', dateFormat: 'DD/MM/YYYY',
      descriptionColumn: 'Description', amountConvention: 'split',
      moneyInColumn: 'Paid in', moneyOutColumn: 'Paid out',
    },
    expect: [
      { date: '01/05/2026', amount: 3200.00 },
      { date: '02/05/2026', amount: -54.32 },
      { date: '03/05/2026', amount: -89.50 },
    ],
  },
  {
    name: 'Barclays — preamble row + parenthesised negatives',
    file: 'barclays_parens.csv',
    bank: 'Barclays',
    profile: {
      headerRowIndex: 1, dateColumn: 'Date', dateFormat: 'DD/MM/YYYY',
      descriptionColumn: 'Memo', amountConvention: 'signed', amountColumn: 'Amount',
    },
    expect: [
      { date: '01/05/2026', amount: 3200.00 },
      { date: '02/05/2026', amount: -54.32 },
      { date: '03/05/2026', amount: -89.50 },
    ],
  },
  {
    name: 'Revolut — multi date column (Started/Completed) + separate Fee',
    file: 'revolut_multidate.csv',
    bank: 'Revolut',
    profile: {
      headerRowIndex: 0, dateColumn: 'Started Date', dateFormat: 'YYYY-MM-DD',
      descriptionColumn: 'Description', amountConvention: 'signed', amountColumn: 'Amount',
    },
    expect: [
      { date: '01/05/2026', amount: 3200.00 },
      { date: '02/05/2026', amount: -54.32 },
      { date: '03/05/2026', amount: -8.40 }, // NB: 0.20 Fee NOT included — see findings
    ],
  },
  {
    name: 'HSBC — NO header row (personal current-account export)',
    file: 'hsbc_noheader.csv',
    bank: 'HSBC',
    // Headerless: columns addressed by 0-based index, hasHeaderRow false.
    profile: {
      headerRowIndex: 0, hasHeaderRow: false,
      dateColumn: '0', dateFormat: 'DD/MM/YYYY',
      descriptionColumn: '1', amountConvention: 'signed', amountColumn: '2',
    },
    expect: [
      { date: '01/05/2026', amount: 3200.00 },
      { date: '02/05/2026', amount: -54.32 },
      { date: '03/05/2026', amount: -89.50 },
    ],
  },
  {
    name: 'Monzo — Windows-1252 £ mojibake (Å£) + thousands separators',
    file: 'monzo_mojibake.csv',
    bank: 'Monzo',
    profile: {
      headerRowIndex: 0, dateColumn: 'Date', dateFormat: 'DD/MM/YYYY',
      descriptionColumn: 'Description', amountConvention: 'signed', amountColumn: 'Amount',
    },
    expect: [
      { date: '01/05/2026', amount: 3200.00 },
      { date: '02/05/2026', amount: -54.32 },
      { date: '03/05/2026', amount: -1234.56 },
    ],
  },
];

const money = (n) => (n < 0 ? '-' : '') + '£' + Math.abs(n).toFixed(2);
const near = (a, b) => Math.abs(a - b) < 0.005;

let passed = 0;
let failed = 0;
const findings = [];

for (const c of CASES) {
  console.log('\n' + '─'.repeat(72));
  console.log(c.name);
  console.log('─'.repeat(72));

  let rows;
  try {
    rows = applyProfile(read(c.file), c.profile, c.bank);
  } catch (err) {
    rows = null;
    console.log('  THREW:', err.message);
  }

  const problems = [];

  if (!rows) {
    problems.push('transformer threw');
  } else {
    if (rows.length !== c.expect.length) {
      problems.push(`row count: expected ${c.expect.length}, got ${rows.length}`);
    }
    c.expect.forEach((exp, i) => {
      const got = rows[i];
      if (!got) { problems.push(`row ${i}: missing`); return; }
      const gotAmt = Number(got.Amount);
      if (!near(gotAmt, exp.amount)) {
        problems.push(`row ${i} amount: expected ${money(exp.amount)}, got ${money(gotAmt)}`);
      }
      if (got.Date !== exp.date) {
        problems.push(`row ${i} date: expected ${exp.date}, got ${got.Date || '(empty)'}`);
      }
    });

    // Show what actually came out, for eyeballing.
    console.log('  output rows:');
    if (rows.length === 0) console.log('    (none)');
    rows.forEach((r) =>
      console.log(`    ${r.Date || '??/??/????'}  ${money(Number(r.Amount)).padStart(12)}  ${r.Description}`)
    );
  }

  const ok = problems.length === 0;
  if (c.expectFail) {
    // We expect this one to be broken — a "pass" here means it failed as predicted.
    if (ok) {
      console.log('  ⚠️  UNEXPECTED PASS — gap may already be fixed, review case.');
      passed++;
    } else {
      console.log('  ✗ FAILS (as predicted — KNOWN GAP):');
      problems.forEach((p) => console.log('      • ' + p));
      findings.push(`${c.bank}: ${problems.join('; ')}`);
      passed++; // predicted failure = harness pass
    }
  } else if (ok) {
    console.log('  ✓ PASS');
    passed++;
  } else {
    console.log('  ✗ FAIL:');
    problems.forEach((p) => console.log('      • ' + p));
    findings.push(`${c.bank}: ${problems.join('; ')}`);
    failed++;
  }
}

console.log('\n' + '═'.repeat(72));
console.log(`RESULT: ${passed} ok, ${failed} unexpected failures, out of ${CASES.length} cases`);
if (findings.length) {
  console.log('\nFindings to action:');
  findings.forEach((f) => console.log('  • ' + f));
}
console.log('═'.repeat(72));

process.exit(failed > 0 ? 1 : 0);
