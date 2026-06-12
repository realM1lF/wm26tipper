import { config } from "dotenv";
config({ path: ".env.local" });

import { syncMatchResults } from "../src/lib/sync/match-results";

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase env vars fehlen in .env.local");
    process.exit(1);
  }

  const result = await syncMatchResults();
  console.log(
    `Sync OK: ${result.total} geprüft, ${result.created} neu, ${result.updated} aktualisiert, ${result.teamsResolved} mit Teams`,
  );
  if (result.unknownTeams.length) {
    console.warn("Unbekannte Teamnamen:", result.unknownTeams.join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
