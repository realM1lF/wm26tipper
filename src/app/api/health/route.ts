import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from("teams").select("code").limit(1);
    if (error) {
      return Response.json({ ready: false, error: error.message });
    }
    const { count } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });
    return Response.json({ ready: true, matchCount: count ?? 0 });
  } catch (e) {
    return Response.json({
      ready: false,
      error: e instanceof Error ? e.message : "Unbekannter Fehler",
    });
  }
}
