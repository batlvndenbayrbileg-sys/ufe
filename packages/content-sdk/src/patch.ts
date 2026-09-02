import type { FilePatch } from "./schema";

/** A workspace file set: path → text content (+ flags). Mirrors @khiye/db FileSet. */
export type FileSet = Record<string, { content: string; readonly?: boolean; binary?: boolean }>;

export class PatchError extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, path: string, message: string) {
    super(message);
    this.name = "PatchError";
    this.code = code;
    this.path = path;
  }
}

export interface ApplyOptions {
  /** Overwrite files the student may already own. Default false (never clobber). */
  force?: boolean;
  /** Resolver for `@asset:...` content references → text/data-URI. */
  resolveAsset?: (ref: string) => string;
}

const ASSET_PREFIX = "@asset:";

function resolveContent(content: string, opts: ApplyOptions): string {
  if (content.startsWith(ASSET_PREFIX)) {
    const ref = content.slice(ASSET_PREFIX.length);
    if (!opts.resolveAsset) {
      // Leave a stable marker the caller/CDN can rewrite; do not fail authoring.
      return `/* @asset ${ref} */`;
    }
    return opts.resolveAsset(ref);
  }
  return content;
}

/**
 * Apply content FilePatches to a workspace, returning a NEW FileSet (pure).
 * `create`/`insertAfter` never clobber an existing file unless `force` is set —
 * this is what protects student work when a lesson re-opens (§4.3).
 */
export function applyPatch(
  input: FileSet,
  patches: FilePatch[],
  opts: ApplyOptions = {},
): FileSet {
  const files: FileSet = structuredClone(input);

  for (const patch of patches) {
    switch (patch.op) {
      case "create": {
        if (files[patch.path] && !opts.force) break; // keep student's file
        files[patch.path] = { content: resolveContent(patch.content, opts) };
        break;
      }
      case "replace": {
        files[patch.path] = {
          ...files[patch.path],
          content: resolveContent(patch.content, opts),
        };
        break;
      }
      case "append": {
        const prev = files[patch.path]?.content ?? "";
        files[patch.path] = {
          ...files[patch.path],
          content: prev + resolveContent(patch.content, opts),
        };
        break;
      }
      case "delete": {
        delete files[patch.path];
        break;
      }
      case "rename": {
        const src = files[patch.path];
        if (!src) throw new PatchError("rename_missing_source", patch.path, `rename: source not found: ${patch.path}`);
        if (files[patch.to] && !opts.force) {
          throw new PatchError("rename_target_exists", patch.to, `rename: target exists: ${patch.to}`);
        }
        files[patch.to] = src;
        delete files[patch.path];
        break;
      }
      case "insertAfter": {
        const file = files[patch.path];
        if (!file) throw new PatchError("insert_missing_file", patch.path, `insertAfter: file not found: ${patch.path}`);
        const idx = file.content.indexOf(patch.anchor);
        if (idx === -1) {
          throw new PatchError(
            "insert_anchor_not_found",
            patch.path,
            `insertAfter: anchor not found in ${patch.path}: ${JSON.stringify(patch.anchor)}`,
          );
        }
        const at = idx + patch.anchor.length;
        const inserted = resolveContent(patch.content, opts);
        file.content = file.content.slice(0, at) + "\n" + inserted + file.content.slice(at);
        break;
      }
    }
  }

  return files;
}

/** Collect all `@asset:` references a patch list depends on. */
export function collectAssetRefs(patches: FilePatch[]): string[] {
  const refs = new Set<string>();
  for (const p of patches) {
    if ((p.op === "create" || p.op === "replace" || p.op === "append" || p.op === "insertAfter") &&
        p.content.startsWith(ASSET_PREFIX)) {
      refs.add(p.content.slice(ASSET_PREFIX.length));
    }
  }
  return [...refs];
}
