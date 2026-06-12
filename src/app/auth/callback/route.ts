import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/queries";
import { displayNameFromUser, shouldRefreshDisplayName } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const service = await createServiceClient();
        const { data: profile } = await service
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        const displayName = displayNameFromUser(user);

        if (!profile) {
          await service.from("profiles").insert({
            id: user.id,
            display_name: displayName,
            avatar_color: "#F4C430",
          });
        } else if (shouldRefreshDisplayName(profile.display_name, user)) {
          await service
            .from("profiles")
            .update({ display_name: displayName })
            .eq("id", user.id);
        }

        const membership = await getMembership(user.id);
        const next = membership ? "/dashboard" : "/join";
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
