"use client";

import { useMemo } from "react";
import { buildTree, type TreeNode } from "./lib/tree";

export interface FileTreeProps {
  /** Only these paths are shown (lesson.visibleFiles). */
  visibleFiles: string[];
  activeFile: string | null;
  readOnlyPaths?: string[];
  onOpen: (path: string) => void;
}

function Node({ node, depth, activeFile, readOnlyPaths, onOpen }: {
  node: TreeNode; depth: number; activeFile: string | null; readOnlyPaths: string[]; onOpen: (p: string) => void;
}) {
  const pad = 8 + depth * 12;
  if (node.type === "dir") {
    return (
      <div>
        <div style={{ padding: `4px 8px 4px ${pad}px`, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-subtle,#a1a1aa)" }}>
          {node.name}
        </div>
        {node.children.map((c) => (
          <Node key={c.path} node={c} depth={depth + 1} activeFile={activeFile} readOnlyPaths={readOnlyPaths} onOpen={onOpen} />
        ))}
      </div>
    );
  }
  const active = node.path === activeFile;
  return (
    <button
      type="button"
      onClick={() => onOpen(node.path)}
      style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left",
        padding: `4px 8px 4px ${pad}px`, border: 0, cursor: "pointer", fontSize: 13,
        fontFamily: "var(--font-mono, monospace)",
        background: active ? "var(--accent-subtle,#eff6ff)" : "transparent",
        color: active ? "var(--accent-text,#1e40af)" : "var(--text,#18181b)",
      }}
    >
      {readOnlyPaths.includes(node.path) ? <span aria-hidden>🔒</span> : <span aria-hidden style={{ opacity: 0.5 }}>›</span>}
      {node.name}
    </button>
  );
}

export function FileTree({ visibleFiles, activeFile, readOnlyPaths = [], onOpen }: FileTreeProps) {
  const tree = useMemo(() => buildTree(visibleFiles), [visibleFiles]);
  return (
    <div style={{ padding: "6px 0", overflowY: "auto", height: "100%", background: "var(--surface,#fff)" }}>
      {tree.map((n) => (
        <Node key={n.path} node={n} depth={0} activeFile={activeFile} readOnlyPaths={readOnlyPaths} onOpen={onOpen} />
      ))}
    </div>
  );
}
