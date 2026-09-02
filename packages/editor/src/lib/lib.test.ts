import { describe, expect, it } from "vitest";
import { languageForPath } from "./language";
import { findMarker, intersectsRange } from "./marker";
import { keyStripFor } from "./keystrip";
import { buildTree } from "./tree";

describe("languageForPath", () => {
  it("maps extensions", () => {
    expect(languageForPath("index.html")).toBe("html");
    expect(languageForPath("styles/main.css")).toBe("css");
    expect(languageForPath("js/cart.js")).toBe("javascript");
    expect(languageForPath("app/page.tsx")).toBe("tsx");
    expect(languageForPath("data.json")).toBe("json");
    expect(languageForPath("README")).toBe("text");
  });
});

describe("marker", () => {
  it("finds a marker range", () => {
    expect(findMarker("<main>\n  <!-- энд -->\n</main>", "<!-- энд -->")).toEqual({ from: 9, to: 21 });
    expect(findMarker("no marker", "<!-- энд -->")).toBeNull();
  });
  it("detects range intersection", () => {
    const ranges = [{ from: 10, to: 20 }];
    expect(intersectsRange(5, 12, ranges)).toBe(true);
    expect(intersectsRange(20, 25, ranges)).toBe(false); // touching the end is fine
    expect(intersectsRange(0, 5, ranges)).toBe(false);
  });
});

describe("keyStripFor", () => {
  it("is context-aware", () => {
    expect(keyStripFor("html").some((t) => t.label === "</>")).toBe(true);
    expect(keyStripFor("javascript").some((t) => t.label === "=>")).toBe(true);
    expect(keyStripFor("css").some((t) => t.label === ":")).toBe(true);
  });
  it("bracket tokens place the cursor inside the pair", () => {
    const brace = keyStripFor("javascript").find((t) => t.label === "{");
    expect(brace).toEqual({ label: "{", insert: "{}", cursorOffset: -1 });
  });
});

describe("buildTree", () => {
  it("nests folders and sorts dirs first", () => {
    const tree = buildTree(["index.html", "styles/main.css", "js/cart.js", "js/render.js"]);
    const names = tree.map((n) => n.name);
    expect(names).toEqual(["js", "styles", "index.html"]); // dirs first, then files
    const js = tree.find((n) => n.name === "js");
    expect(js?.type).toBe("dir");
    if (js?.type === "dir") expect(js.children.map((c) => c.name)).toEqual(["cart.js", "render.js"]);
  });
});
