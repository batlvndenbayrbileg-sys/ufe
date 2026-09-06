"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import {
  clampInstructions,
  clampPreview,
  fitToContainer,
  INSTRUCTIONS_COLLAPSED,
  loadPaneSizes,
  savePaneSizes,
  type PaneSizes,
} from "./pane-sizing";
import styles from "./WorkspaceShell.module.css";

export interface WorkspaceShellProps {
  header: ReactNode;
  instructions: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  actionBar: ReactNode;
  /** Collapsed rail content (icon/number) shown when instructions are collapsed. */
  collapsedRail?: ReactNode;
  storageKey?: string;
  className?: string;
}

type DragTarget = "instructions" | "preview" | null;

export function WorkspaceShell({
  header,
  instructions,
  editor,
  preview,
  actionBar,
  collapsedRail,
  storageKey = "khiye-workspace-panes",
  className,
}: WorkspaceShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<PaneSizes>({ instructions: 360, preview: 440 });
  const [collapsed, setCollapsed] = useState(false);
  // On phones the three panes don't fit side by side, so they become tabs.
  const [mobileTab, setMobileTab] = useState<"instructions" | "editor" | "preview">("instructions");
  const dragRef = useRef<{ target: DragTarget; startX: number; startWidth: number }>({
    target: null,
    startX: 0,
    startWidth: 0,
  });

  // Hydrate persisted sizes and fit to the current container width.
  useEffect(() => {
    const loaded = loadPaneSizes(storageKey);
    const width = containerRef.current?.clientWidth ?? 1280;
    setSizes(fitToContainer(loaded, width));
  }, [storageKey]);

  const onPointerDown = useCallback(
    (target: Exclude<DragTarget, null>) => (e: ReactPointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        target,
        startX: e.clientX,
        startWidth: target === "instructions" ? sizes.instructions : sizes.preview,
      };
    },
    [sizes],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag.target) return;
    const delta = e.clientX - drag.startX;
    setSizes((prev) => {
      if (drag.target === "instructions") {
        return { ...prev, instructions: clampInstructions(drag.startWidth + delta) };
      }
      // preview grows when dragging left → subtract delta
      return { ...prev, preview: clampPreview(drag.startWidth - delta) };
    });
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current.target) return;
    dragRef.current.target = null;
    setSizes((prev) => {
      savePaneSizes(storageKey, prev);
      return prev;
    });
  }, [storageKey]);

  // Keep the editor usable when the window shrinks.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setSizes((prev) => fitToContainer(prev, el.clientWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const leftWidth = collapsed ? INSTRUCTIONS_COLLAPSED : sizes.instructions;

  return (
    <div className={cn(styles.shell, className)}>
      <div className={styles.header}>{header}</div>

      <div className={styles.body}>
        {/* Phone-only: switch which single pane is showing. */}
        <div className={styles.mobileTabs} role="tablist" aria-label="Талбар">
          {(
            [
              ["instructions", "Заавар"],
              ["editor", "Код"],
              ["preview", "Preview"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mobileTab === id}
              className={cn(styles.mobileTab, mobileTab === id && styles.mobileTabActive)}
              onClick={() => setMobileTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          ref={containerRef}
          className={styles.panes}
          data-mobile-tab={mobileTab}
          style={{
            gridTemplateColumns: `${leftWidth}px 6px minmax(0, 1fr) 6px ${sizes.preview}px`,
          }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
        <aside className={cn(styles.pane, styles.instructions)} data-collapsed={collapsed}>
          <button
            type="button"
            className={styles.collapseBtn}
            aria-label={collapsed ? "Заавар нээх" : "Заавар хумих"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? "›" : "‹"}
          </button>
          {collapsed ? (
            <div className={styles.collapsedRail}>{collapsedRail}</div>
          ) : (
            <div className={styles.paneScroll}>{instructions}</div>
          )}
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Зааврын өргөнийг өөрчлөх"
          className={styles.resizer}
          onPointerDown={onPointerDown("instructions")}
          data-disabled={collapsed || undefined}
        />

        <section className={cn(styles.pane, styles.editor)}>{editor}</section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Preview-ийн өргөнийг өөрчлөх"
          className={styles.resizer}
          onPointerDown={onPointerDown("preview")}
        />

        <section className={cn(styles.pane, styles.preview)}>{preview}</section>
        </div>
      </div>

      <div className={styles.actionBar}>{actionBar}</div>
    </div>
  );
}
