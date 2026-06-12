"use client";

import { useTransition } from "react";
import { MatchTicket } from "./MatchTicket";
import { submitTip } from "@/lib/actions";
import { useToast } from "@/components/ui/ToastProvider";
import type { MatchWithTeams, Tip } from "@/lib/types";

type Props = {
  match: MatchWithTeams;
  myTip?: Tip | null;
  compact?: boolean;
};

export function MatchTicketClient({ match, myTip, compact }: Props) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const hadTip = !!myTip;

  function handleSubmit(home: number, away: number) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await submitTip(match.id, home, away);
          toast(
            hadTip
              ? `Tipp aktualisiert: ${home}:${away}`
              : `Tipp gespeichert: ${home}:${away}`,
            "success",
          );
          resolve();
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Speichern fehlgeschlagen";
          toast(message, "error");
          reject(e);
        }
      });
    });
  }

  return (
    <MatchTicket
      match={match}
      myTip={myTip}
      onSubmit={handleSubmit}
      loading={pending}
      compact={compact}
    />
  );
}
