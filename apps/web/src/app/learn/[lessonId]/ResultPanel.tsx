"use client";

import s from "./learn.module.css";

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
  const passedCount = result.checks.filter((c) => c.passed).length;

  return (
    <div className={`${s.result} ${result.passed ? s.resultPass : s.resultFail}`} role="status" aria-live="polite">
      <div className={s.resultHead}>
        <span>{result.feedback.headline}</span>
        {result.passed ? (
          <span className={s.xpBadge}>+{result.xpAwarded} XP</span>
        ) : (
          <span className={s.xpBadge} style={{ color: "var(--text-muted)" }}>
            {passedCount}/{result.checks.length}
          </span>
        )}
      </div>

      <ul className={s.checkList}>
        {result.checks.map((c, i) => {
          const expanded = !c.passed && i === firstFailIdx;
          return (
            <li key={c.key} className={c.passed ? s.checkPass : s.checkFail}>
              <div className={s.checkRow}>
                <span className={s.checkMark} aria-hidden>
                  {c.passed ? "✓" : "✗"}
                </span>
                <span style={{ color: c.passed ? "var(--text-muted)" : "var(--text)" }}>
                  {c.passed ? "Шалгалт давлаа" : (c.onFail ?? "Шалгалт давсангүй")}
                </span>
              </div>
              {expanded && (c.actual || c.expected) ? (
                <div className={s.checkDetail}>
                  {c.actual ? (
                    <span>
                      Таны үр дүн: <b>{c.actual}</b>
                    </span>
                  ) : null}
                  {c.expected ? (
                    <span>
                      Хүлээгдсэн: <b>{c.expected}</b>
                    </span>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* On the last task the completion card is already on screen with the
          real next step; a second forward button here would only compete. */}
      {result.passed && isLastTask ? null : (
        <div className={s.resultActions}>
          {result.passed ? (
            <button type="button" className={s.primaryBtn} onClick={onNext}>
              Дараагийн даалгавар →
            </button>
          ) : (
            <button type="button" className={s.ghostBtn} onClick={onDismiss}>
              Дахин оролдох
            </button>
          )}
        </div>
      )}
    </div>
  );
}
