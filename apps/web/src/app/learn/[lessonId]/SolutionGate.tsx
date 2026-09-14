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

  // Mirror of the server gate (api/tasks/[taskId]/solution) — for a clear,
  // proactive "here's what unlocks it" hint before the student even clicks.
  const REQ = { attempts: 2, minutes: 1 };
  const ready = attempts >= REQ.attempts && minutes >= REQ.minutes;

  return (
    <div className={s.hintStack}>
      <button type="button" className={s.ghostBtn} onClick={request} disabled={busy}>
        Зөв хариуг харах ба харьцуулах
      </button>
      {ready ? (
        <span className={s.gateNote}>Хариу харвал энэ даалгаврын XP багасна.</span>
      ) : (
        <span className={s.gateNote}>
          Түгжээтэй — оролдлого {Math.min(attempts, REQ.attempts)}/{REQ.attempts} ·{" "}
          {Math.min(minutes, REQ.minutes)}/{REQ.minutes} мин болмогц нээгдэнэ.
        </span>
      )}
      {locked ? (
        <span className={s.gateNote}>
          Хараахан болоогүй: {locked.attemptsRequired}+ удаа оролдох (одоо {attempts}), {locked.minMinutes}+ минут ажиллах.
        </span>
      ) : null}
    </div>
  );
}
