import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const samplePath = path.join(process.cwd(), "data", "transactions.csv");

  try {
    const csv = await readFile(samplePath, "utf8");
    return new Response(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  } catch {
    return new Response("Sample data not found.", { status: 404 });
  }
}
