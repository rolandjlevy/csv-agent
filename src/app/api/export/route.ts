import { parse } from "csv-parse/sync";
import { toXeroCsv, type ExportableRow } from "@lib/export/xero";
import { toQuickbooksCsv } from "@lib/export/quickbooks";
import { toFreeAgentCsv } from "@lib/export/freeagent";

export const runtime = "nodejs";

const EXPORTERS: Record<string, typeof toXeroCsv> = {
  xero: toXeroCsv,
  quickbooks: toQuickbooksCsv,
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
  // Own string values only, on an object with no prototype, so a category
  // named "constructor" or "__proto__" can never pick up inherited properties.
  const codes: Record<string, string> = Object.create(null);
  if (accountCodeMap && typeof accountCodeMap === "object" && !Array.isArray(accountCodeMap)) {
    for (const [category, code] of Object.entries(accountCodeMap)) {
      if (typeof code === "string") codes[category] = code;
    }
  }

  // Parse as plain arrays and build the row objects ourselves, instead of
  // using csv-parse's `columns` option, which builds objects from header
  // names taken from the request (see the csv-parse prototype advisory).
  let rows: ExportableRow[];
  try {
    const table = parse(canonicalCsv, { skip_empty_lines: true }) as string[][];
    const header = table[0] ?? [];
    if (header.length === 0) {
      return Response.json({ error: "Could not parse canonicalCsv." }, { status: 400 });
    }
    rows = table.slice(1).map((cells) => {
      // No prototype, so a header named "__proto__" is just an ordinary key.
      const row: Record<string, string> = Object.create(null);
      header.forEach((name, i) => {
        row[name] = cells[i] ?? "";
      });
      return row as unknown as ExportableRow;
    });
  } catch {
    return Response.json({ error: "Could not parse canonicalCsv." }, { status: 400 });
  }

  const { csv, unmappedCategories, unmappedRowCount } = EXPORTERS[format](rows, codes);

  return Response.json({ csv, unmappedCategories, unmappedRowCount, rowCount: rows.length });
}
