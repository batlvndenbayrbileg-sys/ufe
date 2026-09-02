"use client";

import { languageForPath } from "./lib/language";

export interface EditorTabsProps {
  openTabs: string[];
  activeFile: string | null;
  dirtyPaths?: string[];
  readOnlyPaths?: string[];
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

const base = (p: string) => p.split("/").pop() ?? p;

export function EditorTabs({ openTabs, activeFile, dirtyPaths = [], readOnlyPaths = [], onSelect, onClose }: EditorTabsProps) {
  return (
    <div
      role="tablist"
      style={{ display: "flex", alignItems: "stretch", overflowX: "auto", background: "var(--bg-subtle,#fafafa)", borderBottom: "1px solid var(--border,#e4e4e7)" }}
    >
      {openTabs.map((path) => {
        const active = path === activeFile;
        return (
          <div
            key={path}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            onClick={() => onSelect(path)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(path)}
            title={path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: active ? "var(--text,#18181b)" : "var(--text-muted,#71717a)",
              background: active ? "var(--code-bg,#fff)" : "transparent",
              borderRight: "1px solid var(--border,#e4e4e7)",
              borderBottom: active ? "2px solid var(--accent,#2563eb)" : "2px solid transparent",
            }}
          >
            {readOnlyPaths.includes(path) ? <span aria-hidden>🔒</span> : null}
            {base(path)}
            {dirtyPaths.includes(path) ? <span aria-hidden style={{ color: "var(--accent,#2563eb)" }}>●</span> : null}
            <button
              type="button"
              aria-label={`${base(path)} хаах`}
              onClick={(e) => { e.stopPropagation(); onClose(path); }}
              style={{ border: 0, background: "transparent", cursor: "pointer", color: "inherit", padding: "0 2px", fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
            <span hidden>{languageForPath(path)}</span>
          </div>
        );
      })}
    </div>
  );
}
