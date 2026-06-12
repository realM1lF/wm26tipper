import type { SupabaseClient, User } from "@supabase/supabase-js";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeDisplayName(name: string) {
  return name.trim().toLowerCase();
}

export async function findUserByEmail(
  service: SupabaseClient,
  email: string,
): Promise<User | null> {
  const normalized = normalizeEmail(email);
  let page = 1;

  while (true) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error || !data?.users?.length) return null;

    const user = data.users.find(
      (entry) => entry.email?.toLowerCase() === normalized,
    );
    if (user) return user;

    if (data.users.length < 1000) return null;
    page += 1;
  }
}

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Zu viele E-Mails gesendet. Bitte 15–60 Minuten warten und es erneut versuchen.";
  }

  if (
    lower.includes("not authorized") ||
    lower.includes("email address not authorized")
  ) {
    return "E-Mail-Versand ist noch nicht für externe Adressen freigeschaltet. Bitte den Admin kontaktieren.";
  }

  return message;
}
