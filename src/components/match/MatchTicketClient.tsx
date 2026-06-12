"use client";

import { useState, useTransition } from "react";
import { MatchTicket } from "./MatchTicket";
import { submitTip } from "@/lib/actions";
import { useToast } from "@/components/ui/ToastProvider";
import type { MatchWithTeams, Tip } from "@/lib/types";

type Props = {
  match: MatchWithTeams;
  myTip?: Tip | null;
  currentUserId: string;
};

export function MatchTicketClient({ match, myTip, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();
  const [tipRevision, setTipRevision] = useState(0);
  const { toast } = useToast();
  const hadTip = !!myTip;

  function handleSubmit(home: number, away: number) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await submitTip(match.id, home, away);
          setTipRevision((r) => r + 1);
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
      currentUserId={currentUserId}
      onSubmit={handleSubmit}
      loading={pending}
      tipRevision={tipRevision}
    />
  );
}
