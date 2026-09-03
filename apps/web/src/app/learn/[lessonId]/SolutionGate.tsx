"use client";

import { useState } from "react";
import s from "./learn.module.css";

export function SolutionGate({
  taskId,
  attempts,
  hintsUsed,
  minutes,
  onReveal,
}: {
  taskId: string;
  attempts: number;
  hintsUsed: number;
  minutes: number;
  onReveal: (patch: unknown, explanation: { mn: string }) => void;
}) {
  const [locked, setLocked] = useState<{ attemptsRequired: number; hintsRequired: number; minMinutes: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/solution`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attempts, hintsUsed, minutes }),
      }).then((r) => r.json());
      if (res.data) onReveal(res.data.patch, res.data.explanation);
      else if (res.error?.details) setLocked(res.error.details);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.hintStack}>
      <button type="button" className={s.ghostBtn} onClick={request} disabled={busy}>
        Хариулт харах
      </button>
      {locked ? (
        <span className={s.gateNote}>
          Хариултыг харахын тулд: {locked.attemptsRequired}+ удаа оролдох (одоо {attempts}), бүх заавар үзэх ({hintsUsed}/
          {locked.hintsRequired}), {locked.minMinutes}+ минут ажиллах.
        </span>
      ) : null}
    </div>
  );
}
