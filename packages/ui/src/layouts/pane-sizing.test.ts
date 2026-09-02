import { describe, expect, it } from "vitest";
import {
  clampInstructions,
  clampPreview,
  EDITOR_MIN,
  fitToContainer,
  INSTRUCTIONS_MAX,
  INSTRUCTIONS_MIN,
  PREVIEW_MAX,
  PREVIEW_MIN,
} from "./pane-sizing";

describe("pane sizing", () => {
  it("clamps instructions to [320,420]", () => {
    expect(clampInstructions(100)).toBe(INSTRUCTIONS_MIN);
    expect(clampInstructions(999)).toBe(INSTRUCTIONS_MAX);
    expect(clampInstructions(380)).toBe(380);
  });

  it("clamps preview to [360,560]", () => {
    expect(clampPreview(100)).toBe(PREVIEW_MIN);
    expect(clampPreview(999)).toBe(PREVIEW_MAX);
    expect(clampPreview(450)).toBe(450);
  });

  it("keeps the editor above its minimum when panes are over-sized", () => {
    // 1280 is the 3-pane threshold; below it the shell stacks (CSS), so fit
    // only needs to hold at desktop widths.
    const fitted = fitToContainer({ instructions: 420, preview: 560 }, 1280);
    const editor = 1280 - fitted.instructions - fitted.preview - 12;
    expect(editor).toBeGreaterThanOrEqual(EDITOR_MIN - 1);
  });

  it("leaves comfortable sizes unchanged on a wide container", () => {
    const sizes = { instructions: 360, preview: 440 };
    expect(fitToContainer(sizes, 1600)).toEqual(sizes);
  });
});
