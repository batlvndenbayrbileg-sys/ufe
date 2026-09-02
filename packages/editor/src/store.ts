import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
// Import the browser-safe subpaths only — the content-sdk barrel pulls in the
// Node-only loader/sync (node:fs), which must not reach the client bundle.
import { applyPatch, type FileSet } from "@khiye/content-sdk/patch";
import type { FilePatch } from "@khiye/content-sdk/schema";

export interface WorkspaceSnapshot {
  files: FileSet;
  activeFile: string | null;
  openTabs: string[];
}

export interface WorkspaceState {
  courseId: string | null;
  files: FileSet;
  visibleFiles: string[];
  readOnlyFiles: string[];
  openTabs: string[];
  activeFile: string | null;
  cursors: Record<string, number>;
  scroll: Record<string, number>;
  dirty: boolean;

  init(input: {
    courseId: string;
    files: FileSet;
    visibleFiles?: string[];
    readOnlyFiles?: string[];
    activeFile?: string;
    openFiles?: string[];
  }): void;
  setFileContent(path: string, content: string): void;
  openFile(path: string): void;
  closeFile(path: string): void;
  setActive(path: string): void;
  setCursor(path: string, pos: number): void;
  setScroll(path: string, y: number): void;
  applyContentPatch(patch: FilePatch[], opts?: { force?: boolean }): void;
  snapshot(): WorkspaceSnapshot;
  restore(snap: WorkspaceSnapshot): void;
  isReadOnly(path: string): boolean;
}

export function createWorkspaceStore(): StoreApi<WorkspaceState> {
  return createStore<WorkspaceState>((set, get) => ({
    courseId: null,
    files: {},
    visibleFiles: [],
    readOnlyFiles: [],
    openTabs: [],
    activeFile: null,
    cursors: {},
    scroll: {},
    dirty: false,

    init({ courseId, files, visibleFiles, readOnlyFiles, activeFile, openFiles }) {
      const tabs = (openFiles ?? []).filter((f) => files[f]);
      const active = activeFile && files[activeFile] ? activeFile : (tabs[0] ?? Object.keys(files)[0] ?? null);
      set({
        courseId,
        files,
        visibleFiles: visibleFiles ?? Object.keys(files),
        readOnlyFiles: readOnlyFiles ?? [],
        openTabs: active && !tabs.includes(active) ? [...tabs, active] : tabs,
        activeFile: active,
        cursors: {},
        scroll: {},
        dirty: false,
      });
    },

    setFileContent(path, content) {
      if (get().isReadOnly(path)) return;
      set((s) => ({ files: { ...s.files, [path]: { ...s.files[path], content } }, dirty: true }));
    },

    openFile(path) {
      set((s) => ({
        openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
        activeFile: path,
      }));
    },

    closeFile(path) {
      set((s) => {
        const openTabs = s.openTabs.filter((p) => p !== path);
        const activeFile =
          s.activeFile === path ? (openTabs[openTabs.length - 1] ?? null) : s.activeFile;
        return { openTabs, activeFile };
      });
    },

    setActive(path) {
      set((s) => ({ activeFile: path, openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path] }));
    },

    setCursor(path, pos) {
      set((s) => ({ cursors: { ...s.cursors, [path]: pos } }));
    },

    setScroll(path, y) {
      set((s) => ({ scroll: { ...s.scroll, [path]: y } }));
    },

    applyContentPatch(patch, opts) {
      set((s) => ({ files: applyPatch(s.files, patch, opts) as FileSet, dirty: true }));
    },

    snapshot() {
      const s = get();
      return { files: structuredClone(s.files), activeFile: s.activeFile, openTabs: [...s.openTabs] };
    },

    restore(snap) {
      set({ files: structuredClone(snap.files), activeFile: snap.activeFile, openTabs: [...snap.openTabs], dirty: true });
    },

    isReadOnly(path) {
      return get().readOnlyFiles.includes(path) || get().files[path]?.readonly === true;
    },
  }));
}

/** App-wide singleton store + React binding. Tests use createWorkspaceStore(). */
export const workspaceStore = createWorkspaceStore();

export function useWorkspace<T>(selector: (s: WorkspaceState) => T): T {
  return useStore(workspaceStore, selector);
}
