import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { REACT_RUNTIME_JS } from "@khiye/checkers/assemble";
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

describe("React (JSX) projects", () => {
  const reactProject: FileSet = {
    "index.html": {
      content: `<!doctype html><html><head></head><body><div id="root"></div><script src="src/App.jsx"></script></body></html>`,
    },
    "src/App.jsx": {
      content: [
        `import React from "react";`,
        `import { createRoot } from "react-dom/client";`,
        `function App() { return <h1 data-testid="hi">Сайн уу</h1>; }`,
        `createRoot(document.getElementById("root")).render(<App />);`,
      ].join("\n"),
    },
  };
  const RUNTIME = "window.React = {}; window.ReactDOM = {};";
  const html = assembleSrcdoc(reactProject, { harnessJs: "/*H*/", reactRuntime: RUNTIME });

  it("transpiles JSX to createElement calls", () => {
    expect(html).toContain("React.createElement");
    expect(html).not.toContain("<h1 data-testid");
  });

  it("inlines the React runtime so Tier 1 needs no CDN", () => {
    expect(html).toContain("window.React");
    // …and only for JSX projects.
    expect(assembleSrcdoc(project, { harnessJs: "/*H*/", reactRuntime: RUNTIME })).not.toContain(
      "window.React",
    );
  });

  it("rewrites react imports onto the globals without self-aliasing", () => {
    expect(html).not.toMatch(/from ?["']react/);
    expect(html).not.toContain("const React = React"); // TDZ crash
    expect(html).toContain("const { createRoot } = ReactDOM");
  });

  it("mounts and stays interactive: a click updates the rendered state", async () => {
    // The one that matters for students — proves the inlined runtime really
    // hydrates events inside the assembled page, not just that JSX compiled.
    const counter: FileSet = {
      "index.html": {
        content: `<!doctype html><html><head></head><body><div id="root"></div><script src="src/App.jsx"></script></body></html>`,
      },
      "src/App.jsx": {
        content: [
          `import React, { useState } from "react";`,
          `import { createRoot } from "react-dom/client";`,
          `function App() {`,
          `  const [n, setN] = useState(0);`,
          `  return (`,
          `    <div>`,
          `      <span data-testid="n">{n}</span>`,
          `      <button data-testid="b" onClick={() => setN(n + 1)}>+</button>`,
          `    </div>`,
          `  );`,
          `}`,
          `createRoot(document.getElementById("root")).render(<App />);`,
        ].join("\n"),
      },
    };
    const window = new Window({ width: 800, height: 600 });
    try {
      window.document.write(
        assembleSrcdoc(counter, { harnessJs: HARNESS_JS, reactRuntime: REACT_RUNTIME_JS }),
      );
      const read = () => window.document.querySelector('[data-testid="n"]')?.textContent;
      // React flushes asynchronously; poll rather than race it.
      const until = async (want: string) => {
        for (let i = 0; i < 100; i++) {
          if (read() === want) return true;
          await new Promise((r) => setTimeout(r, 10));
        }
        return false;
      };
      expect(await until("0")).toBe(true); // mounted
      const btn = window.document.querySelector('[data-testid="b"]')!;
      btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      expect(await until("1")).toBe(true); // state updated, DOM re-rendered
    } finally {
      await window.happyDOM.abort();
      window.close();
    }
  });
});

describe("plain TypeScript", () => {
  const tsProject: FileSet = {
    "index.html": {
      content: `<!doctype html><html><head></head><body><p id="out">-</p><script src="src/cart.ts"></script></body></html>`,
    },
    "src/cart.ts": {
      content: [
        "interface Item { price: number; quantity: number }",
        "const total = (items: Item[]): number =>",
        "  items.reduce((sum: number, i: Item) => sum + i.price * i.quantity, 0);",
        'document.getElementById("out")!.textContent = String(total([{ price: 10, quantity: 3 }]));',
      ].join("\n"),
    },
  };

  it("strips the types and runs, without pulling in React", () => {
    const out = assembleSrcdoc(tsProject, { harnessJs: "/*H*/" });
    expect(out).not.toContain("interface Item");
    expect(out).not.toContain(": number");
    expect(out).not.toContain("window.React");
  });

  it("executes in happy-dom", async () => {
    const window = new Window({ width: 800, height: 600 });
    try {
      window.document.write(assembleSrcdoc(tsProject, { harnessJs: HARNESS_JS }));
      expect(window.document.getElementById("out")!.textContent).toBe("30");
    } finally {
      await window.happyDOM.abort();
      window.close();
    }
  });
});

describe("localStorage seed", () => {
  it("is inlined before the harness so page code can read it synchronously", () => {
    const out = assembleSrcdoc(project, { harnessJs: "/*H*/", storage: { "shopmn-cart": "[]" } });
    expect(out).toContain('window.__khiyeStorage = {"shopmn-cart":"[]"}');
    expect(out.indexOf("__khiyeStorage")).toBeLessThan(out.indexOf("/*H*/"));
  });

  it("is omitted when there is nothing stored yet", () => {
    expect(assembleSrcdoc(project, { harnessJs: "/*H*/" })).not.toContain("__khiyeStorage");
  });

  it("cannot break out of its own script tag", () => {
    const out = assembleSrcdoc(project, {
      harnessJs: "/*H*/",
      storage: { evil: "</script><script>alert(1)</script>" },
    });
    expect(out).not.toContain("</script><script>alert(1)");
    expect(out).toContain("\\u003c/script>");
  });
});

describe("generation stamp", () => {
  it("is readable by the harness before it sends anything", () => {
    const out = assembleSrcdoc(project, { harnessJs: "/*H*/", gen: 7 });
    expect(out).toContain("window.__khiyeGen = 7");
    expect(out.indexOf("__khiyeGen")).toBeLessThan(out.indexOf("/*H*/"));
  });

  it("makes the harness label its own messages", async () => {
    const window = new Window({ width: 800, height: 600 });
    const seen: unknown[] = [];
    try {
      // The harness posts to window.parent; in happy-dom a top-level window is
      // its own parent, so its messages come straight back to us.
      window.addEventListener("message", (e) => seen.push((e as { data?: unknown }).data));
      window.document.write(assembleSrcdoc(project, { harnessJs: HARNESS_JS, gen: 42 }));
      const readyMsg = async () => {
        for (let i = 0; i < 100; i++) {
          const hit = seen.find((m) => (m as { type?: string })?.type === "khiye:ready");
          if (hit) return hit as { gen?: number };
          await new Promise((r) => setTimeout(r, 10));
        }
        return undefined;
      };
      expect((await readyMsg())?.gen).toBe(42);
    } finally {
      await window.happyDOM.abort();
      window.close();
    }
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
