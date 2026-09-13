import { describe, it, expect } from "vitest";
import { runChecksOnFiles } from "./server";
import type { CheckDef, FileSet } from "./types";

/**
 * Smoke tests for the React Native → DOM teaching shim: prove that idiomatic RN
 * source (imported from "react-native"/"expo") renders real, assertable DOM in
 * the server grader, so the mobile course's dom.* / js.interaction checks work.
 */

function rnApp(appJsx: string): FileSet {
  return {
    "index.html": {
      content:
        '<!doctype html><html><head></head><body><div id="root"></div>' +
        '<script src="src/App.jsx"></script></body></html>',
    },
    "src/App.jsx": { content: appJsx },
  };
}

async function run(app: string, checks: CheckDef[]) {
  return runChecksOnFiles(rnApp(app), [
    ...checks,
    { id: "__clean", type: "js.consoleClean", args: {}, onFail: { mn: "" } },
  ]);
}

describe("react-native shim", () => {
  it("renders View + Text into #root with no console errors", async () => {
    const app = `
      import { View, Text, StyleSheet } from "react-native";
      import { registerRootComponent } from "expo";
      function App() {
        return (
          <View style={styles.box}>
            <Text style={styles.title}>Shop.mn</Text>
          </View>
        );
      }
      const styles = StyleSheet.create({
        box: { padding: 16 },
        title: { fontSize: 24, fontWeight: "bold" },
      });
      registerRootComponent(App);
    `;
    const results = await run(app, [
      { id: "t", type: "dom.text", args: { selector: '#root [data-rn="text"]', contains: "Shop.mn" }, onFail: { mn: "" } },
      { id: "v", type: "dom.exists", args: { selector: '#root [data-rn="view"]' }, onFail: { mn: "" } },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });

  it("FlatList renders one node per data item", async () => {
    const app = `
      import { View, Text, FlatList } from "react-native";
      import { registerRootComponent } from "expo";
      const DATA = [{ id: "1", name: "Сүү" }, { id: "2", name: "Талх" }, { id: "3", name: "Өндөг" }];
      function App() {
        return (
          <FlatList
            data={DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Text>{item.name}</Text>}
          />
        );
      }
      registerRootComponent(App);
    `;
    const results = await run(app, [
      { id: "count", type: "dom.count", args: { selector: '#root [data-rn="text"]', equals: 3 }, onFail: { mn: "" } },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });

  it("Pressable onPress updates state (js.interaction)", async () => {
    const app = `
      import { View, Text, Pressable } from "react-native";
      import { useState } from "react";
      import { registerRootComponent } from "expo";
      function App() {
        const [n, setN] = useState(0);
        return (
          <View>
            <Text nativeID="count">{n}</Text>
            <Pressable nativeID="add" onPress={() => setN(n + 1)}>
              <Text>Нэмэх</Text>
            </Pressable>
          </View>
        );
      }
      registerRootComponent(App);
    `;
    const results = await run(app, [
      {
        id: "click",
        type: "js.interaction",
        args: {
          steps: [
            { click: "#add" },
            { expectText: { selector: "#count", equals: "1" } },
          ],
        },
        onFail: { mn: "" },
      },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });

  it("SectionList renders section headers and items", async () => {
    const app = `
      import { View, Text, SectionList } from "react-native";
      import { registerRootComponent } from "expo";
      const SECTIONS = [
        { title: "Жимс", data: [{ id: "1", name: "Алим" }, { id: "2", name: "Гадил" }] },
        { title: "Ногоо", data: [{ id: "3", name: "Лууван" }] },
      ];
      function App() {
        return (
          <SectionList
            sections={SECTIONS}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => <Text testID="head">{section.title}</Text>}
            renderItem={({ item }) => <Text testID="item">{item.name}</Text>}
          />
        );
      }
      registerRootComponent(App);
    `;
    const results = await run(app, [
      { id: "heads", type: "dom.count", args: { selector: '[data-testid="head"]', equals: 2 }, onFail: { mn: "" } },
      { id: "items", type: "dom.count", args: { selector: '[data-testid="item"]', equals: 3 }, onFail: { mn: "" } },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });

  it("Modal shows only while visible; a toggle reveals it", async () => {
    const app = `
      import { View, Text, Pressable, Modal } from "react-native";
      import { useState } from "react";
      import { registerRootComponent } from "expo";
      function App() {
        const [open, setOpen] = useState(false);
        return (
          <View>
            <Pressable nativeID="open" onPress={() => setOpen(true)}><Text>Нээх</Text></Pressable>
            <Modal visible={open} transparent>
              <View><Text nativeID="dialog">Баталгаажуулах уу?</Text></View>
            </Modal>
          </View>
        );
      }
      registerRootComponent(App);
    `;
    const results = await run(app, [
      {
        id: "toggle",
        type: "js.interaction",
        args: { steps: [{ click: "#open" }, { waitFor: '[data-rn="modal"]' }, { expectText: { selector: "#dialog", contains: "Баталгаажуулах" } }] },
        onFail: { mn: "" },
      },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });

  it("Animated.timing jumps opacity to its final value", async () => {
    const app = `
      import { View, Animated, Pressable, Text } from "react-native";
      import { useRef } from "react";
      import { registerRootComponent } from "expo";
      function App() {
        const fade = useRef(new Animated.Value(0)).current;
        return (
          <View>
            <Pressable nativeID="go" onPress={() => Animated.timing(fade, { toValue: 1, duration: 300 }).start()}>
              <Text>Гарга</Text>
            </Pressable>
            <Animated.View nativeID="card" style={{ opacity: fade }}>
              <Text>Сайн уу</Text>
            </Animated.View>
          </View>
        );
      }
      registerRootComponent(App);
    `;
    const results = await run(app, [
      {
        id: "fade",
        type: "js.interaction",
        args: {
          steps: [
            { click: "#go" },
            { expectEval: { expr: "Math.round(Number(getComputedStyle(document.getElementById('card')).opacity))", equals: 1 } },
          ],
        },
        onFail: { mn: "" },
      },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });

  it("ast.imports sees the react-native import on the raw source", async () => {
    const app = `
      import { View } from "react-native";
      import { registerRootComponent } from "expo";
      function App() { return <View testID="root-view" />; }
      registerRootComponent(App);
    `;
    const results = await run(app, [
      { id: "imp", type: "ast.imports", args: { file: "src/App.jsx", from: "react-native", named: "View" }, onFail: { mn: "" } },
      { id: "tid", type: "dom.exists", args: { selector: '[data-testid="root-view"]' }, onFail: { mn: "" } },
    ]);
    for (const r of results) expect(r, JSON.stringify(r)).toMatchObject({ passed: true });
  });
});
