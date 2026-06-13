import { displayNameFromUser, shouldRefreshDisplayName } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type EnsureProfileResult =
  | { ok: true }
  | { ok: false; error: string };

type UserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function isDuplicateKeyError(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function ensureUserProfile(
  user: UserLike,
): Promise<EnsureProfileResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) return { ok: true };
    return {
      ok: false,
      error: "Server-Konfiguration unvollständig (Service Role Key)",
    };
  }

  const service = await createServiceClient();
  const displayName = displayNameFromUser(user);

  const { data: profile, error: readError } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: "Profil konnte nicht angelegt werden" };
  }

  if (!profile) {
    const { error: insertError } = await service.from("profiles").insert({
      id: user.id,
      display_name: displayName,
      avatar_color: "#F4C430",
    });

    if (insertError && !isDuplicateKeyError(insertError)) {
      return { ok: false, error: "Profil konnte nicht angelegt werden" };
    }
  } else if (shouldRefreshDisplayName(profile.display_name, user)) {
    const { error: updateError } = await service
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (updateError) {
      return { ok: false, error: "Profil konnte nicht angelegt werden" };
    }
  }

  const { data: verified } = await service
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!verified) {
    return { ok: false, error: "Profil konnte nicht angelegt werden" };
  }

  return { ok: true };
}
