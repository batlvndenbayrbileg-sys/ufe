// @khiye/editor — CodeMirror 6 editor, workspace store, tree/tabs/console (E4).
export { CodeMirror, type CodeMirrorHandle, type CodeMirrorProps } from "./CodeMirror";
export { EditorPane, type EditorPaneProps } from "./EditorPane";
export { EditorTabs, type EditorTabsProps } from "./EditorTabs";
export { FileTree, type FileTreeProps } from "./FileTree";
export { Console, type ConsoleProps } from "./Console";
export { MobileKeyStrip, type MobileKeyStripProps } from "./MobileKeyStrip";

export {
  createWorkspaceStore,
  workspaceStore,
  useWorkspace,
  type WorkspaceState,
  type WorkspaceSnapshot,
} from "./store";
export { hydrateWorkspace, persistWorkspace } from "./persist";

export { languageForPath, type LanguageName } from "./lib/language";
export { keyStripFor, type KeyStripToken } from "./lib/keystrip";
export { buildTree, type TreeNode } from "./lib/tree";
export { findMarker, intersectsRange, type Range } from "./lib/marker";
