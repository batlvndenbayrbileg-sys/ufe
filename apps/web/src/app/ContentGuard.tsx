"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Site-wide content protection: blocks copy / cut / paste, right-click and the
 * copy/paste/save/print keyboard shortcuts, and deters screenshots (wipes the
 * clipboard on PrintScreen and hides the page when the tab is switched away).
 *
 * Honest limits: a browser CANNOT truly stop OS- or phone-level screenshots —
 * this only raises the effort. The code editor (.cm-editor) and form fields are
 * exempted for selection/typing so the app stays usable; paste stays blocked
 * everywhere so answers must be typed by hand.
 */
export function ContentGuard() {
  const [msg, setMsg] = useState<string | null>(null);
  const [shielded, setShielded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const toast = (t: string) => {
      setMsg(t);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(null), 2200);
    };

    const editable = (el: EventTarget | null): boolean =>
      el instanceof Element &&
      el.closest('input, textarea, select, [contenteditable="true"], .cm-editor') !== null;

    const onCopyCut = (e: Event) => {
      if (!editable(e.target)) {
        e.preventDefault();
        toast("Хуулах боломжгүй.");
      }
    };
    const onPaste = (e: Event) => {
      e.preventDefault();
      toast("Хуулж тавих боломжгүй — өөрөө бичээрэй.");
    };
    const onContext = (e: Event) => e.preventDefault();
    const onDragStart = (e: Event) => e.preventDefault();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        // Best-effort: overwrite whatever PrintScreen just put on the clipboard.
        navigator.clipboard?.writeText("").catch(() => {});
        toast("Дэлгэцийн зураг авахыг хориглосон.");
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (!["c", "x", "v", "s", "p", "u"].includes(k)) return;
      const inEdit = editable(e.target);
      // Allow copy/cut inside the editor & inputs; block paste/save/print/view-source everywhere.
      if (inEdit && (k === "c" || k === "x")) return;
      e.preventDefault();
      if (k === "v") toast("Хуулж тавих боломжгүй — өөрөө бичээрэй.");
    };

    // Screenshot deterrent: blank the page while the tab is hidden (switched
    // away / minimised). Uses visibility only — window blur would fire when the
    // lesson's preview iframe takes focus and wrongly blank the workspace.
    const onVis = () => setShielded(document.visibilityState === "hidden");

    document.addEventListener("copy", onCopyCut);
    document.addEventListener("cut", onCopyCut);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("copy", onCopyCut);
      document.removeEventListener("cut", onCopyCut);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("visibilitychange", onVis);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      {shielded ? (
        <div className="cg-shield" aria-hidden>
          UFE ISMD — агуулга хамгаалагдсан
        </div>
      ) : null}
      {msg ? (
        <div className="cg-toast" role="status" aria-live="polite">
          {msg}
        </div>
      ) : null}
    </>
  );
}
