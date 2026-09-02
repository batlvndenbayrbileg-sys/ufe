import { get as idbGet, set as idbSet } from "idb-keyval";
import type { StoreApi } from "zustand/vanilla";
import type { WorkspaceState } from "./store";

/**
 * IndexedDB persistence for the workspace (docs/blueprint/07 §7.3). Debounced
 * saves; restores files/tabs/active/cursors/scroll on reload. All guarded —
 * private mode or blocked storage never breaks the editor.
 */

interface Persisted {
  files: WorkspaceState["files"];
  openTabs: string[];
  activeFile: string | null;
  cursors: Record<string, number>;
  scroll: Record<string, number>;
  savedAt: number;
}

const key = (courseId: string) => `khiye:workspace:${courseId}`;

export async function hydrateWorkspace(
  store: StoreApi<WorkspaceState>,
  courseId: string,
): Promise<boolean> {
  try {
    const saved = (await idbGet(key(courseId))) as Persisted | undefined;
    if (!saved?.files) return false;
    store.setState((s) => ({
      files: { ...s.files, ...saved.files },
      openTabs: saved.openTabs?.length ? saved.openTabs : s.openTabs,
      activeFile: saved.activeFile ?? s.activeFile,
      cursors: saved.cursors ?? {},
      scroll: saved.scroll ?? {},
    }));
    return true;
  } catch {
    return false;
  }
}

/** Subscribe and persist (debounced). Returns an unsubscribe. */
export function persistWorkspace(
  store: StoreApi<WorkspaceState>,
  courseId: string,
  debounceMs = 1000,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    const s = store.getState();
    const data: Persisted = {
      files: s.files,
      openTabs: s.openTabs,
      activeFile: s.activeFile,
      cursors: s.cursors,
      scroll: s.scroll,
      savedAt: Date.now(),
    };
    void idbSet(key(courseId), data).catch(() => {});
  };
  const unsub = store.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, debounceMs);
  });
  return () => {
    if (timer) clearTimeout(timer);
    unsub();
  };
}
