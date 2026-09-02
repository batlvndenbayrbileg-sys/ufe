"use client";

import type { ConsoleEntry } from "@khiye/preview";

export interface ConsoleProps {
  entries: ConsoleEntry[];
  onClear?: () => void;
  /** Called for an error row's "Тайлбарлуулах 🤖" action (AI explainer, E9). */
  onExplain?: (entry: ConsoleEntry) => void;
}

const COLOR: Record<string, string> = {
  error: "var(--danger,#dc2626)",
  warn: "var(--warning,#d97706)",
  info: "var(--info,#0891b2)",
  debug: "var(--text-subtle,#a1a1aa)",
  log: "var(--text,#e4e4e7)",
};

export function Console({ entries, onClear, onExplain }: ConsoleProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--code-bg,#0d0d0f)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderBottom: "1px solid var(--code-border,#27272a)" }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-subtle,#a1a1aa)" }}>
          Console {entries.length ? `(${entries.length})` : ""}
        </span>
        {onClear ? (
          <button type="button" onClick={onClear} style={{ marginLeft: "auto", border: 0, background: "transparent", color: "var(--text-subtle,#a1a1aa)", cursor: "pointer", fontSize: 12 }}>
            Цэвэрлэх
          </button>
        ) : null}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 8, fontFamily: "var(--font-mono, monospace)", fontSize: 12, lineHeight: 1.6 }}>
        {entries.length === 0 ? <span style={{ color: "var(--text-subtle,#71717a)", opacity: 0.6 }}>—</span> : null}
        {entries.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", color: COLOR[e.level] ?? COLOR.log }}>
            <span style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{e.args.join(" ")}</span>
            {e.source?.line ? (
              <span style={{ color: "var(--text-subtle,#71717a)", fontSize: 11 }}>
                {e.source.file ? `${e.source.file.split("/").pop()}:` : ""}{e.source.line}
              </span>
            ) : null}
            {e.level === "error" && onExplain ? (
              <button type="button" onClick={() => onExplain(e)} title="Тайлбарлуулах" style={{ border: 0, background: "transparent", cursor: "pointer" }}>
                🤖
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
