import { detectProfile, looksCanonical, type AdaptProfile } from "@lib/csv-adapt";

export const runtime = "nodejs";

interface DetectRequestBody {
  csvData?: unknown;
}

interface DetectResponse {
  skipped: boolean;
  profile: AdaptProfile | null;
}

// Phase 1 of web ingestion: inspect an uploaded CSV and report how we'd read
// it, so the browser can show an editable confirmation panel BEFORE the
// (more expensive) transform + agent run. Already-canonical files skip this.
export async function POST(req: Request): Promise<Response> {
  let body: DetectRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { csvData } = body;
  if (typeof csvData !== "string" || !csvData.trim()) {
    return Response.json({ error: "Missing or invalid csvData." }, { status: 400 });
  }

  if (looksCanonical(csvData)) {
    return Response.json({ skipped: true, profile: null } satisfies DetectResponse);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Server is missing ANTHROPIC_API_KEY." }, { status: 500 });
  }

  try {
    const profile = await detectProfile(csvData);
    return Response.json({ skipped: false, profile } satisfies DetectResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not detect CSV structure." },
      { status: 500 }
    );
  }
}
