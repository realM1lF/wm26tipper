import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      {
        error: "DATABASE_URL fehlt",
        hint: "Connection URI aus Supabase → Settings → Database in .env.local",
      },
      { status: 400 },
    );
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const migrations = [
    "001_schema.sql",
    "002_fix_rls_recursion.sql",
    "003_live_sync.sql",
    "004_knockout_support.sql",
    "005_scoring_fields.sql",
  ];
  try {
    for (const file of migrations) {
      const migration = fs.readFileSync(
        path.join(process.cwd(), "supabase/migrations", file),
        "utf8",
      );
      await sql.unsafe(migration);
    }
  } finally {
    await sql.end();
  }

  execSync("node scripts/setup-db.mjs", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: "" },
  });

  return NextResponse.json({ ok: true, message: "Migration + Seed abgeschlossen" });
}
