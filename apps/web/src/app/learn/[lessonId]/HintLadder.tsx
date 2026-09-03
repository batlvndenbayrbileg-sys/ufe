"use client";

import { useState } from "react";
import s from "./learn.module.css";

interface HintMeta {
  level: number;
  xpCost: number;
}
interface LoadedHint {
  level: number;
  text: { mn: string };
  code?: string;
}

export function HintLadder({
  taskId,
  hints,
  onHintViewed,
}: {
  taskId: string;
  hints: HintMeta[];
  onHintViewed?: (level: number) => void;
}) {
  const [loaded, setLoaded] = useState<LoadedHint[]>([]);
  const [busy, setBusy] = useState(false);
  const nextLevel = loaded.length + 1;
  const canRequest = nextLevel <= hints.length;
  const cost = hints[nextLevel - 1]?.xpCost ?? 0;

  const request = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/hint`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ level: nextLevel }),
      }).then((r) => r.json());
      if (res.data) {
        setLoaded((l) => [...l, res.data]);
        onHintViewed?.(nextLevel);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.hintStack}>
      {loaded.map((h) => (
        <div key={h.level} className={s.hint}>
          <div className={s.hintLabel}>Заавар {h.level}</div>
          {h.text.mn}
          {h.code ? <pre className={s.hintCode}><code>{h.code}</code></pre> : null}
        </div>
      ))}
      {canRequest ? (
        <button type="button" className={s.ghostBtn} onClick={request} disabled={busy}>
          💡 Заавар авах{cost > 0 ? ` (−${cost} XP)` : ""}
        </button>
      ) : (
        <span className={s.gateNote}>Бүх заавар харагдлаа.</span>
      )}
    </div>
  );
}
