// Deliberately more permissive than csv-adapt's CanonicalRow — see
// quickbooks.d.ts's ExportableRow comment; duplicated here for the same
// "mirrors X, no dependency on it" reason.
export interface ExportableRow {
  Date: string;
  Description: string;
  Amount: string | number;
  Category: string;
  Bank: string;
}

export interface FreeAgentExportResult {
  csv: string;
  /** Always empty — FreeAgent's bank-statement CSV import has no
   * account/category field to leave unmapped. Kept for interface parity
   * with toXeroCsv. */
  unmappedCategories: string[];
  /** Always 0, for the same reason. */
  unmappedRowCount: number;
}

// No FREEAGENT_HEADER export — the CSV deliberately has no header row.

export function toFreeAgentCsv(
  rows: ExportableRow[],
  accountCodeMap?: Record<string, string | null | undefined>
): FreeAgentExportResult;
