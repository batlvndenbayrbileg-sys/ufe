"use client";

import { useState } from "react";
import { Check, X, Circle, CircleDot, ListChecks, Lightbulb, PartyPopper } from "lucide-react";
import type { QuizQuestionPublic, QuizResult } from "@/lib/content";
import s from "./learn.module.css";

/**
 * The concept check shown once a lesson's coding tasks are done. Options are
 * graded on the server (the answer key is never sent to the browser); on submit
 * each question shows the right answer and its explanation. Before answering, a
 * question can offer a hint the student reveals themselves; a full score is met
 * with a small celebration.
 */
export function QuizPanel({ lessonId, quiz }: { lessonId: string; quiz: QuizQuestionPublic[] }) {
  const [answers, setAnswers] = useState<number[]>(() => quiz.map(() => -1));
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hintsShown, setHintsShown] = useState<Record<number, boolean>>({});

  const answeredCount = answers.filter((a) => a >= 0).length;
  const allAnswered = answeredCount === quiz.length;
  // Before submit the bar tracks how many are answered; after, the score.
  const progressPct = results
    ? (score / quiz.length) * 100
    : (answeredCount / quiz.length) * 100;
  const perfect = results != null && score === quiz.length;

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
    setHintsShown({});
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
        ) : (
          <span className={s.quizScore}>
            {answeredCount}/{quiz.length}
          </span>
        )}
      </div>

      <div className={s.quizProgress} aria-hidden>
        <div className={s.quizProgressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {quiz.map((q, qi) => {
        const r = results?.[qi];
        const hintOpen = hintsShown[qi];
        return (
          <div key={q.id} className={s.quizQ}>
            <p className={s.quizQuestion}>
              {qi + 1}. {q.question.mn}
            </p>

            {/* A hint the student chooses to reveal, only before grading. */}
            {q.hint && !results ? (
              hintOpen ? (
                <p className={s.quizHint}>
                  <Lightbulb size={15} strokeWidth={2.2} className={s.quizHintIcon} aria-hidden />
                  <span>{q.hint.mn}</span>
                </p>
              ) : (
                <button
                  type="button"
                  className={s.quizHintBtn}
                  onClick={() => setHintsShown((h) => ({ ...h, [qi]: true }))}
                >
                  <Lightbulb size={15} strokeWidth={2.2} /> Санамж харах
                </button>
              )
            ) : null}
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

      {perfect ? (
        <div className={s.quizCelebrate} role="status">
          <PartyPopper size={30} strokeWidth={1.8} className={s.quizCelebrateIcon} aria-hidden />
          <span className={s.quizCelebrateTitle}>Бүгд зөв! 🎉</span>
          <span className={s.quizCelebrateBody}>Энэ хичээлийн ойлголтыг бүрэн эзэмшлээ.</span>
        </div>
      ) : null}

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
