"use client";

import { keyStripFor, type KeyStripToken } from "./lib/keystrip";
import type { LanguageName } from "./lib/language";

export interface MobileKeyStripProps {
  language: LanguageName;
  onInsert: (token: KeyStripToken) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const key: React.CSSProperties = {
  flex: "0 0 auto",
  minWidth: 40,
  height: 40,
  border: "1px solid var(--border,#e4e4e7)",
  borderRadius: 6,
  background: "var(--surface,#fff)",
  color: "var(--text,#18181b)",
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 15,
  cursor: "pointer",
};

/** Code key strip above the mobile keyboard (docs/blueprint/07 §7.6). */
export function MobileKeyStrip({ language, onInsert, onUndo, onRedo }: MobileKeyStripProps) {
  return (
    <div style={{ display: "flex", gap: 6, padding: 6, overflowX: "auto", background: "var(--bg-subtle,#fafafa)", borderTop: "1px solid var(--border,#e4e4e7)", WebkitOverflowScrolling: "touch" }}>
      {onUndo ? <button type="button" style={key} onClick={onUndo} aria-label="Буцаах">↶</button> : null}
      {onRedo ? <button type="button" style={key} onClick={onRedo} aria-label="Дахих">↷</button> : null}
      {keyStripFor(language).map((tok, i) => (
        <button key={i} type="button" style={key} onClick={() => onInsert(tok)} aria-label={tok.label}>
          {tok.label}
        </button>
      ))}
    </div>
  );
}
