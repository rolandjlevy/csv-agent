import { parse } from "csv-parse/sync";
import { toXeroCsv, type ExportableRow } from "@lib/export/xero";
import { toQuickBooksCsv } from "@lib/export/quickbooks";
import { toFreeAgentCsv } from "@lib/export/freeagent";

export const runtime = "nodejs";

const EXPORTERS: Record<
  string,
  typeof toXeroCsv | typeof toQuickBooksCsv | typeof toFreeAgentCsv
> = {
  xero: toXeroCsv,
  quickbooks: toQuickBooksCsv,
  freeagent: toFreeAgentCsv,
};

interface ExportRequestBody {
  canonicalCsv?: unknown;
  format?: unknown;
  accountCodeMap?: unknown;
}

// Maps the already-adapted canonical CSV (from a prior /api/agent response's
// canonical_data event) into a target accounting-system format. Pure
// mapping, no LLM call — the account-code table is supplied by the caller
// (defaults + any saved recipe overrides), never computed here, so the
// browser stays the single source of truth for what the user has actually
// confirmed. Runs server-side (not client-side) so the CommonJS lib/export
// modules never need to be bundled into the browser.
export async function POST(req: Request): Promise<Response> {
  let body: ExportRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { canonicalCsv, format, accountCodeMap } = body;

  if (typeof canonicalCsv !== "string" || !canonicalCsv.trim()) {
    return Response.json({ error: "Missing or invalid canonicalCsv." }, { status: 400 });
  }
  if (typeof format !== "string" || !(format in EXPORTERS)) {
    return Response.json(
      { error: `Unknown export format. Supported: ${Object.keys(EXPORTERS).join(", ")}.` },
      { status: 400 }
    );
  }
  const codes: Record<string, string> =
    accountCodeMap && typeof accountCodeMap === "object" ? (accountCodeMap as Record<string, string>) : {};

  let rows: ExportableRow[];
  try {
    rows = parse(canonicalCsv, { columns: true, skip_empty_lines: true }) as ExportableRow[];
  } catch {
    return Response.json({ error: "Could not parse canonicalCsv." }, { status: 400 });
  }

  const { csv, unmappedCategories, unmappedRowCount } = EXPORTERS[format](rows, codes);

  return Response.json({ csv, unmappedCategories, unmappedRowCount, rowCount: rows.length });
}
