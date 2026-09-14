"use client";

import { useEffect, useMemo } from "react";
import { X, ArrowRightLeft, Lightbulb } from "lucide-react";
import type { FileSet } from "@khiye/preview";
import { lineDiff, differs } from "@/lib/diff";
import s from "./learn.module.css";

interface Row {
  left: string | null;
  right: string | null;
  kind: "same" | "del" | "add";
}

/**
 * Side-by-side comparison of the student's code and the reference solution.
 * Rows are aligned from a line diff: a line only you wrote sits on the left
 * (red), a line only the answer has sits on the right (green), shared lines
 * face each other. Opens as a wide modal so both files are readable at once.
 */
export function SolutionCompare({
  mine,
  solution,
  explanation,
  targetFile,
  onApply,
  onClose,
}: {
  mine: FileSet;
  solution: FileSet;
  explanation: { mn: string };
  targetFile?: string;
  onApply: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const files = useMemo(() => {
    const paths = Object.keys(solution).filter((p) => differs(mine[p]?.content ?? "", solution[p]?.content ?? ""));
    paths.sort((a, b) => (a === targetFile ? -1 : b === targetFile ? 1 : 0));
    return paths.map((p) => {
      const rows: Row[] = lineDiff(mine[p]?.content ?? "", solution[p]?.content ?? "").map((op) =>
        op.type === "same"
          ? { left: op.text, right: op.text, kind: "same" as const }
          : op.type === "del"
            ? { left: op.text, right: null, kind: "del" as const }
            : { left: null, right: op.text, kind: "add" as const },
      );
      return { path: p, rows };
    });
  }, [mine, solution, targetFile]);

  return (
    <div className={s.cmpOverlay} onClick={onClose}>
      <div className={s.cmpModal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Код харьцуулах">
        <header className={s.cmpHead}>
          <span className={s.cmpTitle}>
            <ArrowRightLeft size={16} strokeWidth={2.2} /> Код харьцуулах
          </span>
          <button type="button" className={s.cmpClose} onClick={onClose} aria-label="Хаах">
            <X size={18} />
          </button>
        </header>

        <p className={s.cmpExplain}>
          <Lightbulb size={14} strokeWidth={2.2} className={s.cmpExplainIcon} />
          <span>{explanation.mn}</span>
        </p>

        <div className={s.cmpColsHead}>
          <span className={s.cmpColMine}>Таны код</span>
          <span className={s.cmpColAns}>Зөв хариу</span>
        </div>

        <div className={s.cmpBody}>
          {files.length === 0 ? (
            <p className={s.compareSame}>Таны код зөв хариутай ижил байна 🎉</p>
          ) : (
            files.map(({ path, rows }) => (
              <div key={path} className={s.cmpFile}>
                <div className={s.cmpFileName}>{path}</div>
                {rows.map((r, i) => (
                  <div key={i} className={s.cmpRow}>
                    <pre className={`${s.cmpCell} ${r.kind === "del" ? s.cmpDel : ""}`}>
                      <code>{r.left ?? ""}</code>
                    </pre>
                    <pre className={`${s.cmpCell} ${r.kind === "add" ? s.cmpAdd : ""}`}>
                      <code>{r.right ?? ""}</code>
                    </pre>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <footer className={s.cmpActions}>
          <button type="button" className={s.primaryBtn} onClick={onApply}>
            Зөв хариуг кодод буулгах
          </button>
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            Өөрөө засъя
          </button>
        </footer>
      </div>
    </div>
  );
}
