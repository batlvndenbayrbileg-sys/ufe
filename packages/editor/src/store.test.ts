import { describe, expect, it } from "vitest";
import { createWorkspaceStore } from "./store";

const seed = () => {
  const store = createWorkspaceStore();
  store.getState().init({
    courseId: "ip-101",
    files: {
      "index.html": { content: "<h1>Shop.mn</h1>" },
      "styles/main.css": { content: "" },
      "products.json": { content: "[]", readonly: true },
    },
    visibleFiles: ["index.html", "styles/main.css", "products.json"],
    readOnlyFiles: ["products.json"],
    openFiles: ["index.html"],
    activeFile: "index.html",
  });
  return store;
};

describe("workspace store", () => {
  it("initialises tabs and active file", () => {
    const s = seed().getState();
    expect(s.activeFile).toBe("index.html");
    expect(s.openTabs).toContain("index.html");
    expect(s.dirty).toBe(false);
  });

  it("edits content and marks dirty", () => {
    const store = seed();
    store.getState().setFileContent("index.html", "<h1>Hi</h1>");
    expect(store.getState().files["index.html"]!.content).toBe("<h1>Hi</h1>");
    expect(store.getState().dirty).toBe(true);
  });

  it("refuses to edit a read-only file", () => {
    const store = seed();
    store.getState().setFileContent("products.json", "hacked");
    expect(store.getState().files["products.json"]!.content).toBe("[]");
    expect(store.getState().isReadOnly("products.json")).toBe(true);
  });

  it("opens, activates and closes tabs", () => {
    const store = seed();
    store.getState().openFile("styles/main.css");
    expect(store.getState().activeFile).toBe("styles/main.css");
    store.getState().closeFile("styles/main.css");
    expect(store.getState().openTabs).not.toContain("styles/main.css");
    expect(store.getState().activeFile).toBe("index.html"); // falls back
  });

  it("applies a content patch (never clobbering student files without force)", () => {
    const store = seed();
    store.getState().applyContentPatch([{ op: "create", path: "index.html", content: "STARTER" }]);
    expect(store.getState().files["index.html"]!.content).toBe("<h1>Shop.mn</h1>"); // preserved
    store.getState().applyContentPatch([{ op: "create", path: "js/new.js", content: "x" }]);
    expect(store.getState().files["js/new.js"]!.content).toBe("x");
  });

  it("snapshot + restore powers reset-with-undo", () => {
    const store = seed();
    const snap = store.getState().snapshot();
    store.getState().setFileContent("index.html", "changed");
    expect(store.getState().files["index.html"]!.content).toBe("changed");
    store.getState().restore(snap);
    expect(store.getState().files["index.html"]!.content).toBe("<h1>Shop.mn</h1>");
  });
});
