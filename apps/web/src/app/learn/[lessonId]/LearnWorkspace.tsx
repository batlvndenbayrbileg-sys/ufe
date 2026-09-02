"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceShell, Badge, ProgressRing, ThemeToggle, useTheme } from "@khiye/ui";
import { EditorPane, workspaceStore, useWorkspace, type CodeMirrorHandle } from "@khiye/editor";
import { PreviewFrame, type ConsoleEntry, type FileSet } from "@khiye/preview";
import { applyPatch } from "@khiye/content-sdk/patch";
import type { LessonPublic } from "@/lib/content";
import { ResultPanel, type SubmitResult } from "./ResultPanel";
import { HintLadder } from "./HintLadder";
import { SolutionGate } from "./SolutionGate";

type Status = "current" | "passed" | "locked";

export function LearnWorkspace({ lesson }: { lesson: LessonPublic }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const editorRef = useRef<CodeMirrorHandle>(null);
  const tasks = lesson.tasks;

  const [taskIndex, setTaskIndex] = useState(0);
  const [statuses, setStatuses] = useState<Status[]>(() => tasks.map((_, i) => (i === 0 ? "current" : "locked")));
  const [attempts, setAttempts] = useState<number[]>(() => tasks.map(() => 0));
  const [hintsUsed] = useState<number[]>(() => tasks.map(() => 0));
  const [startedAt] = useState<number[]>(() => tasks.map(() => Date.now()));
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);

  const task = tasks[taskIndex]!;
  const files = useWorkspace((s) => s.files) as FileSet;

  // Init the workspace once from the lesson's workspace patch.
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
  }, [lesson.id]);

  // Jump to the current task's marker.
  useEffect(() => {
    if (task.targetFile) workspaceStore.getState().setActive(task.targetFile);
    const t = setTimeout(() => {
      if (task.marker) editorRef.current?.scrollToMarker(task.marker);
    }, 120);
    return () => clearTimeout(t);
  }, [taskIndex, task.marker, task.targetFile]);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const current = workspaceStore.getState().files;
      const res = await fetch(`/api/tasks/${task.id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          files: current,
          attemptNo: attempts[taskIndex]! + 1,
          hintsUsed: hintsUsed[taskIndex],
          durationMs: Date.now() - startedAt[taskIndex]!,
        }),
      }).then((r) => r.json());
      const data = res.data as SubmitResult | undefined;
      if (!data) return;
      setResult(data);
      if (data.passed) {
        setStatuses((s) => s.map((st, i) => (i === taskIndex ? "passed" : st)));
      } else {
        setAttempts((a) => a.map((n, i) => (i === taskIndex ? n + 1 : n)));
      }
    } finally {
      setChecking(false);
    }
  }, [task.id, taskIndex, attempts, hintsUsed, startedAt]);

  const nextTask = useCallback(() => {
    setResult(null);
    if (taskIndex < tasks.length - 1) {
      const ni = taskIndex + 1;
      setStatuses((s) => s.map((st, i) => (i === ni ? "current" : st)));
      setTaskIndex(ni);
    }
  }, [taskIndex, tasks.length]);

  const revealSolution = useCallback((patch: unknown, _explanation: { mn: string }) => {
    workspaceStore.getState().applyContentPatch(patch as never, { force: true });
  }, []);

  const passedCount = statuses.filter((s) => s === "passed").length;
  const percent = Math.round((passedCount / tasks.length) * 100);
  const lessonDone = passedCount === tasks.length;

  // Ctrl+Enter run (auto for tier1) / Ctrl+Shift+Enter check.
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
        <a href="/app/course/ip-101" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13 }}>← Буцах</a>
        <strong style={{ fontSize: 14 }}>{lesson.title.mn}</strong>
        <TaskPips statuses={statuses} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{percent}%</span>
          <ThemeToggle />
        </div>
      </>
    ),
    [lesson.title.mn, statuses, percent],
  );

  return (
    <WorkspaceShell
      storageKey={`khiye-panes-${lesson.id}`}
      header={header}
      collapsedRail={<span style={{ writingMode: "vertical-rl", fontSize: 12 }}>Заавар</span>}
      instructions={
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
              Даалгавар {taskIndex + 1}/{tasks.length}
            </div>
            <h2 style={{ fontSize: 18, margin: "6px 0 0" }}>{task.title.mn}</h2>
          </section>

          <p style={{ margin: 0, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: mdInline(task.statement.mn) }} />

          {task.requirements?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              {task.requirements.map((r, i) => (
                <li key={i} style={{ color: statuses[taskIndex] === "passed" ? "var(--success)" : "var(--text-muted)" }}>
                  {r.mn}
                </li>
              ))}
            </ul>
          ) : null}

          <details>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>Яагаад?</summary>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{lesson.why.mn}</p>
          </details>

          {task.expected?.description ? (
            <div style={{ padding: "10px 12px", background: "var(--bg-muted)", borderRadius: 6, fontSize: 13 }}>
              <b>Хүлээгдэж буй үр дүн:</b> {task.expected.description.mn}
            </div>
          ) : null}

          {result ? (
            <ResultPanel result={result} onDismiss={() => setResult(null)} onNext={nextTask} isLastTask={taskIndex === tasks.length - 1} />
          ) : (
            <>
              <HintLadder taskId={task.id} hints={task.hints} />
              {attempts[taskIndex]! >= 2 ? (
                <SolutionGate
                  taskId={task.id}
                  attempts={attempts[taskIndex]!}
                  hintsUsed={task.hints.length}
                  minutes={Math.floor((Date.now() - startedAt[taskIndex]!) / 60000)}
                  onReveal={revealSolution}
                />
              ) : null}
            </>
          )}

          {lessonDone ? (
            <div style={{ padding: 14, background: "var(--success-subtle)", borderRadius: 8, textAlign: "center" }}>
              🎉 <b>Хичээл дууслаа!</b>
              <div style={{ marginTop: 6 }}>
                <Badge tone="success">{lesson.completion.badge ?? "дуусгав"}</Badge>
              </div>
            </div>
          ) : null}
        </div>
      }
      editor={<EditorPane ref={editorRef} dark={dark} showTree showKeyStrip />}
      preview={
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PreviewFrame files={files} entry={lesson.execution.entry} onConsole={(e) => setLogs((l) => [...l.slice(-30), e])} />
          </div>
          {logs.length ? (
            <div style={{ height: 96, overflowY: "auto", background: "var(--code-bg)", color: "#ddd", fontFamily: "monospace", fontSize: 11, padding: 6 }}>
              {logs.map((l, i) => (
                <div key={i} style={{ color: l.level === "error" ? "#ff6b6b" : "#bbb" }}>{l.args.join(" ")}</div>
              ))}
            </div>
          ) : null}
        </div>
      }
      actionBar={
        <>
          <ProgressRing value={percent} size={36} showLabel={false} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{passedCount}/{tasks.length} даалгавар</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button
              onClick={check}
              disabled={checking || statuses[taskIndex] === "passed"}
              style={{ padding: "10px 22px", borderRadius: 8, border: 0, background: "var(--accent)", color: "var(--on-accent)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              {checking ? "Шалгаж байна…" : "✓ Шалгах"}
            </button>
          </div>
        </>
      }
    />
  );
}

function TaskPips({ statuses }: { statuses: Status[] }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {statuses.map((s, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: s === "passed" ? "var(--success)" : s === "current" ? "var(--accent)" : "var(--border-strong)",
          }}
        />
      ))}
    </div>
  );
}

/** Minimal inline markdown: `code` spans only (statements are short). */
function mdInline(s: string): string {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/`([^`]+)`/g, '<code style="background:var(--bg-muted);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:.9em">$1</code>');
}
