import { redirect } from "next/navigation";

export default function GruppenRedirect() {
  redirect("/matches?view=groups");
}
