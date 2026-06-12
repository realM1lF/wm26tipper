import { redirect } from "next/navigation";
import { getCurrentUser, getMembership } from "@/lib/queries";
import { AppNav } from "@/components/layout/AppNav";
import { signOut } from "@/lib/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getMembership(user.id);
  if (!membership) redirect("/join");

  return (
    <div className="min-h-dvh pb-8">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 pt-6">{children}</div>
      <footer className="mx-auto mt-12 max-w-3xl px-4">
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-chalk/30 hover:text-chalk/50"
          >
            Abmelden
          </button>
        </form>
      </footer>
    </div>
  );
}
