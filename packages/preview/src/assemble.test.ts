import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { assembleSrcdoc, diffFiles } from "./assemble";
import { HARNESS_JS } from "./harness-bundle";
import type { FileSet } from "./protocol";

const project: FileSet = {
  "index.html": {
    content: `<!doctype html><html><head><link rel="stylesheet" href="styles/main.css"></head><body><h1 id="t">Shop.mn</h1><script src="js/main.js"></script></body></html>`,
  },
  "styles/main.css": { content: "#t{color:rgb(1,2,3)}" },
  "js/main.js": { content: "document.getElementById('t').setAttribute('data-ran','1');" },
};

describe("assembleSrcdoc", () => {
  const html = assembleSrcdoc(project, { harnessJs: "/*H*/" });

  it("injects the harness first, a CSP meta and a base", () => {
    expect(html).toContain("/*H*/");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("<base");
    // harness appears before the student's h1
    expect(html.indexOf("/*H*/")).toBeLessThan(html.indexOf("Shop.mn"));
  });

  it("inlines CSS into a hot-swappable managed style block", () => {
    expect(html).toContain('data-khiye-css="styles/main.css"');
    expect(html).toContain("color:rgb(1,2,3)");
    expect(html).not.toContain('<link');
  });

  it("inlines referenced scripts", () => {
    expect(html).toContain("setAttribute('data-ran','1')");
    expect(html).not.toMatch(/<script[^>]*src=/);
  });

  it("is Unicode-safe (Cyrillic survives)", () => {
    const out = assembleSrcdoc({ "index.html": { content: "<h1>Монгол Ө Ү</h1>" } }, { harnessJs: "" });
    expect(out).toContain("Монгол Ө Ү");
  });
});

describe("diffFiles", () => {
  it("detects a CSS-only change", () => {
    const a: FileSet = { "index.html": { content: "x" }, "styles/main.css": { content: "1" } };
    const b: FileSet = { "index.html": { content: "x" }, "styles/main.css": { content: "2" } };
    expect(diffFiles(a, b)).toEqual({ changed: ["styles/main.css"], cssOnly: true });
  });
  it("an HTML change is not CSS-only", () => {
    const a: FileSet = { "index.html": { content: "x" } };
    const b: FileSet = { "index.html": { content: "y" } };
    expect(diffFiles(a, b).cssOnly).toBe(false);
  });
  it("first render (no prev) changes everything", () => {
    expect(diffFiles(null, { "a.html": { content: "x" } })).toEqual({ changed: ["a.html"], cssOnly: false });
  });
});

describe("assembled srcdoc renders (happy-dom, harness included)", () => {
  it("applies styles and runs the inlined script", async () => {
    const srcdoc = assembleSrcdoc(project, { harnessJs: HARNESS_JS });
    const window = new Window({ width: 800, height: 600 });
    try {
      // Inline scripts (harness + student) run synchronously during write().
      // We don't waitUntilComplete because the harness heartbeat interval never settles.
      window.document.write(srcdoc);
      const h1 = window.document.getElementById("t")!;
      expect(h1.textContent).toBe("Shop.mn");
      expect(h1.getAttribute("data-ran")).toBe("1"); // student script executed
      const style = window.getComputedStyle(h1 as never);
      expect(style.getPropertyValue("color")).toContain("rgb(1, 2, 3)");
    } finally {
      await window.happyDOM.abort();
      window.close();
    }
  });
});
