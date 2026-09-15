import { NextResponse } from "next/server";
import { access } from "fs/promises";
import path from "path";

/** Health check for external uptime monitoring. Verifies the app can
 * actually read/write its data directory, not just that the process is
 * alive — a disk/mount issue wouldn't show up in a plain 200 response
 * otherwise. */
export async function GET() {
  try {
    await access(path.join(process.cwd(), "data"));
    return NextResponse.json({ status: "ok", time: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : String(err) },
      { status: 503 }
    );
  }
}
