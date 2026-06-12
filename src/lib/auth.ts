export function displayNameFromUser(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const meta = user.user_metadata ?? {};
  const candidates = [meta.full_name, meta.name, meta.display_name];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length >= 2) {
      return value.trim();
    }
  }

  return user.email?.split("@")[0] ?? "Spieler";
}

export function shouldRefreshDisplayName(
  storedName: string,
  user: { email?: string | null },
) {
  const emailPrefix = user.email?.split("@")[0] ?? "";
  return storedName === "Spieler" || (emailPrefix.length > 0 && storedName === emailPrefix);
}
