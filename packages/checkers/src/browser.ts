// Browser-safe checker subset for the preview harness (E5). Registers the
// families that run against a live DOM: dom.*, css.*, html.valid, js.*.
// Excludes ast.* (which pulls in @babel/parser) — AST checks run server-side.
import "./families/dom";
import "./families/html";
import "./families/css";
import "./families/js";

export * from "./types";
export { runChecks, runCheck, verdict, registeredTypes } from "./registry";
