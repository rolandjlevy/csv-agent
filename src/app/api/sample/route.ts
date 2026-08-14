import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const SAMPLE_FILES: Record<string, string> = {
  clean: "transactions.csv",
  messy: "sample-messy.csv",
};

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  // Default to the messy export — it's the one that actually shows off the
  // adaptation layer (the clean sample skips it entirely).
  const kind = searchParams.get("kind") === "clean" ? "clean" : "messy";
  const samplePath = path.join(process.cwd(), "data", SAMPLE_FILES[kind]);

  try {
    const csv = await readFile(samplePath, "utf8");
    return new Response(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  } catch {
    return new Response("Sample data not found.", { status: 404 });
  }
}
