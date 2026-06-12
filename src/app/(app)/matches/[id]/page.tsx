import { redirect } from "next/navigation";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/matches");
}
