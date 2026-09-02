"use client";

export interface CheckRow {
  key: string;
  passed: boolean;
  actual?: string;
  expected?: string;
  onFail?: string;
  errorKind?: string;
}

export interface SubmitResult {
  passed: boolean;
  checks: CheckRow[];
  feedback: { headline: string; body?: string };
  xpAwarded: number;
}

export function ResultPanel({
  result,
  onDismiss,
  onNext,
  isLastTask,
}: {
  result: SubmitResult;
  onDismiss: () => void;
  onNext: () => void;
  isLastTask: boolean;
}) {
  const firstFailIdx = result.checks.findIndex((c) => !c.passed && c.errorKind !== "infra");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <strong style={{ fontSize: 16, color: result.passed ? "var(--success)" : "var(--text)" }}>
          {result.feedback.headline}
        </strong>
        {result.passed ? <span style={{ marginLeft: "auto", color: "var(--xp)", fontWeight: 600 }}>+{result.xpAwarded} XP</span> : null}
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {result.checks.map((c, i) => {
          const expanded = !c.passed && i === firstFailIdx;
          return (
            <li key={c.key} style={{ fontSize: 13.5 }}>
              <div style={{ display: "flex", gap: 8, color: c.passed ? "var(--success)" : "var(--danger)" }}>
                <span aria-hidden>{c.passed ? "✓" : "✗"}</span>
                <span style={{ color: "var(--text)" }}>{c.passed ? "Шалгалт давлаа" : c.onFail ?? "Шалгалт давсангүй"}</span>
              </div>
              {expanded && (c.actual || c.expected) ? (
                <div style={{ marginLeft: 20, marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                  {c.actual ? <div>Таны үр дүн: <b style={{ color: "var(--text)" }}>{c.actual}</b></div> : null}
                  {c.expected ? <div>Хүлээгдсэн: <b style={{ color: "var(--text)" }}>{c.expected}</b></div> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div style={{ display: "flex", gap: 8 }}>
        {result.passed ? (
          <button onClick={onNext} style={btn("primary")}>
            {isLastTask ? "Хичээл дуусгах →" : "Дараагийн даалгавар →"}
          </button>
        ) : (
          <button onClick={onDismiss} style={btn("secondary")}>Дахин оролдох</button>
        )}
      </div>
    </div>
  );
}

function btn(variant: "primary" | "secondary"): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 6,
    border: variant === "primary" ? 0 : "1px solid var(--border-strong)",
    background: variant === "primary" ? "var(--accent)" : "var(--surface)",
    color: variant === "primary" ? "var(--on-accent)" : "var(--text)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  };
}
