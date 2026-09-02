export type TreeNode =
  | { type: "file"; name: string; path: string }
  | { type: "dir"; name: string; path: string; children: TreeNode[] };

/** Build a sorted file tree (dirs first) from a flat path list. Pure/testable. */
export function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of [...paths].sort()) {
    const parts = path.replace(/\/$/, "").split("/");
    let level = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1 && !path.endsWith("/");
      if (isFile) {
        level.push({ type: "file", name: part, path: acc });
        return;
      }
      let dir = level.find((n) => n.type === "dir" && n.name === part) as
        | Extract<TreeNode, { type: "dir" }>
        | undefined;
      if (!dir) {
        dir = { type: "dir", name: part, path: acc, children: [] };
        level.push(dir);
      }
      level = dir.children;
    });
  }
  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
    for (const n of nodes) if (n.type === "dir") sort(n.children);
    return nodes;
  };
  return sort(root);
}
