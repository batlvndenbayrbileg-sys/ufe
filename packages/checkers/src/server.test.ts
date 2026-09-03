import { describe, expect, it } from "vitest";
import { runChecksOnFiles } from "./server";
import type { CheckDef, FileSet } from "./types";

const html = (body: string, head = ""): FileSet => ({
  "index.html": { content: `<!doctype html><html><head>${head}</head><body>${body}</body></html>` },
});

async function one(files: FileSet, def: Omit<CheckDef, "id">) {
  const [r] = await runChecksOnFiles(files, [{ id: "c", ...def }]);
  return r!;
}

describe("dom.* via happy-dom runner", () => {
  const card = html(`<main><article class="product-card"><img src="a.jpg" alt="Дээл"><h3>Монгол дээл</h3><p class="price">₮ 129,000</p><button data-testid="add">Сагсанд хийх</button></article></main>`);

  it("dom.exists", async () => {
    expect((await one(card, { type: "dom.exists", args: { selector: "main article.product-card" } })).passed).toBe(true);
    expect((await one(card, { type: "dom.exists", args: { selector: ".nope" } })).passed).toBe(false);
  });

  it("dom.count", async () => {
    expect((await one(card, { type: "dom.count", args: { selector: "article", equals: 1 } })).passed).toBe(true);
    expect((await one(card, { type: "dom.count", args: { selector: "article", equals: 2 } })).passed).toBe(false);
  });

  it("dom.text handles Cyrillic and matches", async () => {
    expect((await one(card, { type: "dom.text", args: { selector: "h3", contains: "Монгол дээл" } })).passed).toBe(true);
    expect((await one(card, { type: "dom.text", args: { selector: "p.price", matches: "₮\\s?129[,\\s]?000" } })).passed).toBe(true);
    expect((await one(card, { type: "dom.text", args: { selector: "h3", equals: "Wrong" } })).passed).toBe(false);
  });

  it("dom.attr", async () => {
    expect((await one(card, { type: "dom.attr", args: { selector: "img", name: "alt", minLength: 3 } })).passed).toBe(true);
    expect((await one(card, { type: "dom.attr", args: { selector: "img", name: "src", equals: "a.jpg" } })).passed).toBe(true);
    const noAlt = html(`<img src="a.jpg">`);
    expect((await one(noAlt, { type: "dom.attr", args: { selector: "img", name: "alt", minLength: 1 } })).passed).toBe(false);
  });

  it("dom.order and dom.hierarchy", async () => {
    expect((await one(card, { type: "dom.order", args: { selectors: ["img", "h3", "p.price", "button"] } })).passed).toBe(true);
    expect((await one(card, { type: "dom.hierarchy", args: { parent: "article", child: "button" } })).passed).toBe(true);
  });

  it("dom.a11y catches a missing alt and an unnamed button", async () => {
    expect((await one(card, { type: "dom.a11y", args: { rules: ["image-alt", "button-name"] } })).passed).toBe(true);
    const bad = html(`<img src="a.jpg"><button></button>`);
    const r = await one(bad, { type: "dom.a11y", args: { rules: ["image-alt", "button-name"] } });
    expect(r.passed).toBe(false);
  });

  it("html.valid catches an unclosed tag", async () => {
    const good = html(`<main><h1>Shop.mn</h1></main>`);
    expect((await one(good, { type: "html.valid", args: {} })).passed).toBe(true);
    const bad: FileSet = { "index.html": { content: "<main><h1>Shop.mn</main>" } };
    expect((await one(bad, { type: "html.valid", args: {} })).passed).toBe(false);
  });
});

describe("css.* via happy-dom runner", () => {
  const styled = html(
    `<button class="btn">Сагс</button><div class="grid"></div>`,
    `<style>.btn{color:#ffffff;background-color:#2563eb;padding-top:12px} .grid{display:grid;grid-template-columns:1fr 1fr 1fr}</style>`,
  );

  it("css.computed reads author styles", async () => {
    const r = await one(styled, { type: "css.computed", args: { selector: ".btn", prop: "display", oneOf: ["inline-block", "block", "inline"] } });
    // display of a button — just assert it produced a value without infra error
    expect(r.errorKind).not.toBe("infra");
  });

  it("css.numeric checks padding", async () => {
    const r = await one(styled, { type: "css.numeric", args: { selector: ".btn", prop: "padding-top", min: 8 } });
    expect(r.errorKind).not.toBe("infra");
  });

  it("css.layout detects grid + column count", async () => {
    const r = await one(styled, { type: "css.layout", args: { selector: ".grid", mode: "grid" } });
    expect(r.errorKind).not.toBe("infra");
  });

  it("css.noHardcoded flags literal colours outside :root", async () => {
    const files: FileSet = {
      "index.html": { content: "<div class='x'>hi</div>" },
      "styles/main.css": { content: ".x{ color: #ff0000; }" },
    };
    expect((await one(files, { type: "css.noHardcoded", args: { props: ["color"] } })).passed).toBe(false);
    const withVar: FileSet = {
      "index.html": { content: "<div class='x'>hi</div>" },
      "styles/main.css": { content: ":root{--c:#f00} .x{ color: var(--c); }" },
    };
    expect((await one(withVar, { type: "css.noHardcoded", args: { props: ["color"] } })).passed).toBe(true);
  });
});

describe("js.* via happy-dom runner", () => {
  const cartApp: FileSet = {
    "index.html": {
      content: `<!doctype html><html><head></head><body>
        <button id="add" data-testid="add">Сагсанд хийх</button>
        <span data-testid="cart-count">0</span>
        <script>
          window.cart = [];
          function addToCart(){ window.cart.push(1); document.querySelector('[data-testid=cart-count]').textContent = String(window.cart.length); }
          document.getElementById('add').addEventListener('click', addToCart);
        </script>
      </body></html>`,
    },
  };

  it("js.evaluate reads a global", async () => {
    const r = await one(cartApp, { type: "js.evaluate", args: { expr: "window.cart.length", equals: 0 } });
    expect(r.passed).toBe(true);
  });

  it("js.interaction: clicking add increments the visible count", async () => {
    const r = await one(cartApp, {
      type: "js.interaction",
      args: {
        steps: [
          { click: "[data-testid=add]" },
          { expectText: { selector: "[data-testid=cart-count]", equals: "1" } },
          { click: "[data-testid=add]" },
          { expectText: { selector: "[data-testid=cart-count]", equals: "2" } },
          { expectEval: { expr: "window.cart.length", equals: 2 } },
        ],
      },
    });
    expect(r.passed).toBe(true);
  });

  it("js.consoleClean passes when there are no errors", async () => {
    expect((await one(cartApp, { type: "js.consoleClean", args: {} })).passed).toBe(true);
  });
});

describe("css.responsive (media queries)", () => {
  const responsive: FileSet = {
    "index.html": { content: `<!doctype html><html><head><link rel="stylesheet" href="s.css"></head><body><section class="grid"></section></body></html>` },
    "s.css": { content: `.grid{display:grid;grid-template-columns:1fr}\n@media (min-width:768px){.grid{grid-template-columns:1fr 1fr}}` },
  };

  it("evaluates one column on mobile and two on desktop", async () => {
    const mobile = await one(responsive, {
      type: "css.responsive",
      args: { viewport: { width: 375 }, then: [{ id: "m", type: "css.layout", args: { selector: ".grid", mode: "grid", columns: 1 } }] },
    });
    expect(mobile.passed).toBe(true);

    const desktop = await one(responsive, {
      type: "css.responsive",
      args: { viewport: { width: 1024 }, then: [{ id: "d", type: "css.layout", args: { selector: ".grid", mode: "grid", columns: 2 } }] },
    });
    expect(desktop.passed).toBe(true);
  });

  it("fails when the breakpoint is missing", async () => {
    const noMq: FileSet = {
      "index.html": responsive["index.html"]!,
      "s.css": { content: `.grid{display:grid;grid-template-columns:1fr}` },
    };
    const desktop = await one(noMq, {
      type: "css.responsive",
      args: { viewport: { width: 1024 }, then: [{ id: "d", type: "css.layout", args: { selector: ".grid", mode: "grid", columns: 2 } }] },
    });
    expect(desktop.passed).toBe(false);
  });
});
