"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { INVITE_CODE } from "@/lib/data/teams";

export async function submitTip(matchId: string, homeScore: number, awayScore: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");

  const { data: match } = await supabase
    .from("matches")
    .select("kickoff_at, home_team_code, away_team_code")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Spiel nicht gefunden");
  if (!match.home_team_code || !match.away_team_code) {
    throw new Error("Teams stehen noch nicht fest");
  }
  if (new Date(match.kickoff_at) <= new Date()) {
    throw new Error("Tippzeit abgelaufen");
  }

  const { error } = await supabase.from("tips").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath(`/matches/${matchId}`);
}

export async function joinLeague(inviteCode: string) {
  const supabase = await createClient();
  const service = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");

  const { data: league, error: le } = await service
    .from("leagues")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (le || !league) throw new Error("Ungültiger Einladungscode");

  const { error } = await service.from("league_members").upsert(
    { league_id: league.id, user_id: user.id, role: "member" },
    { onConflict: "league_id,user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateProfile(displayName: string, avatarColor: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, avatar_color: avatarColor })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function ensureDefaultLeague() {
  const service = await createServiceClient();
  const { data } = await service
    .from("leagues")
    .select("id")
    .eq("invite_code", INVITE_CODE)
    .maybeSingle();

  if (!data) {
    await service.from("leagues").insert({
      name: "WM26 Freunde",
      invite_code: INVITE_CODE,
      created_by: null,
    });
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
