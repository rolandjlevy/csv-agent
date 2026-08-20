// Deliberately more permissive than csv-adapt's CanonicalRow: callers
// typically get these rows back from parsing a canonical CSV file with
// csv-parse (all string fields), not from applyProfile()'s in-memory row
// objects (numeric Amount) — toQuickBooksCsv only ever stringifies Amount,
// so it accepts either.
export interface ExportableRow {
  Date: string;
  Description: string;
  Amount: string | number;
  Category: string;
  Bank: string;
}

export interface QuickBooksExportResult {
  csv: string;
  /** QuickBooks Online CSV import has no account code column, so these are
   * always empty arrays/zero. */
  unmappedCategories: string[];
  unmappedRowCount: number;
}

export const QUICKBOOKS_HEADER: string[];

export function toQuickBooksCsv(
  rows: ExportableRow[],
  accountCodeMap?: Record<string, string | null | undefined>
): QuickBooksExportResult;