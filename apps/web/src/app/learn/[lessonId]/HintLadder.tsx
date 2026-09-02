"use client";

import { useState } from "react";

interface HintMeta {
  level: number;
  xpCost: number;
}
interface LoadedHint {
  level: number;
  text: { mn: string };
  code?: string;
}

export function HintLadder({ taskId, hints }: { taskId: string; hints: HintMeta[] }) {
  const [loaded, setLoaded] = useState<LoadedHint[]>([]);
  const [busy, setBusy] = useState(false);
  const nextLevel = loaded.length + 1;
  const canRequest = nextLevel <= hints.length;

  const request = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/hint`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ level: nextLevel }),
      }).then((r) => r.json());
      if (res.data) setLoaded((l) => [...l, res.data]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {loaded.map((h) => (
        <div key={h.level} style={{ padding: "8px 12px", background: "var(--warning-subtle)", borderLeft: "3px solid var(--warning)", borderRadius: "0 6px 6px 0", fontSize: 13.5 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Заавар {h.level}</div>
          {h.text.mn}
          {h.code ? (
            <pre style={{ marginTop: 6, padding: 8, background: "var(--code-bg)", borderRadius: 4, overflowX: "auto", fontSize: 12 }}>
              <code>{h.code}</code>
            </pre>
          ) : null}
        </div>
      ))}
      {canRequest ? (
        <button onClick={request} disabled={busy} style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", fontSize: 13 }}>
          💡 Заавар авах {hints[nextLevel - 1]?.xpCost ? `(−${hints[nextLevel - 1]!.xpCost} XP)` : ""}
        </button>
      ) : (
        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>Бүх заавар харагдлаа.</span>
      )}
    </div>
  );
}
