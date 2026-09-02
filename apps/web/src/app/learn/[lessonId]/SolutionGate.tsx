"use client";

import { useState } from "react";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button onClick={request} disabled={busy} style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>
        Хариулт харах
      </button>
      {locked ? (
        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
          Хариултыг харахын тулд: {locked.attemptsRequired}+ удаа оролдох ({attempts}), бүх заавар үзэх ({hintsUsed}/{locked.hintsRequired}), {locked.minMinutes}+ минут ажиллах шаардлагатай.
        </span>
      ) : null}
    </div>
  );
}
