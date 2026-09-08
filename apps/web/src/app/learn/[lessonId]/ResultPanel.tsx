"use client";

import { Check, X } from "lucide-react";
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
  nextLessonHref,
  nextLessonTitle,
}: {
  result: SubmitResult;
  onDismiss: () => void;
  onNext: () => void;
  isLastTask: boolean;
  /** Where "next lesson" goes once the last task passes; null on the final lesson. */
  nextLessonHref?: string | null;
  nextLessonTitle?: string;
}) {
  const isSystem = (k?: string) => k === "infra" || k === "timeout";
  const firstFailIdx = result.checks.findIndex((c) => !c.passed && !isSystem(c.errorKind));
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
                  {c.passed ? <Check size={16} strokeWidth={2.6} /> : <X size={16} strokeWidth={2.6} />}
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

      <div className={s.resultActions}>
        {result.passed ? (
          isLastTask ? (
            nextLessonHref ? (
              <a href={nextLessonHref} className={s.primaryBtn}>
                Дараагийн хичээл{nextLessonTitle ? `: ${nextLessonTitle}` : ""} →
              </a>
            ) : (
              <span className={s.resultDone}>Курсын сүүлчийн хичээл дууслаа 🏆</span>
            )
          ) : (
            <button type="button" className={s.primaryBtn} onClick={onNext}>
              Дараагийн даалгавар →
            </button>
          )
        ) : (
          <button type="button" className={s.ghostBtn} onClick={onDismiss}>
            Дахин оролдох
          </button>
        )}
      </div>
    </div>
  );
}
