"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  PartyPopper,
  Circle,
  CircleCheckBig,
  Eye,
  ChevronRight,
  Hammer,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { WorkspaceShell, Badge, ProgressRing, ThemeToggle, useTheme } from "@khiye/ui";
import {
  EditorPane,
  workspaceStore,
  useWorkspace,
  hydrateWorkspace,
  persistWorkspace,
  type CodeMirrorHandle,
} from "@khiye/editor";
import { PreviewFrame, type ConsoleEntry, type FileSet } from "@khiye/preview";
import { applyPatch } from "@khiye/content-sdk/patch";
import type { LessonPublic } from "@/lib/content";
import { awardBadge, isTaskPassed, recordTaskPass } from "@/lib/progress";
import { getLessonResumeIndex, setResumePoint } from "@/lib/resume";
import { badgeLabel } from "@/lib/badges";
import { ResultPanel, type SubmitResult } from "./ResultPanel";

// Code-split: the 38 diagram schematics load as their own chunk, off the
// initial /learn bundle. They only render inside an expanded concept card.
const ConceptDiagram = dynamic(
  () => import("./ConceptDiagram").then((m) => ({ default: m.ConceptDiagram })),
  { ssr: false },
);
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

  // Reading comfort: the student can scale the instruction text up or down; the
  // choice is remembered across lessons.
  const [zaawarScale, setZaawarScale] = useState(1);
  useEffect(() => {
    try {
      const v = parseFloat(localStorage.getItem("khiye:zaawar-scale") ?? "1");
      if (v >= 0.9 && v <= 1.8) setZaawarScale(v);
    } catch {
      /* storage blocked — keep the default */
    }
  }, []);
  const changeScale = useCallback((delta: number) => {
    setZaawarScale((s) => {
      const next = Math.min(1.8, Math.max(0.9, Math.round((s + delta) * 100) / 100));
      try {
        localStorage.setItem("khiye:zaawar-scale", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
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
    const courseId = `lesson:${lesson.id}`;
    workspaceStore.getState().init({
      courseId,
      files: initial,
      visibleFiles: lesson.workspace.visibleFiles,
      readOnlyFiles: lesson.workspace.readOnlyFiles ?? [],
      openFiles: lesson.workspace.openFiles,
      activeFile: lesson.workspace.activeFile,
    });
    // Resume the learner's own code: restore anything saved for this lesson over
    // the starter, then keep saving as they type. So leaving mid-task and coming
    // back reopens exactly what they had written.
    let unsub = () => {};
    void hydrateWorkspace(workspaceStore, courseId).finally(() => {
      unsub = persistWorkspace(workspaceStore, courseId);
    });
    return () => unsub();
  }, [lesson.id, lesson.workspace]);

  // Restore progress + the task the learner had reached: passed tasks show as
  // done and the workspace opens on the first unsolved task (or where they left
  // off), instead of always restarting at task 1.
  useEffect(() => {
    const passedFlags = tasks.map((t) => isTaskPassed(t.id));
    const firstUnsolved = passedFlags.findIndex((p) => !p);
    const saved = getLessonResumeIndex(lesson.id);
    const current = firstUnsolved === -1 ? tasks.length - 1 : firstUnsolved;
    // Prefer the saved spot when it's still an unsolved task at/after `current`.
    const target = saved > current && saved < tasks.length && !passedFlags[saved] ? saved : current;
    setStatuses(tasks.map((_, i) => (passedFlags[i] ? "passed" : i === target ? "current" : "locked")));
    setTaskIndex(target);
  }, [lesson.id, tasks]);

  // Remember where the learner is so the dashboard's "continue" and this
  // workspace can bring them straight back here next time.
  useEffect(() => {
    setResumePoint({ lessonId: lesson.id, courseSlug: lesson.courseSlug, taskIndex });
  }, [taskIndex, lesson.id, lesson.courseSlug]);

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
        const hUsed = hintsUsed[taskIndex] ?? 0;
        recordTaskPass(task.id, data.xpAwarded, task.skills, {
          durationMs: Date.now() - startedAt[taskIndex]!,
          hintsUsed: hUsed,
          attempts: (attempts[taskIndex] ?? 0) + 1,
          assisted: hUsed > 0,
        });
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
        <a href={`/app/course/${lesson.courseSlug}`} className={s.back}>
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
        <div className={s.pane} style={{ "--zaawar-scale": zaawarScale } as CSSProperties}>
          {/* Reading-comfort control: scale the guide text up or down. */}
          <div className={s.zoomBar}>
            <span className={s.zoomLabel}>Бичвэрийн хэмжээ</span>
            <div className={s.zoomBtns}>
              <button
                type="button"
                className={s.zoomBtn}
                onClick={() => changeScale(-0.1)}
                disabled={zaawarScale <= 0.9}
                aria-label="Бичвэр багасгах"
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>A</span>
              </button>
              <span className={s.zoomPct}>{Math.round(zaawarScale * 100)}%</span>
              <button
                type="button"
                className={s.zoomBtn}
                onClick={() => changeScale(0.1)}
                disabled={zaawarScale >= 1.8}
                aria-label="Бичвэр томосгох"
              >
                <span style={{ fontSize: 18, fontWeight: 700 }}>A</span>
              </button>
            </div>
          </div>

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
                nextLessonHref={next ? `/learn/${next.id}` : null}
                nextLessonTitle={next?.title.mn}
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
              {/* The forward step (next lesson / course-finished) lives in the
                  result panel above, right where the student just clicked. */}
              <a href={`/app/course/${lesson.courseSlug}`} className={s.back}>
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
                          {c.analogy ? (
                            <p className={s.conceptAnalogy}>
                              <span className={s.conceptAnalogyTag}>Энгийнээр</span>
                              <span>{c.analogy}</span>
                            </p>
                          ) : null}
                          {c.diagram ? (
                            <div className={s.conceptDiagram}>
                              <ConceptDiagram kind={c.diagram} />
                            </div>
                          ) : null}
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
              reactNativeRuntimeUrl="/lib/rn-runtime.js"
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
