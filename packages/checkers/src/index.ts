// @khiye/checkers — isomorphic validation engine (E6).
// Importing this module registers every checker family. Browser-safe
// (no Node deps here); the happy-dom server runner lives in "./server".
import "./families/dom";
import "./families/html";
import "./families/css";
import "./families/ast";
import "./families/js";
import "./families/file";

export * from "./types";
export {
  registerChecker,
  getChecker,
  registeredTypes,
  runCheck,
  runChecks,
  verdict,
} from "./registry";
export { validateHtml } from "./families/html";
