// Deliberately more permissive than csv-adapt's CanonicalRow: callers
// typically get these rows back from parsing a canonical CSV file with
// csv-parse (all string fields), not from applyProfile()'s in-memory row
// objects (numeric Amount) — toFreeAgentCsv only ever stringifies Amount,
// so it accepts either.
export interface ExportableRow {
  Date: string;
  Description: string;
  Amount: string | number;
  Category: string;
  Bank: string;
}

export interface FreeAgentExportResult {
  csv: string;
  /** Categories present in the input rows with no non-empty nominal code in
   * the supplied map — the caller must resolve these before offering the
   * file for download. */
  unmappedCategories: string[];
  /** How many rows fell into an unmapped category. */
  unmappedRowCount: number;
}

export const FREEAGENT_HEADER: string[];

export function toFreeAgentCsv(
  rows: ExportableRow[],
  accountCodeMap?: Record<string, string | null | undefined>
): FreeAgentExportResult;