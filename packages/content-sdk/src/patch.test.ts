import { describe, expect, it } from "vitest";
import { applyPatch, collectAssetRefs, PatchError, type FileSet } from "./patch";

const fs = (o: Record<string, string>): FileSet =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { content: v }]));

describe("applyPatch", () => {
  it("create adds a file but never clobbers an existing one", () => {
    const out = applyPatch(fs({ "a.txt": "student" }), [
      { op: "create", path: "a.txt", content: "starter" },
      { op: "create", path: "b.txt", content: "new" },
    ]);
    expect(out["a.txt"]!.content).toBe("student"); // preserved
    expect(out["b.txt"]!.content).toBe("new");
  });

  it("create with force overwrites", () => {
    const out = applyPatch(fs({ "a.txt": "student" }), [{ op: "create", path: "a.txt", content: "x" }], { force: true });
    expect(out["a.txt"]!.content).toBe("x");
  });

  it("replace, append, delete, rename", () => {
    let out = applyPatch(fs({ "a.txt": "1" }), [{ op: "replace", path: "a.txt", content: "2" }]);
    expect(out["a.txt"]!.content).toBe("2");
    out = applyPatch(fs({ "a.txt": "1" }), [{ op: "append", path: "a.txt", content: "2" }]);
    expect(out["a.txt"]!.content).toBe("12");
    out = applyPatch(fs({ "a.txt": "1", "b.txt": "2" }), [{ op: "delete", path: "a.txt" }]);
    expect(out["a.txt"]).toBeUndefined();
    out = applyPatch(fs({ "a.txt": "1" }), [{ op: "rename", path: "a.txt", to: "c.txt" }]);
    expect(out["c.txt"]!.content).toBe("1");
    expect(out["a.txt"]).toBeUndefined();
  });

  it("insertAfter inserts after the anchor", () => {
    const out = applyPatch(fs({ "i.html": "<main>\n  <!-- here -->\n</main>" }), [
      { op: "insertAfter", path: "i.html", anchor: "<!-- here -->", content: "<h1>Shop.mn</h1>" },
    ]);
    expect(out["i.html"]!.content).toContain("<!-- here -->\n<h1>Shop.mn</h1>");
  });

  it("insertAfter throws a named error when the anchor is missing", () => {
    try {
      applyPatch(fs({ "i.html": "no marker" }), [
        { op: "insertAfter", path: "i.html", anchor: "<!-- here -->", content: "x" },
      ]);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(PatchError);
      expect((e as PatchError).code).toBe("insert_anchor_not_found");
    }
  });

  it("rename throws when the source is missing", () => {
    expect(() => applyPatch(fs({}), [{ op: "rename", path: "a", to: "b" }])).toThrow(PatchError);
  });

  it("does not mutate the input (pure)", () => {
    const input = fs({ "a.txt": "1" });
    applyPatch(input, [{ op: "replace", path: "a.txt", content: "2" }]);
    expect(input["a.txt"]!.content).toBe("1");
  });

  it("resolves @asset refs via the resolver, else leaves a marker", () => {
    const withResolver = applyPatch(fs({}), [{ op: "create", path: "img.txt", content: "@asset:products/deel.jpg" }], {
      resolveAsset: (ref) => `https://cdn/${ref}`,
    });
    expect(withResolver["img.txt"]!.content).toBe("https://cdn/products/deel.jpg");
    const withoutResolver = applyPatch(fs({}), [{ op: "create", path: "img.txt", content: "@asset:products/deel.jpg" }]);
    expect(withoutResolver["img.txt"]!.content).toContain("@asset products/deel.jpg");
  });

  it("collectAssetRefs finds dependencies", () => {
    expect(
      collectAssetRefs([
        { op: "create", path: "a", content: "@asset:x.png" },
        { op: "append", path: "b", content: "plain" },
      ]),
    ).toEqual(["x.png"]);
  });

  it("round-trips: starter → solution reaches the reference state", () => {
    const starter = applyPatch(fs({}), [{ op: "create", path: "index.html", content: "<main>\n  <!-- энд бичнэ үү -->\n</main>\n" }]);
    const solved = applyPatch(starter, [
      { op: "insertAfter", path: "index.html", anchor: "<!-- энд бичнэ үү -->", content: "<article class=\"product-card\"></article>" },
    ]);
    expect(solved["index.html"]!.content).toContain("<article class=\"product-card\">");
  });
});
