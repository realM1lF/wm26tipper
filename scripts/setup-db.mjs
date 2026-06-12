import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const TEAMS = [
  ["MEX", "Mexiko", "🇲🇽", "A"], ["RSA", "Südafrika", "🇿🇦", "A"],
  ["KOR", "Südkorea", "🇰🇷", "A"], ["CZE", "Tschechien", "🇨🇿", "A"],
  ["CAN", "Kanada", "🇨🇦", "B"], ["BIH", "Bosnien", "🇧🇦", "B"],
  ["QAT", "Katar", "🇶🇦", "B"], ["SUI", "Schweiz", "🇨🇭", "B"],
  ["BRA", "Brasilien", "🇧🇷", "C"], ["MAR", "Marokko", "🇲🇦", "C"],
  ["HAI", "Haiti", "🇭🇹", "C"], ["SCO", "Schottland", "🏴", "C"],
  ["USA", "USA", "🇺🇸", "D"], ["PAR", "Paraguay", "🇵🇾", "D"],
  ["AUS", "Australien", "🇦🇺", "D"], ["TUR", "Türkei", "🇹🇷", "D"],
  ["GER", "Deutschland", "🇩🇪", "E"], ["CUW", "Curaçao", "🇨🇼", "E"],
  ["CIV", "Elfenbeinküste", "🇨🇮", "E"], ["ECU", "Ecuador", "🇪🇨", "E"],
  ["NED", "Niederlande", "🇳🇱", "F"], ["JPN", "Japan", "🇯🇵", "F"],
  ["SWE", "Schweden", "🇸🇪", "F"], ["TUN", "Tunesien", "🇹🇳", "F"],
  ["BEL", "Belgien", "🇧🇪", "G"], ["EGY", "Ägypten", "🇪🇬", "G"],
  ["IRN", "Iran", "🇮🇷", "G"], ["NZL", "Neuseeland", "🇳🇿", "G"],
  ["ESP", "Spanien", "🇪🇸", "H"], ["CPV", "Kap Verde", "🇨🇻", "H"],
  ["KSA", "Saudi-Arabien", "🇸🇦", "H"], ["URU", "Uruguay", "🇺🇾", "H"],
  ["FRA", "Frankreich", "🇫🇷", "I"], ["SEN", "Senegal", "🇸🇳", "I"],
  ["IRQ", "Irak", "🇮🇶", "I"], ["NOR", "Norwegen", "🇳🇴", "I"],
  ["ARG", "Argentinien", "🇦🇷", "J"], ["ALG", "Algerien", "🇩🇿", "J"],
  ["AUT", "Österreich", "🇦🇹", "J"], ["JOR", "Jordanien", "🇯🇴", "J"],
  ["POR", "Portugal", "🇵🇹", "K"], ["COD", "DR Kongo", "🇨🇩", "K"],
  ["UZB", "Usbekistan", "🇺🇿", "K"], ["COL", "Kolumbien", "🇨🇴", "K"],
  ["ENG", "England", "🏴", "L"], ["CRO", "Kroatien", "🇭🇷", "L"],
  ["GHA", "Ghana", "🇬🇭", "L"], ["PAN", "Panama", "🇵🇦", "L"],
];

const INVITE_CODE = "WM26-FREUNDE";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!url || !serviceKey) throw new Error("Supabase env vars fehlen");

  if (!databaseUrl) {
    console.log("⚠ DATABASE_URL fehlt — Migrationen 004+005 manuell in Supabase SQL Editor ausführen");
    console.log("  → supabase/migrations/004_005_combined.sql");
  } else {
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
        console.log(`✓ Migration ${file}`);
      }
    } finally {
      await sql.end();
    }
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const teams = TEAMS.map(([code, name, flag_emoji, group_name]) => ({
    code, name, flag_emoji, group_name,
  }));
  const { error: te } = await supabase.from("teams").upsert(teams);
  if (te) throw te;
  console.log(`✓ ${teams.length} Teams`);

  const matchesPath = path.join(process.cwd(), "supabase/seed/matches.json");
  if (!fs.existsSync(matchesPath)) {
    console.log("matches.json fehlt — führe node scripts/build-matches.mjs aus");
    process.exit(1);
  }
  const matches = JSON.parse(fs.readFileSync(matchesPath, "utf8")).map((m) => ({
      fifa_match_id: m.fifa_match_id,
      home_team_code: m.home_team_code,
      away_team_code: m.away_team_code,
      kickoff_at: m.kickoff_at,
      stage: m.stage,
      group_name: m.group_name,
      status: m.status,
      home_score: m.home_score,
      away_score: m.away_score,
    }));

  const { error: me } = await supabase.from("matches").upsert(matches, {
    onConflict: "fifa_match_id",
  });
  if (me) throw me;
  console.log(`✓ ${matches.length} Spiele (FIFA-Spielplan UTC)`);

  const finished = matches.filter((m) => m.status === "finished");
  console.log(`  ${finished.length} Spiele als beendet markiert`);

  const { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("invite_code", INVITE_CODE)
    .maybeSingle();
  if (!league) {
    const { error: le } = await supabase.from("leagues").insert({
      name: "WM26 Freunde",
      invite_code: INVITE_CODE,
      created_by: null,
    });
    if (le) throw le;
    console.log(`✓ Liga (${INVITE_CODE})`);
  }

  console.log("\nSetup fertig.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
