import { redirect } from "next/navigation";

export default function SpieltageRedirect() {
  redirect("/matches?view=dates");
}
