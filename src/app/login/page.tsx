import { redirect } from "next/navigation";
import { getCurrentUser, getMembership } from "@/lib/queries";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    const membership = await getMembership(user.id);
    redirect(membership ? "/dashboard" : "/join");
  }

  const params = await searchParams;

  return <LoginForm authError={params.error} />;
}
