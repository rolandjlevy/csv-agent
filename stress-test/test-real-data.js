// Real-data pipeline test — runs ACTUAL bank exports through the FULL
// pipeline (detectProfile → applyProfile → classifyMerchants → generate_pl)
// and reports what happened, end to end. This is the test the synthetic
// fixtures in stress-test/fixtures/ cannot do: real exports will have quirks
// nobody anticipated (a date format, a merchant string, a column layout that
// wasn't in any fixture). This is where those get found.
//
// SETUP — do this once:
//   1. Drop 5-10 of your own real bank CSV exports into stress-test/real-data/
//      (this folder is gitignored — see note below — they will NEVER be
//      committed, but double-check `git status` shows nothing if you're
//      ever unsure).
//   2. Make sure ANTHROPIC_API_KEY is set (.env or Codespace secret) — this
//      script makes real LLM calls (detectProfile + classifyMerchants), so
//      it costs a small amount of API spend per file, same as a real user run.
//
// USAGE:
//   node stress-test/test-real-data.js
//
// There is no "expected" answer file here, unlike the other stress tests —
// nobody has hand-labelled your real statements. So this script can't tell
// you "pass" or "fail" outright. What it CAN do is surface everything worth
// a human glance: rows silently dropped, dates that failed to parse, the
// uncategorised rate, the excluded-bucket size, and a sanity flag for any
// amount that looks like the thousands-separator truncation bug class found
// earlier (small absolute value from a raw string with many digits) — cheap
// insurance against that exact failure recurring on a bank shape not in the
// fixtures.
//
// PRIVACY NOTE: this prints real transaction descriptions and amounts from
// your real export, because that's what's needed to judge whether the
// classification is right. If you share this output with anyone (including
// pasting it into a chat), that's real financial data leaving your machine —
// your call, but worth being deliberate about it. Summarising counts and any
// flagged rows, rather than the full per-row table, is a reasonable middle
// ground.

const fs = require('fs');
const os = require('os');
const path = require('path');
require('dotenv').config();

const { adaptCsv } = require('../lib/csv-adapt');
const { generatePl } = require('../tools');

const DATA_DIR = path.join(__dirname, 'real-data');

function listInputFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map((f) => path.join(DATA_DIR, f));
}

// Heuristic re-check for the exact bug class found and fixed earlier: an
// amount with a small absolute value but whose raw description/context
// suggests a larger figure was truncated. We don't have the raw cell here
// (canonical CSV only keeps the parsed number), so this flags any amount
// that is suspiciously round-and-tiny (< £1, but not exactly £0) — cheap,
// imperfect, but free insurance against a recurrence on an unseen bank shape.
function looksSuspiciouslySmall(amount) {
  return Math.abs(amount) > 0 && Math.abs(amount) < 1;
}

function parseCanonical(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    // Simple split is fine here: toCanonicalCsv only quotes fields containing
    // commas/quotes/newlines, which real descriptions occasionally do — fall
    // back to a tiny quoted-aware split rather than pulling in a parser.
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur); cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}

async function runFile(filePath) {
  const name = path.basename(filePath);
  const rawText = fs.readFileSync(filePath, 'utf8');
  const rawLineCount = rawText.split(/\r?\n/).filter((l) => l.trim()).length;

  console.log('\n' + '═'.repeat(78));
  console.log(name);
  console.log('═'.repeat(78));

  let result;
  try {
    result = await adaptCsv(rawText, {
      apiKey: process.env.ANTHROPIC_API_KEY,
      onEvent: (e) => console.log(`  · ${e.message}`),
    });
  } catch (err) {
    console.log(`  ✗ adaptCsv THREW: ${err.message}`);
    return { name, error: err.message };
  }

  const rows = parseCanonical(result.csv);
  console.log(`\n  raw lines (incl. header/preamble): ${rawLineCount}`);
  console.log(`  canonical rows out: ${rows.length}`);
  if (!result.skipped) {
    console.log(`  bank detected: ${result.bankName || '(none)'}`);
  } else {
    console.log('  (file was already canonical — adapt stage skipped)');
  }

  // Flag rows worth a human look.
  const emptyDate = rows.filter((r) => !r.Date);
  const emptyCategory = rows.filter((r) => !r.Category);
  const suspiciouslySmall = rows.filter((r) => looksSuspiciouslySmall(Number(r.Amount)));
  const uncategorised = rows.filter((r) => r.Category === 'Uncategorised');

  if (emptyDate.length) {
    console.log(`\n  ⚠ ${emptyDate.length} row(s) with no parseable date:`);
    emptyDate.slice(0, 5).forEach((r) => console.log(`      ${r.Description}  £${r.Amount}`));
  }
  if (emptyCategory.length) {
    console.log(`\n  ⚠ ${emptyCategory.length} row(s) with no category assigned at all (should be impossible):`);
    emptyCategory.slice(0, 5).forEach((r) => console.log(`      ${r.Description}  £${r.Amount}`));
  }
  if (suspiciouslySmall.length) {
    console.log(`\n  ⚠ ${suspiciouslySmall.length} row(s) with amount under £1 — check these aren't truncated (the earlier thousands-separator bug class):`);
    suspiciouslySmall.slice(0, 5).forEach((r) => console.log(`      ${r.Date}  ${r.Description}  £${r.Amount}`));
  }

  const uncatRate = rows.length ? ((uncategorised.length / rows.length) * 100).toFixed(1) : '0.0';
  console.log(`\n  uncategorised rate: ${uncategorised.length}/${rows.length} (${uncatRate}%)`);
  if (uncategorised.length) {
    console.log(`  sample uncategorised merchants:`);
    [...new Set(uncategorised.map((r) => r.Description))].slice(0, 8).forEach((d) => console.log(`      ${d}`));
  }

  // Run the actual P&L generator on this file's output.
  const tmpPath = path.join(os.tmpdir(), `real-data-canonical-${Date.now()}.csv`);
  fs.writeFileSync(tmpPath, result.csv, 'utf8');
  let pl;
  try {
    pl = generatePl({ file_path: tmpPath });
  } finally {
    fs.unlinkSync(tmpPath);
  }

  console.log(`\n  ── P&L summary ──────────────────────────────────────`);
  console.log(`  Revenue:        £${pl.revenue.total}`);
  console.log(`  Cost of sales:  £${pl.cost_of_sales.total}`);
  console.log(`  Gross profit:   £${pl.gross_profit}`);
  console.log(`  Overheads:      £${pl.overheads.total}`);
  console.log(`  Net profit:     £${pl.net_profit}`);
  console.log(`  Excluded (transfers/VAT/drawings/etc.): ${pl.excluded.count} rows`);
  if (pl.excluded.breakdown.length) {
    pl.excluded.breakdown.forEach((l) => console.log(`      ${l.name}: ${l.count} rows, £${l.total}`));
  }
  console.log(`  Exceptions needing review: ${pl.exceptions.total_count}`);

  return {
    name,
    rowsOut: rows.length,
    rawLineCount,
    emptyDate: emptyDate.length,
    emptyCategory: emptyCategory.length,
    suspiciouslySmall: suspiciouslySmall.length,
    uncategorisedRate: Number(uncatRate),
    netProfit: pl.net_profit,
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('✗ ANTHROPIC_API_KEY is not set — this script needs it for detectProfile/classifyMerchants.');
    console.log('  Set it in .env or as a Codespace secret, then re-run.');
    process.exit(1);
  }

  const files = listInputFiles();
  if (files.length === 0) {
    console.log(`No CSVs found in ${DATA_DIR}`);
    console.log('Drop 5-10 of your own real bank export CSVs there, then re-run.');
    console.log('(This folder is gitignored — see stress-test/real-data/.gitkeep — so nothing committed.)');
    process.exit(0);
  }

  console.log(`Found ${files.length} file(s) in stress-test/real-data/\n`);

  const results = [];
  for (const f of files) {
    results.push(await runFile(f));
  }

  console.log('\n' + '═'.repeat(78));
  console.log('OVERALL SUMMARY');
  console.log('═'.repeat(78));
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.name}: ✗ THREW — ${r.error}`);
      continue;
    }
    const flags = [];
    if (r.emptyDate) flags.push(`${r.emptyDate} bad date`);
    if (r.emptyCategory) flags.push(`${r.emptyCategory} no category`);
    if (r.suspiciouslySmall) flags.push(`${r.suspiciouslySmall} suspiciously small`);
    if (r.uncategorisedRate > 15) flags.push(`${r.uncategorisedRate}% uncategorised — high`);
    console.log(
      `  ${r.name}: ${r.rowsOut} rows, net profit £${r.netProfit}${flags.length ? '  ⚠ ' + flags.join(', ') : '  ✓'}`,
    );
  }
  console.log('\nReview any ⚠ rows above and the per-file detail before trusting this on a real client.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
