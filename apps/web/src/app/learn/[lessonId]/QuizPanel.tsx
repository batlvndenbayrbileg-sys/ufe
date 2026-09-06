"use client";

import { useState } from "react";
import { Check, X, Circle, CircleDot, ListChecks } from "lucide-react";
import type { QuizQuestionPublic, QuizResult } from "@/lib/content";
import s from "./learn.module.css";

/**
 * The concept check shown once a lesson's coding tasks are done. Options are
 * graded on the server (the answer key is never sent to the browser); on submit
 * each question shows the right answer and its explanation.
 */
export function QuizPanel({ lessonId, quiz }: { lessonId: string; quiz: QuizQuestionPublic[] }) {
  const [answers, setAnswers] = useState<number[]>(() => quiz.map(() => -1));
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);

  const allAnswered = answers.every((a) => a >= 0);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      }).then((r) => r.json());
      if (res.data) {
        setResults(res.data.results as QuizResult[]);
        setScore(res.data.score as number);
      }
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResults(null);
    setScore(0);
    setAnswers(quiz.map(() => -1));
  };

  return (
    <div className={s.quiz}>
      <div className={s.quizHead}>
        <span className={s.quizTitle}>
          <ListChecks size={18} strokeWidth={2.2} /> Ойлголтын шалгалт
        </span>
        {results ? (
          <span className={score === quiz.length ? s.quizScoreFull : s.quizScore}>
            {score}/{quiz.length}
          </span>
        ) : null}
      </div>

      {quiz.map((q, qi) => {
        const r = results?.[qi];
        return (
          <div key={q.id} className={s.quizQ}>
            <p className={s.quizQuestion}>
              {qi + 1}. {q.question.mn}
            </p>
            <div className={s.quizOptions} role="radiogroup" aria-label={q.question.mn}>
              {q.options.map((opt, oi) => {
                const chosen = answers[qi] === oi;
                let cls = s.quizOption;
                if (r) {
                  if (oi === r.correctIndex) cls = `${s.quizOption} ${s.quizCorrect}`;
                  else if (chosen) cls = `${s.quizOption} ${s.quizWrong}`;
                } else if (chosen) {
                  cls = `${s.quizOption} ${s.quizChosen}`;
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    disabled={!!results}
                    className={cls}
                    onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  >
                    <span className={s.quizBullet} aria-hidden>
                      {r && oi === r.correctIndex ? (
                        <Check size={15} strokeWidth={2.6} />
                      ) : r && chosen ? (
                        <X size={15} strokeWidth={2.6} />
                      ) : chosen ? (
                        <CircleDot size={15} />
                      ) : (
                        <Circle size={15} />
                      )}
                    </span>
                    {opt.mn}
                  </button>
                );
              })}
            </div>
            {r ? (
              <p className={`${s.quizExplain} ${r.correct ? s.quizExplainOk : s.quizExplainNo}`}>
                {r.explanation.mn}
              </p>
            ) : null}
          </div>
        );
      })}

      {results ? (
        <button type="button" className={s.ghostBtn} onClick={reset}>
          Дахин бөглөх
        </button>
      ) : (
        <button type="button" className={s.primaryBtn} disabled={!allAnswered || busy} onClick={submit}>
          {busy ? "Шалгаж байна…" : "Хариултаа шалгах"}
        </button>
      )}
    </div>
  );
}
