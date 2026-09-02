// @khiye/preview — Tier-1 live preview: assembler, harness, iframe host (E5).
export { assembleSrcdoc, diffFiles, type AssembleOptions } from "./assemble";
export { PreviewHost, type PreviewHostHandle, type PreviewHostProps } from "./PreviewHost";
export {
  PreviewFrame,
  DEVICE_PRESETS,
  type PreviewFrameProps,
  type DevicePreset,
} from "./PreviewFrame";
export {
  PREVIEW_PROTOCOL_VERSION,
  isHarnessMessage,
  type FileSet,
  type HostMessage,
  type HarnessMessage,
  type ConsoleEntry,
  type HarnessCheckResult,
} from "./protocol";
export { HARNESS_JS, HARNESS_BYTES } from "./harness-bundle";
