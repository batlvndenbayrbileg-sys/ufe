"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  PartyPopper,
  Trophy,
  Circle,
  CircleCheckBig,
  Eye,
  ChevronRight,
  Hammer,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { WorkspaceShell, Badge, ProgressRing, ThemeToggle, useTheme } from "@khiye/ui";
import { EditorPane, workspaceStore, useWorkspace, type CodeMirrorHandle } from "@khiye/editor";
import { PreviewFrame, type ConsoleEntry, type FileSet } from "@khiye/preview";
import { applyPatch } from "@khiye/content-sdk/patch";
import type { LessonPublic } from "@/lib/content";
import { awardBadge, recordTaskPass } from "@/lib/progress";
import { badgeLabel } from "@/lib/badges";
import { ResultPanel, type SubmitResult } from "./ResultPanel";
import { HintLadder } from "./HintLadder";
import { SolutionGate } from "./SolutionGate";
import { QuizPanel } from "./QuizPanel";
import s from "./learn.module.css";

type Status = "current" | "passed" | "locked";

export interface NextLesson {
  id: string;
  title: { mn: string };
}

export function LearnWorkspace({ lesson, next }: { lesson: LessonPublic; next?: NextLesson | null }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const editorRef = useRef<CodeMirrorHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const tasks = lesson.tasks;

  const [taskIndex, setTaskIndex] = useState(0);
  const [statuses, setStatuses] = useState<Status[]>(() => tasks.map((_, i) => (i === 0 ? "current" : "locked")));
  const [attempts, setAttempts] = useState<number[]>(() => tasks.map(() => 0));
  const [hintsUsed, setHintsUsed] = useState<number[]>(() => tasks.map(() => 0));
  const [startedAt] = useState<number[]>(() => tasks.map(() => Date.now()));
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [pasteHint, setPasteHint] = useState(false);
  const pasteHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPasteBlocked = useCallback(() => {
    setPasteHint(true);
    if (pasteHintTimer.current) clearTimeout(pasteHintTimer.current);
    pasteHintTimer.current = setTimeout(() => setPasteHint(false), 2600);
  }, []);
  useEffect(() => () => { if (pasteHintTimer.current) clearTimeout(pasteHintTimer.current); }, []);

  // Interactive concept cards: which ones are expanded.
  const [openConcepts, setOpenConcepts] = useState<Record<string, boolean>>({});
  const toggleConcept = useCallback(
    (slug: string) => setOpenConcepts((o) => ({ ...o, [slug]: !o[slug] })),
    [],
  );

  const task = tasks[taskIndex]!;
  const files = useWorkspace((st) => st.files) as FileSet;
  const solved = statuses[taskIndex] === "passed";

  useEffect(() => {
    const initial = applyPatch({}, lesson.workspace.patch) as FileSet;
    workspaceStore.getState().init({
      courseId: `lesson:${lesson.id}`,
      files: initial,
      visibleFiles: lesson.workspace.visibleFiles,
      readOnlyFiles: lesson.workspace.readOnlyFiles ?? [],
      openFiles: lesson.workspace.openFiles,
      activeFile: lesson.workspace.activeFile,
    });
  }, [lesson.id, lesson.workspace]);

  useEffect(() => {
    if (task.targetFile) workspaceStore.getState().setActive(task.targetFile);
    const t = setTimeout(() => {
      if (task.marker) editorRef.current?.scrollToMarker(task.marker);
    }, 140);
    return () => clearTimeout(t);
  }, [taskIndex, task.marker, task.targetFile]);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          files: workspaceStore.getState().files,
          attemptNo: attempts[taskIndex]! + 1,
          hintsUsed: hintsUsed[taskIndex],
          durationMs: Date.now() - startedAt[taskIndex]!,
        }),
      }).then((r) => r.json());
      const data = res.data as SubmitResult | undefined;
      if (!data) return;
      setResult(data);
      if (data.passed) {
        recordTaskPass(task.id, data.xpAwarded, task.skills);
        const next = statuses.map((st, i) => (i === taskIndex ? ("passed" as Status) : st));
        setStatuses(next);
        if (next.every((st) => st === "passed") && lesson.completion.badge) {
          awardBadge(lesson.completion.badge);
        }
      } else {
        setAttempts((a) => a.map((n, i) => (i === taskIndex ? n + 1 : n)));
      }
    } finally {
      setChecking(false);
    }
  }, [task.id, task.skills, taskIndex, attempts, hintsUsed, startedAt, statuses, lesson.completion.badge]);

  const nextTask = useCallback(() => {
    setResult(null);
    if (taskIndex < tasks.length - 1) {
      const ni = taskIndex + 1;
      setStatuses((st) => st.map((v, i) => (i === ni ? "current" : v)));
      setTaskIndex(ni);
    }
  }, [taskIndex, tasks.length]);

  const revealSolution = useCallback((patch: unknown) => {
    workspaceStore.getState().applyContentPatch(patch as never, { force: true });
  }, []);

  const passedCount = statuses.filter((v) => v === "passed").length;
  const percent = Math.round((passedCount / tasks.length) * 100);
  const lessonDone = passedCount === tasks.length;

  // The verdict must be visible the moment it arrives.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        void check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check]);

  const header = useMemo(
    () => (
      <>
        <a href={`/app/course/${"internet-programming"}`} className={s.back}>
          ← Хичээлүүд
        </a>
        <span className={s.lessonTitle}>{lesson.title.mn}</span>
        <div className={s.pips} role="img" aria-label={`${passedCount}/${tasks.length} даалгавар`}>
          {statuses.map((v, i) => (
            <span key={i} className={`${s.pip} ${v === "passed" ? s.pipDone : v === "current" ? s.pipCurrent : ""}`} />
          ))}
        </div>
        <div className={s.headerRight}>
          <span className={s.percentPill}>{percent}%</span>
          <ThemeToggle />
        </div>
      </>
    ),
    [lesson.title.mn, statuses, percent, passedCount, tasks.length],
  );

  return (
    <WorkspaceShell
      storageKey={`khiye-panes-${lesson.id}`}
      header={header}
      collapsedRail={<span style={{ writingMode: "vertical-rl", fontSize: 12, color: "var(--text-muted)" }}>Заавар</span>}
      instructions={
        <div className={s.pane}>
          {/* Lesson framing: what you're building here, and why it matters. */}
          <div className={s.lessonIntro}>
            <span className={s.lessonIntroIcon} aria-hidden>
              <Hammer size={18} strokeWidth={2.2} />
            </span>
            <div className={s.lessonIntroText}>
              <span className={s.lessonIntroLabel}>Юу барих вэ</span>
              <span className={s.lessonIntroBuild}>{lesson.buildsInProject}</span>
              <p className={s.lessonIntroWhy}>{lesson.why.mn}</p>
            </div>
          </div>

          <div className={s.taskHead}>
            <span className={s.taskBadge} aria-hidden>
              {taskIndex + 1}
            </span>
            <div className={s.eyebrow}>
              Даалгавар {taskIndex + 1}/{tasks.length}
            </div>
            <h1 className={s.taskTitle}>{task.title.mn}</h1>
          </div>

          {/* Verdict first, then — if that was the last task — the way out of
              the lesson, right where the student is already looking. */}
          {result ? (
            <div ref={resultRef}>
              <ResultPanel
                result={result}
                onDismiss={() => setResult(null)}
                onNext={nextTask}
                isLastTask={taskIndex === tasks.length - 1}
              />
            </div>
          ) : null}

          {lessonDone && lesson.quiz.length > 0 ? (
            <QuizPanel lessonId={lesson.id} quiz={lesson.quiz} />
          ) : null}

          {lessonDone ? (
            <div className={s.completion}>
              <span className={s.completionTitle}>
                <PartyPopper size={18} strokeWidth={2.2} /> Хичээл дууслаа!
              </span>
              {lesson.completion.badge ? <Badge tone="success" size="md">{badgeLabel(lesson.completion.badge)}</Badge> : null}
              {next ? (
                <a href={`/learn/${next.id}`} className={s.completionNext}>
                  Дараагийн хичээл: {next.title.mn} →
                </a>
              ) : (
                <span className={s.completionDone}>
                  <Trophy size={16} strokeWidth={2.2} /> Энэ курсын сүүлчийн хичээл байлаа. Баяр хүргэе!
                </span>
              )}
              <a href="/app/course/internet-programming" className={s.back}>
                Бүх хичээл
              </a>
            </div>
          ) : null}

          <p className={s.statement} dangerouslySetInnerHTML={{ __html: mdInline(task.statement.mn) }} />

          {task.requirements?.length ? (
            <ul className={s.reqList}>
              {task.requirements.map((r, i) => (
                <li key={i} className={`${s.req} ${solved ? s.reqDone : ""}`}>
                  <span className={s.reqIcon} aria-hidden>
                    {solved ? <CircleCheckBig size={16} strokeWidth={2.2} /> : <Circle size={16} strokeWidth={2} />}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: mdInline(r.mn) }} />
                </li>
              ))}
            </ul>
          ) : null}

          {task.expected?.description ? (
            <div className={s.expected}>
              <span className={s.expectedLabel}>
                <Eye size={15} strokeWidth={2.2} /> Хүлээгдэх үр дүн
              </span>
              <span className={s.expectedText}>{task.expected.description.mn}</span>
            </div>
          ) : null}

          {lesson.conceptNotes.length ? (
            <section className={s.concepts}>
              <div className={s.conceptsHead}>
                <BookOpen size={16} strokeWidth={2.2} />
                <span>Шинэ ойлголтууд</span>
                <span className={s.conceptsCount}>{lesson.conceptNotes.length}</span>
                <span className={s.conceptsHint}>дэлгэрэнгүйг товшино уу</span>
              </div>
              <div className={s.conceptList}>
                {lesson.conceptNotes.map((c) => {
                  const open = !!openConcepts[c.slug];
                  return (
                    <div key={c.slug} className={`${s.concept} ${open ? s.conceptOpen : ""}`}>
                      <button
                        type="button"
                        className={s.conceptToggle}
                        aria-expanded={open}
                        onClick={() => toggleConcept(c.slug)}
                      >
                        <code className={s.conceptTerm}>{c.term}</code>
                        <span className={s.conceptWhat}>{c.what}</span>
                        <ChevronRight size={16} className={s.conceptChevron} aria-hidden />
                      </button>
                      <div className={s.conceptBody}>
                        <div className={s.conceptBodyInner}>
                          <p className={s.conceptWhy}>
                            <Lightbulb size={15} strokeWidth={2.2} className={s.conceptWhyIcon} />
                            <span>{c.why}</span>
                          </p>
                          {c.example ? (
                            <pre className={s.conceptExample}>
                              <code>{c.example}</code>
                            </pre>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {result ? null : (
            <>
              <HintLadder
                key={task.id}
                taskId={task.id}
                hints={task.hints}
                onHintViewed={(lvl) => setHintsUsed((h) => h.map((n, i) => (i === taskIndex ? Math.max(n, lvl) : n)))}
              />
              {attempts[taskIndex]! >= 2 ? (
                <SolutionGate
                  taskId={task.id}
                  attempts={attempts[taskIndex]!}
                  hintsUsed={hintsUsed[taskIndex]!}
                  minutes={Math.floor((Date.now() - startedAt[taskIndex]!) / 60000)}
                  onReveal={revealSolution}
                />
              ) : null}
            </>
          )}

        </div>
      }
      editor={
        <div className={s.editorWrap}>
          <EditorPane
            ref={editorRef}
            dark={dark}
            showTree
            showKeyStrip
            blockPaste
            onPasteBlocked={onPasteBlocked}
          />
          <div className={`${s.pasteToast} ${pasteHint ? s.pasteToastShow : ""}`} role="status" aria-live="polite">
            Кодоо өөрөө бичээрэй — хуулж тавих боломжгүй.
          </div>
        </div>
      }
      preview={
        <div className={s.previewCol}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PreviewFrame
              files={files}
              entry={lesson.execution.entry}
              sqliteUrl={lesson.execution.runtime === "sqlite" ? "/lib/sqlite.js" : undefined}
              reactRuntimeUrl="/lib/react-runtime.js"
              onConsole={(e) => setLogs((l) => [...l.slice(-40), e])}
            />
          </div>
          {logs.length ? (
            <div className={s.consoleStrip}>
              {logs.map((l, i) => (
                <div key={i} className={l.level === "error" ? s.consoleErr : undefined}>
                  {l.args.join(" ")}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      }
      actionBar={
        <>
          <ProgressRing value={percent} size={34} showLabel={false} />
          <span className={s.barLabel}>
            {passedCount}/{tasks.length} даалгавар
          </span>
          <div className={s.barRight}>
            <span className={s.kbd}>Ctrl + Enter</span>
            <button type="button" className={s.primaryBtn} onClick={check} disabled={checking || solved}>
              {checking ? null : <Check size={17} strokeWidth={2.6} />}
              {checking ? "Шалгаж байна…" : solved ? "Давсан" : "Шалгах"}
            </button>
          </div>
        </>
      }
    />
  );
}

/** Inline markdown: `code` spans only (statements are short and controlled). */
function mdInline(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/`([^`]+)`/g, "<code>$1</code>");
}
