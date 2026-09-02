/**
 * Pane sizing rules for the learning workspace (docs/blueprint/02 §2.2).
 * Instructions pane: 320–420px. Preview pane: 360–560px. Editor takes the rest.
 * Pure functions so the clamping/persistence is unit-testable.
 */

export const INSTRUCTIONS_MIN = 320;
export const INSTRUCTIONS_MAX = 420;
export const INSTRUCTIONS_COLLAPSED = 48;
export const PREVIEW_MIN = 360;
export const PREVIEW_MAX = 560;
export const EDITOR_MIN = 360;

export interface PaneSizes {
  instructions: number;
  preview: number;
}

export const DEFAULT_PANE_SIZES: PaneSizes = { instructions: 360, preview: 440 };

function clamp(px: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(px)));
}

export function clampInstructions(px: number): number {
  return clamp(px, INSTRUCTIONS_MIN, INSTRUCTIONS_MAX);
}

export function clampPreview(px: number): number {
  return clamp(px, PREVIEW_MIN, PREVIEW_MAX);
}

/**
 * Ensure the editor keeps at least EDITOR_MIN given the container width.
 * Shrinks the preview first, then the instructions.
 */
export function fitToContainer(sizes: PaneSizes, containerWidth: number): PaneSizes {
  const dividers = 12; // two 6px handles
  let { instructions, preview } = sizes;
  let editor = containerWidth - instructions - preview - dividers;
  if (editor >= EDITOR_MIN) return { instructions, preview };

  const deficit = EDITOR_MIN - editor;
  preview = clampPreview(preview - deficit);
  editor = containerWidth - instructions - preview - dividers;
  if (editor < EDITOR_MIN) {
    instructions = clampInstructions(instructions - (EDITOR_MIN - editor));
  }
  return { instructions, preview };
}

export function loadPaneSizes(storageKey: string): PaneSizes {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_PANE_SIZES;
    const parsed = JSON.parse(raw) as Partial<PaneSizes>;
    return {
      instructions: clampInstructions(parsed.instructions ?? DEFAULT_PANE_SIZES.instructions),
      preview: clampPreview(parsed.preview ?? DEFAULT_PANE_SIZES.preview),
    };
  } catch {
    return DEFAULT_PANE_SIZES;
  }
}

export function savePaneSizes(storageKey: string, sizes: PaneSizes): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sizes));
  } catch {
    /* ignore */
  }
}
