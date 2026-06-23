// Tool implementations. These are plain functions — no LLM involved here.
// The agent loop in agent.js decides WHEN to call these; this file only
// decides HOW each one behaves once called.

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MAX_ROWS_RETURNED = 50;

// Generated reports always land here, regardless of the path the model
// passes — keeps the project root clean and the output predictable.
const REPORTS_DIR = 'reports';

// Shared by read_csv and analyse so analyse always sees every row, not just
// the MAX_ROWS_RETURNED preview Claude gets back from read_csv — and so
// Claude never has to copy the dataset back to us as a tool input.
function parseCsvFile(file_path) {
  const absolutePath = path.resolve(file_path);
  const raw = fs.readFileSync(absolutePath, 'utf8');

  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function readCsv({ file_path }) {
  const rows = parseCsvFile(file_path);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    columns,
    rows: rows.slice(0, MAX_ROWS_RETURNED),
    total_rows: rows.length,
  };
}

// Case-insensitive lookup of a column name on a row object, since the LLM
// may refer to "category" when the CSV header is "Category".
function getField(row, key) {
  const match = Object.keys(row).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );
  return match ? row[match] : undefined;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  return parseFloat(value.replace(/[£,]/g, ''));
}

// "month=June" has no real column on the row — derive it from Date
// (dd/mm/yyyy). Any other "key=value" filters straight columns.
function rowMonthName(row) {
  const dateValue = getField(row, 'date');
  if (!dateValue) return undefined;
  const parts = String(dateValue).split('/');
  if (parts.length !== 3) return undefined;
  const monthIndex = parseInt(parts[1], 10) - 1;
  return MONTH_NAMES[monthIndex];
}

function applyFilter(rows, filter) {
  if (!filter) return rows;

  const [rawKey, rawValue = ''] = filter.split('=');
  const key = rawKey.trim();
  const value = rawValue.trim();

  return rows.filter((row) => {
    const actual =
      key.toLowerCase() === 'month' ? rowMonthName(row) : getField(row, key);
    return String(actual ?? '').toLowerCase() === value.toLowerCase();
  });
}

function analyse({ file_path, operation, column, group_by, filter }) {
  const rows = parseCsvFile(file_path);
  const filtered = applyFilter(rows, filter);

  if (operation === 'group') {
    const groups = {};
    for (const row of filtered) {
      const groupKey = String(getField(row, group_by) ?? 'Uncategorised');
      const value = toNumber(getField(row, column));
      groups[groupKey] = (groups[groupKey] || 0) + (Number.isNaN(value) ? 0 : value);
    }
    for (const key of Object.keys(groups)) {
      groups[key] = Math.round(groups[key] * 100) / 100;
    }
    return {
      result: groups,
      operation,
      description: `Sum of ${column} grouped by ${group_by}${filter ? ` where ${filter}` : ''}`,
    };
  }

  if (operation === 'count') {
    return {
      result: filtered.length,
      operation,
      description: `Count of rows${filter ? ` where ${filter}` : ''}`,
    };
  }

  const values = filtered
    .map((row) => toNumber(getField(row, column)))
    .filter((value) => !Number.isNaN(value));

  let result;
  switch (operation) {
    case 'sum':
      result = values.reduce((total, value) => total + value, 0);
      break;
    case 'average':
      result = values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
      break;
    case 'min':
      result = values.length ? Math.min(...values) : null;
      break;
    case 'max':
      result = values.length ? Math.max(...values) : null;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  if (typeof result === 'number') {
    result = Math.round(result * 100) / 100;
  }

  return {
    result,
    operation,
    description: `${operation} of ${column}${filter ? ` where ${filter}` : ''} across ${values.length} matching rows`,
  };
}

function writeReport({ content, file_path }) {
  // Ignore any directory the model put in file_path — only keep the file
  // name and always write inside REPORTS_DIR.
  const relativePath = path.join(REPORTS_DIR, path.basename(file_path));
  const absolutePath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');

  return {
    success: true,
    file_path: relativePath,
    bytes: Buffer.byteLength(content, 'utf8'),
  };
}

module.exports = { readCsv, analyse, writeReport };
