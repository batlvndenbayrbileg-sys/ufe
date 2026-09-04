/**
 * postMessage protocol between the preview HOST (parent) and the HARNESS
 * (inside the sandboxed iframe). The iframe is opaque-origin (no
 * allow-same-origin), so this channel is the ONLY link. See
 * docs/blueprint/07-editor-and-preview.md §7.4–7.5 and 12 §12.2.
 */

import type { TranslatedError } from "@khiye/shared";

export const PREVIEW_PROTOCOL_VERSION = 1;

export type FileSet = Record<string, { content: string; readonly?: boolean; binary?: boolean }>;

// ── Host → Harness ───────────────────────────────────────────────────────────
export type HostMessage =
  | { type: "khiye:init"; version: number }
  | {
      type: "khiye:runChecks";
      nonce: string;
      files: FileSet;
      checks: Array<{ id: string; type: string; args: Record<string, unknown> }>;
    }
  // Hot-swap CSS without a reload (preserves DOM/JS state). §7.4
  | { type: "khiye:updateStyles"; styles: Record<string, string> }
  | { type: "khiye:scrollTo"; x: number; y: number }
  | { type: "khiye:reset-console" };

// ── Harness → Host ───────────────────────────────────────────────────────────
export interface ConsoleEntry {
  level: "log" | "info" | "warn" | "error" | "debug";
  args: string[];
  source?: { file?: string; line?: number; col?: number };
  time: number;
}

export interface HarnessCheckResult {
  id: string;
  passed: boolean;
  actual?: string;
  expected?: string;
  errorKind?: "assertion" | "runtime" | "timeout" | "infra";
  durationMs: number;
}

export type HarnessMessage =
  | { type: "khiye:ready"; version: number }
  | { type: "khiye:heartbeat"; t: number }
  | { type: "khiye:scroll"; x: number; y: number }
  | { type: "khiye:console"; entry: ConsoleEntry }
  | {
      type: "khiye:error";
      message: string;
      stack?: string;
      source?: { file?: string; line?: number; col?: number };
      mn?: TranslatedError | null;
    }
  | { type: "khiye:checksResult"; nonce: string; results: HarnessCheckResult[] }
  /** The shimmed localStorage changed; the host keeps it so a reload restores it. */
  | { type: "khiye:storage"; data: Record<string, string> };

export function isHarnessMessage(data: unknown): data is HarnessMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { type?: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith("khiye:")
  );
}
