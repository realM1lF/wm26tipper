import { createClient } from "@/lib/supabase/server";
import { isTipLocked } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("status, kickoff_at")
    .neq("status", "finished");

  const liveCount =
    matches?.filter(
      (m) => m.status === "live" || isTipLocked(m.kickoff_at),
    ).length ?? 0;

  return Response.json({ liveCount, serverTime: Date.now() });
}
