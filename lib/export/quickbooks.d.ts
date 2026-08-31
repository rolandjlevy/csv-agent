// Deliberately more permissive than csv-adapt's CanonicalRow: callers
// typically get these rows back from parsing a canonical CSV file with
// csv-parse (all string fields), not from applyProfile()'s in-memory row
// objects (numeric Amount) — toQuickbooksCsv only ever stringifies Amount,
// so it accepts either. Duplicated from xero.d.ts's ExportableRow rather
// than imported, matching this codebase's "mirrors X, no dependency on it"
// pattern (see lib/profile-store.js vs src/lib/saved-profiles.ts).
export interface ExportableRow {
  Date: string;
  Description: string;
  Amount: string | number;
  Category: string;
  Bank: string;
}

export interface QuickbooksExportResult {
  csv: string;
  /** Always empty — QBO's native CSV bank import has no account/category
   * field to leave unmapped. Kept for interface parity with toXeroCsv. */
  unmappedCategories: string[];
  /** Always 0, for the same reason. */
  unmappedRowCount: number;
}

export const QUICKBOOKS_HEADER: string[];

export function toQuickbooksCsv(
  rows: ExportableRow[],
  accountCodeMap?: Record<string, string | null | undefined>
): QuickbooksExportResult;
