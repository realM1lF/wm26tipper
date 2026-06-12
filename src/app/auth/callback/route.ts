import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/join";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const displayName =
        typeof user?.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name.trim()
          : "";

      if (user && displayName.length >= 2) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
