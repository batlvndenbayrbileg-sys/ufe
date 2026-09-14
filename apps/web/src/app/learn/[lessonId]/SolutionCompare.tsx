"use client";

import { useMemo } from "react";
import { X, ArrowRightLeft, Lightbulb } from "lucide-react";
import type { FileSet } from "@khiye/preview";
import { lineDiff, differs } from "@/lib/diff";
import s from "./learn.module.css";

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
  // Files that differ, target file first — that's what the task asked for.
  const files = useMemo(() => {
    const paths = Object.keys(solution).filter((p) => differs(mine[p]?.content ?? "", solution[p]?.content ?? ""));
    paths.sort((a, b) => (a === targetFile ? -1 : b === targetFile ? 1 : 0));
    return paths.map((p) => ({ path: p, ops: lineDiff(mine[p]?.content ?? "", solution[p]?.content ?? "") }));
  }, [mine, solution, targetFile]);

  return (
    <div className={s.compare}>
      <div className={s.compareHead}>
        <span className={s.compareTitle}>
          <ArrowRightLeft size={16} strokeWidth={2.2} /> Таны код ↔ Зөв хариу
        </span>
        <button type="button" className={s.compareClose} onClick={onClose} aria-label="Хаах">
          <X size={16} />
        </button>
      </div>

      <p className={s.compareExplain}>
        <Lightbulb size={14} strokeWidth={2.2} className={s.compareExplainIcon} />
        <span>{explanation.mn}</span>
      </p>

      <div className={s.compareLegend}>
        <span className={s.legDel}>− таны бичсэн</span>
        <span className={s.legAdd}>+ зөв хариу (дутуу/өөр)</span>
      </div>

      {files.length === 0 ? (
        <p className={s.compareSame}>Таны код зөв хариутай ижил байна 🎉</p>
      ) : (
        files.map(({ path, ops }) => (
          <div key={path} className={s.diffFile}>
            <div className={s.diffFileName}>{path}</div>
            <pre className={s.diff}>
              {ops.map((op, i) => (
                <div
                  key={i}
                  className={op.type === "add" ? s.diffAdd : op.type === "del" ? s.diffDel : s.diffSame}
                >
                  <span className={s.diffSign} aria-hidden>
                    {op.type === "add" ? "+" : op.type === "del" ? "−" : " "}
                  </span>
                  <code>{op.text || " "}</code>
                </div>
              ))}
            </pre>
          </div>
        ))
      )}

      <div className={s.compareActions}>
        <button type="button" className={s.primaryBtn} onClick={onApply}>
          Зөв хариуг кодод буулгах
        </button>
        <button type="button" className={s.ghostBtn} onClick={onClose}>
          Өөрөө засъя
        </button>
      </div>
    </div>
  );
}
