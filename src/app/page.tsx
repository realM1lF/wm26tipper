import { redirect } from "next/navigation";
import { getCurrentUser, getMembership } from "@/lib/queries";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getMembership(user.id);
  if (!membership) redirect("/join");
  redirect("/dashboard");
}
