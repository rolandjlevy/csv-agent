// CSV adaptation stage. Converts ANY bank's CSV export into the canonical
// schema the agent's tools expect — Date,Description,Amount,Category,Bank —
// so the agent loop in agent-core.js never has to know about per-bank quirks.
//
// Design: the LLM DECIDES the mapping (which column is the date, how amounts
// are encoded, where the real header starts); plain JavaScript DOES the
// transformation of every row. Money is never summed by the model — the same
// property the analyse tool relies on. Two small LLM calls happen once at
// ingestion: detectProfile() and classifyMerchants(). Everything else is
// deterministic and auditable.

const Anthropic = require('@anthropic-ai/sdk');
const { parse } = require('csv-parse/sync');
const { MODEL } = require('./agent-core');
const { merchantKey } = require('./merchant');
const { ACCOUNTS } = require('./accounts');

// Flat list of account names — used in the classifier tool enum and as the
// backward-compatible CATEGORIES export consumed by external code.
const ACCOUNT_NAMES = ACCOUNTS.map((a) => a.name);

// Backward-compat alias — external code that imported CATEGORIES still gets a
// string array; values are now COA names instead of personal-finance labels.
const CATEGORIES = ACCOUNT_NAMES;

// ---------------------------------------------------------------------------
// Stage 1 — detect (one small LLM call on a sample of the raw file)
// ---------------------------------------------------------------------------

const PROFILE_TOOL = {
  name: 'report_profile',
  description:
    'Report the structure of a bank CSV export so it can be normalised into a Date,Description,Amount,Category,Bank schema.',
  input_schema: {
    type: 'object',
    properties: {
      headerRowIndex: {
        type: 'integer',
        description:
          '0-based index (among the numbered lines shown) of the row that contains the real column headers. Preamble/metadata/blank rows come before it.',
      },
      hasHeaderRow: {
        type: 'boolean',
        description:
          'False if the file has NO header row at all (every line is a transaction, e.g. some HSBC exports). When false, the column fields below must be 0-based COLUMN INDEXES given as strings ("0", "1", "2") instead of header text. Defaults to true.',
      },
      bankName: {
        type: 'string',
        description:
          'Bank or account name if identifiable from the file, else "Unknown".',
      },
      currencyCode: {
        type: 'string',
        description: 'ISO currency code, e.g. GBP, USD.',
      },
      dateColumn: {
        type: 'string',
        description: 'Exact header text of the transaction date column.',
      },
      dateFormat: {
        type: 'string',
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        description: 'Format the dates are written in.',
      },
      descriptionColumn: {
        type: 'string',
        description:
          'Exact header text of the transaction description/narrative column.',
      },
      amountConvention: {
        type: 'string',
        enum: ['signed', 'split', 'debit_credit'],
        description:
          '"signed": one column with +/- amounts. "split": separate money-in and money-out columns (out is a positive magnitude). "debit_credit": separate credit and debit columns.',
      },
      amountColumn: {
        type: 'string',
        description:
          'For "signed": exact header text of the single amount column.',
      },
      moneyInColumn: {
        type: 'string',
        description:
          'For "split"/"debit_credit": exact header text of the money-in / credit column.',
      },
      moneyOutColumn: {
        type: 'string',
        description:
          'For "split"/"debit_credit": exact header text of the money-out / debit column.',
      },
    },
    required: [
      'headerRowIndex',
      'dateColumn',
      'dateFormat',
      'descriptionColumn',
      'amountConvention',
    ],
  },
};

const DETECT_PROMPT = `You are given the first lines of a bank's CSV export, each prefixed with its 0-based line index.
Identify how to read it and call report_profile. Use the EXACT header text as it appears (including
spacing/casing) for the column fields. Ignore any preamble, metadata, blank, or padding columns.
If the file has NO header row at all (the very first line is already a transaction), set
hasHeaderRow=false and give 0-based COLUMN INDEXES ("0", "1", ...) for the column fields instead.`;

async function detectProfile(rawText, { apiKey } = {}) {
  const client = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });

  const sample = rawText
    .split(/\r?\n/)
    .slice(0, 25)
    .map((line, i) => `${i}: ${line}`)
    .join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [PROFILE_TOOL],
    tool_choice: { type: 'tool', name: 'report_profile' },
    messages: [{ role: 'user', content: `${DETECT_PROMPT}\n\n${sample}` }],
  });

  const block = response.content.find((b) => b.type === 'tool_use');
  if (!block) throw new Error('Could not detect the CSV structure.');
  return block.input;
}

// ---------------------------------------------------------------------------
// Stage 2 — transform (pure JavaScript; no LLM, no model-side maths)
// ---------------------------------------------------------------------------

// Strip currency symbols, thousands separators and stray mojibake (e.g. the
// "Ł" a Windows-1252 "£" becomes when mis-decoded), keeping only digits, a
// decimal point and a sign. "(5.00)" is treated as -5.00.
function parseAmount(value) {
  if (value == null) return NaN;
  let text = String(value).trim();
  if (!text) return NaN;
  const negativeParens = /^\(.*\)$/.test(text);
  text = text.replace(/[^0-9.\-]/g, '');
  if (!text || text === '-' || text === '.') return NaN;
  const num = parseFloat(text);
  if (Number.isNaN(num)) return NaN;
  return negativeParens ? -Math.abs(num) : num;
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

// Normalise to dd/mm/yyyy — the format the analyse tool's month filter expects.
function normaliseDate(value, format) {
  const text = String(value || '').trim();
  if (!text) return text;

  const pad = (s) => s.padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    const m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${pad(m[3])}/${pad(m[2])}/${m[1]}`;
    return text;
  }

  const parts = text.split(/[/\-.]/);
  if (parts.length < 3) return text;
  let [a, b, c] = parts;
  if (format === 'MM/DD/YYYY') [a, b] = [b, a]; // swap to day-first
  return `${pad(a)}/${pad(b)}/${c}`;
}

// When a data row has MORE columns than the header, an unquoted thousands
// separator has split a numeric field across cells: "£3,200.00" parses to
// ["£3", "200.00"]. This rejoins a number that begins at colIdx. It only acts
// when overflow > 0, so correctly-quoted files are never touched. Scope: the
// amount-side split (the catastrophic, money-is-wrong case). A split inside the
// description corrupts only the merchant string and is left for the detector /
// exceptions list to flag, not repaired here.
function rejoinSplitNumber(rec, colIdx, overflow) {
  let raw = String(rec[colIdx] ?? '');
  if (overflow <= 0) return raw;
  if (!/\d/.test(raw) || /\.\d/.test(raw)) return raw; // not an integer-headed number
  let used = 0;
  while (used < overflow) {
    const next = String(rec[colIdx + 1 + used] ?? '');
    if (/^\d{3}(\.\d+)?$/.test(next)) {
      // a split-off thousands group (e.g. "200" or "200.00")
      raw += next;
      used += 1;
      if (next.includes('.')) break; // the group carrying the decimal is always last
    } else break;
  }
  return raw;
}

// Apply a detected profile to the raw text, returning canonical row objects.
// Parses in array mode (not columns:true) so duplicate empty header names and
// ragged rows from padding columns can't break the parse.
function applyProfile(rawText, profile, bankName) {
  const lines = rawText.split(/\r?\n/);
  const fromHeader = lines.slice(profile.headerRowIndex || 0).join('\n');

  const records = parse(fromHeader, {
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
  });
  if (records.length === 0) return [];

  // Headerless exports (e.g. some HSBC personal current accounts) carry no
  // header row — every record is a transaction, and the profile addresses
  // columns by 0-based index rather than by header text.
  const hasHeader = profile.hasHeaderRow !== false;
  let header = null;
  let dataRows = records;
  if (hasHeader) {
    if (records.length < 2) return [];
    header = records[0].map((h) => String(h).trim().toLowerCase());
    dataRows = records.slice(1);
  }

  const idx = (spec) => {
    if (!hasHeader) {
      const n = parseInt(spec, 10);
      return Number.isInteger(n) ? n : -1;
    }
    return header.indexOf(
      String(spec || '')
        .trim()
        .toLowerCase(),
    );
  };
  const headerLen = hasHeader ? header.length : 0;

  const dDate = idx(profile.dateColumn);
  const dDesc = idx(profile.descriptionColumn);
  const dAmt = idx(profile.amountColumn);
  const dIn = idx(profile.moneyInColumn);
  const dOut = idx(profile.moneyOutColumn);

  const rows = [];
  for (const rec of dataRows) {
    const description = String(rec[dDesc] ?? '').trim();
    const rawDate = String(rec[dDate] ?? '').trim();
    if (!description && !rawDate) continue; // blank / padding row

    // Overflow only has meaning when there is a header to compare against.
    const overflow = hasHeader ? rec.length - headerLen : 0;

    let amount;
    if (profile.amountConvention === 'signed') {
      amount = parseAmount(rejoinSplitNumber(rec, dAmt, overflow));
    } else {
      const rawIn = String(rec[dIn] ?? '').trim();
      const rawOut = String(rec[dOut] ?? '').trim();
      if (!rawIn && !rawOut) continue; // no money in OR out — a balance/summary line, not a transaction
      const inV = parseAmount(rejoinSplitNumber(rec, dIn, overflow));
      const outV = parseAmount(rejoinSplitNumber(rec, dOut, overflow));
      amount =
        (Number.isNaN(inV) ? 0 : inV) -
        (Number.isNaN(outV) ? 0 : Math.abs(outV));
    }
    if (Number.isNaN(amount)) continue;

    rows.push({
      Date: normaliseDate(rawDate, profile.dateFormat),
      Description: description,
      Amount: round2(amount),
      Category: '',
      Bank: bankName,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Stage 3 — categorise (classify UNIQUE merchant keys once, then map back)
// ---------------------------------------------------------------------------

// merchantKey (shared with the analyse tool) collapses a noisy description to a
// stable key so the classifier sees each merchant once — see lib/merchant.js.

const CLASSIFY_TOOL = {
  name: 'report_categories',
  description:
    'Assign each UK business bank-statement merchant/payee to exactly one chart-of-accounts category.',
  input_schema: {
    type: 'object',
    properties: {
      assignments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            merchant: {
              type: 'string',
              description: 'The merchant string, copied verbatim.',
            },
            category: { type: 'string', enum: ACCOUNT_NAMES },
          },
          required: ['merchant', 'category'],
        },
      },
    },
    required: ['assignments'],
  },
};

// Prompt text is deliberately long: the exclusion rules prevent the single most
// common way an AI-categorised P&L is silently wrong (balance-sheet movements
// appearing as income or expense). Completeness here is the moat.
const CLASSIFY_PROMPT = `\
You are classifying UK business bank-statement transactions into chart-of-accounts categories for a P&L.

EXCLUSION RULES — apply these FIRST, before any other rule:
1. HMRC VAT Return / VAT Payment / VAT Repayment / HMRC VAT → "VAT"
2. HMRC Self Assessment / HMRC PAYE / Corporation Tax / HMRC Tax / SA Payment → "Tax & PAYE"
3. Transfer to or from own savings account, own business account, or between the owner's own accounts → "Transfer"
4. Owner withdrawal, director salary, dividends to owner, drawings → "Drawings"
5. Loan or mortgage repayment: the PRINCIPAL portion → "Loan Principal" (this is a balance-sheet movement, not an expense)
6. Interest charged on a loan, overdraft interest, finance charge → "Loan Interest" (this IS a P&L expense)
7. Purchase of equipment, machinery, vehicles, computers, property (capital items with multi-year life) → "Capital Expenditure"
8. A person's name after a payment-platform prefix (PAYPAL *, VENMO *, WISE *, REVOLUT *) with no invoice or business reference → "Uncategorised". It could be a contractor, a customer refund, owner drawings, or personal; never assign without a reference.
9. If the transaction is genuinely ambiguous and you cannot determine its nature → "Uncategorised". NEVER guess.

INCOME (credit-side transactions representing business revenue):
- Client invoice payments, sales receipts, consultancy fees paid to the business → "Sales / Revenue"
- Refunds received, government grants, bank interest earned, sundry income → "Other Income"

COST OF SALES (direct costs tied to delivering revenue):
- Stock, raw materials, goods bought specifically for resale → "Cost of Goods Sold"
- Freelancers, contractors, or agencies hired project-by-project → "Subcontractors"

OVERHEADS (recurring operating expenses):
- Employee wages, payroll runs, PAYE paid on behalf of employees → "Wages & Salaries"
- Office/studio/workshop rent, business rates, ground rent → "Rent & Rates"
- Gas, electricity, water for business premises → "Utilities"
- Business insurance: public liability, professional indemnity, employers' liability → "Insurance"
- Business travel: rail, flights, parking, mileage reimbursement, Uber/taxi for work → "Travel & Motoring"
- Business mobile phone, broadband, landline, virtual phone number → "Telecommunications"
- Stationery, printer ink, postage, stamps, envelopes, office sundries → "Office & Admin Supplies"
- Google Ads, Meta Ads, LinkedIn Ads, PR agency, copywriting, SEO, print ads → "Marketing & Advertising"
- Client entertaining, team meals, staff lunches → "Meals & Entertainment"
- SaaS tools, software licences, cloud hosting, domain names, app subscriptions → "Subscriptions & Software"
- Accountant, bookkeeper, solicitor, HR consultant, business coach → "Professional Fees"
- Equipment servicing, property repairs, maintenance contracts → "Repairs & Maintenance"
- Bank account fees, card payment fees, Stripe / PayPal / Square processing fees, FX fees → "Bank Charges & Fees"
- Any other allowable business expense not fitting the above → "Other Expenses"

Return one assignment per input, copying the merchant string verbatim.`;

async function classifyMerchants(keys, { apiKey } = {}) {
  if (keys.length === 0) return {};

  const client = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: 'tool', name: 'report_categories' },
    messages: [
      {
        role: 'user',
        content:
          CLASSIFY_PROMPT +
          '\n\nMerchants to classify:\n' +
          keys.map((k) => `- ${k}`).join('\n'),
      },
    ],
  });

  const block = response.content.find((b) => b.type === 'tool_use');
  const assignments = block?.input?.assignments ?? [];
  const map = {};
  for (const a of assignments) {
    if (a && typeof a.merchant === 'string') {
      map[a.merchant] = ACCOUNT_NAMES.includes(a.category) ? a.category : 'Uncategorised';
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Output + orchestration
// ---------------------------------------------------------------------------

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCanonicalCsv(rows) {
  const header = 'Date,Description,Amount,Category,Bank';
  const body = rows
    .map((r) =>
      [r.Date, r.Description, r.Amount, r.Category, r.Bank]
        .map(csvEscape)
        .join(','),
    )
    .join('\n');
  return `${header}\n${body}\n`;
}

// A file is already canonical (skip adaptation, no LLM cost) if its first line
// already names date, amount and description columns.
function looksCanonical(rawText) {
  const first = (rawText.split(/\r?\n/, 1)[0] || '').toLowerCase();
  return (
    first.includes('date') &&
    first.includes('amount') &&
    first.includes('description')
  );
}

// Apply a (detected OR user-confirmed) profile: transform every row, classify
// merchants, and emit a canonical CSV. Skips detection entirely — used by the
// web flow once the user has confirmed/edited the profile in the UI.
async function transformAndCategorise(
  rawText,
  profile,
  { apiKey, onEvent } = {},
) {
  const emit = onEvent || (() => {});
  const bankName = profile.bankName || 'Unknown';

  const rows = applyProfile(rawText, profile, bankName);
  if (rows.length === 0)
    throw new Error('No transactions could be parsed from this CSV.');
  await emit({
    stage: 'transform',
    message: `Normalised ${rows.length} transactions.`,
  });

  const keyByDescription = new Map();
  const uniqueKeys = new Set();
  for (const row of rows) {
    const key = merchantKey(row.Description);
    keyByDescription.set(row.Description, key);
    if (key) uniqueKeys.add(key);
  }

  await emit({
    stage: 'categorise',
    message: `Classifying ${uniqueKeys.size} unique merchants…`,
  });
  const categoryByKey = await classifyMerchants([...uniqueKeys], { apiKey });
  for (const row of rows) {
    row.Category =
      categoryByKey[keyByDescription.get(row.Description)] || 'Uncategorised';
  }

  const usedCategories = new Set(rows.map((r) => r.Category));
  await emit({
    stage: 'done',
    message: `Adapted into ${rows.length} rows across ${usedCategories.size} categories.`,
  });

  return {
    csv: toCanonicalCsv(rows),
    profile,
    rowCount: rows.length,
    bankName,
    skipped: false,
  };
}

// Full one-shot ingestion (detect + transform): raw bank CSV -> canonical CSV.
// Used by the CLI and as the no-confirmed-profile fallback in the web route.
// onEvent({ stage, message, profile? }) reports progress; awaited so streaming
// consumers can apply backpressure (same contract as agent-core's onEvent).
async function adaptCsv(rawText, { apiKey, onEvent } = {}) {
  const emit = onEvent || (() => {});

  if (looksCanonical(rawText)) {
    await emit({
      stage: 'skip',
      message: 'CSV is already in the canonical format — using it as-is.',
    });
    return {
      csv: rawText,
      profile: null,
      rowCount: null,
      bankName: null,
      skipped: true,
    };
  }

  await emit({ stage: 'detect', message: 'Detecting the CSV structure…' });
  const profile = await detectProfile(rawText, { apiKey });
  await emit({
    stage: 'profile',
    message: `Detected ${profile.bankName || 'Unknown'} export — ${profile.amountConvention} amounts, header on row ${profile.headerRowIndex}.`,
    profile,
  });

  return transformAndCategorise(rawText, profile, { apiKey, onEvent });
}

module.exports = {
  adaptCsv,
  transformAndCategorise,
  detectProfile,
  applyProfile,
  classifyMerchants,
  looksCanonical,
  parseAmount,
  normaliseDate,
  merchantKey,
  toCanonicalCsv,
  ACCOUNTS,
  CATEGORIES,
};
