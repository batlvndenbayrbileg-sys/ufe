// Source for the React Native → DOM shim. Bundled/minified by
// scripts/build-rn-runtime.mjs into:
//   - src/rn-runtime.generated.ts  (RN_RUNTIME_JS, inlined by the server grader)
//   - ../../apps/web/public/lib/rn-runtime.js  (fetched on demand by the browser preview)
//
// It is a *teaching* shim, not react-native-web: every RN primitive renders a
// real DOM node tagged `data-rn="<kind>"` so the platform's dom.* / js.interaction
// checkers can assert against a stable, honest structure. It expects window.React
// and window.ReactDOM (the React runtime) to be present already.
(() => {
  "use strict";
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  if (!React || !ReactDOM) {
    console.error("React Native shim: window.React / window.ReactDOM байхгүй байна.");
    return;
  }
  const h = React.createElement;

  // ── styles ────────────────────────────────────────────────────────────────
  // RN accepts a style object, an array of them, or falsy. Flatten to one object.
  function flatten(style) {
    if (!style) return {};
    if (Array.isArray(style)) {
      const out = {};
      for (const s of style) Object.assign(out, flatten(s));
      return out;
    }
    return style;
  }
  // Translate the RN-only shorthands DOM does not understand.
  function mapRN(input) {
    const s = Object.assign({}, input);
    // Resolve Animated.Value objects anywhere in the style to their current
    // number, so Animated.View etc. are just the base components.
    for (const k in s) {
      if (s[k] && typeof s[k] === "object" && s[k].__anim) s[k] = s[k]._value;
    }
    // RN `transform` is an ARRAY of single-key objects ([{translateY: 8}, ...]);
    // CSS wants one string. Numbers get px (translate/perspective) or deg (rotate/skew).
    if (Array.isArray(s.transform)) {
      s.transform = s.transform
        .map((tr) => {
          const key = Object.keys(tr)[0];
          let v = tr[key];
          if (v && typeof v === "object" && v.__anim) v = v._value;
          const unit =
            typeof v === "number"
              ? /translate|perspective/.test(key)
                ? "px"
                : /rotate|skew/.test(key)
                  ? "deg"
                  : ""
              : "";
          return key + "(" + v + unit + ")";
        })
        .join(" ");
    }
    const pair = (short, a, b) => {
      if (s[short] != null) {
        if (s[a] == null) s[a] = s[short];
        if (s[b] == null) s[b] = s[short];
        delete s[short];
      }
    };
    pair("paddingHorizontal", "paddingLeft", "paddingRight");
    pair("paddingVertical", "paddingTop", "paddingBottom");
    pair("marginHorizontal", "marginLeft", "marginRight");
    pair("marginVertical", "marginTop", "marginBottom");
    if (s.elevation != null) {
      const e = s.elevation;
      if (s.boxShadow == null) s.boxShadow = "0 " + e / 2 + "px " + e + "px rgba(0,0,0,0.18)";
      delete s.elevation;
    }
    if (s.tintColor != null) delete s.tintColor;
    if (s.textAlignVertical != null) delete s.textAlignVertical;
    if (s.includeFontPadding != null) delete s.includeFontPadding;
    // RN `gap` is a number → px; React DOM handles that. `lineHeight` as a plain
    // number is dp in RN but unitless in CSS — make it px so text spacing matches.
    if (typeof s.lineHeight === "number") s.lineHeight = s.lineHeight + "px";
    return s;
  }
  function st(base, style) {
    return Object.assign({}, base, mapRN(flatten(style)));
  }

  // Only forward props a DOM node actually understands, so React never logs an
  // "unknown prop" warning (which would trip js.consoleClean).
  function common(props) {
    const p = {};
    if (props.testID != null) p["data-testid"] = props.testID;
    if (props.nativeID != null) p.id = props.nativeID;
    if (props.id != null) p.id = props.id;
    if (props.accessibilityLabel != null) p["aria-label"] = props.accessibilityLabel;
    if (props["aria-label"] != null) p["aria-label"] = props["aria-label"];
    if (props.accessibilityRole != null) p.role = props.accessibilityRole;
    return p;
  }

  const VIEW_BASE = {
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    alignContent: "flex-start",
  };
  const TEXT_BASE = { boxSizing: "border-box", margin: 0 };

  // ── core components ─────────────────────────────────────────────────────────
  function View(props) {
    return h("div", Object.assign({ "data-rn": "view", style: st(VIEW_BASE, props.style) }, common(props)), props.children);
  }
  function SafeAreaView(props) {
    return h("div", Object.assign({ "data-rn": "safeareaview", style: st(VIEW_BASE, props.style) }, common(props)), props.children);
  }
  function KeyboardAvoidingView(props) {
    return h("div", Object.assign({ "data-rn": "keyboardavoidingview", style: st(VIEW_BASE, props.style) }, common(props)), props.children);
  }

  function Text(props) {
    const extra = {};
    if (props.numberOfLines === 1) {
      Object.assign(extra, { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
    } else if (typeof props.numberOfLines === "number" && props.numberOfLines > 1) {
      Object.assign(extra, {
        display: "-webkit-box",
        WebkitLineClamp: String(props.numberOfLines),
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      });
    }
    const p = Object.assign(
      { "data-rn": "text", style: st(Object.assign({}, TEXT_BASE, extra), props.style) },
      common(props),
    );
    if (props.onPress) {
      p.onClick = props.onPress;
      p.role = p.role || "button";
      p.style = Object.assign({ cursor: "pointer" }, p.style);
    }
    return h("span", p, props.children);
  }

  function Image(props) {
    const src = typeof props.source === "string" ? props.source : props.source && props.source.uri;
    const fit = { cover: "cover", contain: "contain", stretch: "fill", center: "none", repeat: "cover" }[props.resizeMode || "cover"];
    return h(
      "img",
      Object.assign(
        {
          "data-rn": "image",
          src: src || "",
          alt: props.accessibilityLabel || props.alt || "",
          style: st({ objectFit: fit, display: "block" }, props.style),
        },
        common(props),
      ),
    );
  }

  function ScrollView(props) {
    const horizontal = !!props.horizontal;
    const dir = horizontal
      ? { flexDirection: "row", overflowX: "auto", overflowY: "hidden" }
      : { flexDirection: "column", overflowY: "auto", overflowX: "hidden" };
    const inner = h(
      "div",
      { "data-rn": "scrollview-content", style: st({ display: "flex", flexDirection: dir.flexDirection, boxSizing: "border-box" }, props.contentContainerStyle) },
      props.children,
    );
    return h(
      "div",
      Object.assign(
        { "data-rn": "scrollview", style: st(Object.assign({ display: "flex", boxSizing: "border-box", flexGrow: 1, flexBasis: 0 }, dir), props.style) },
        common(props),
      ),
      props.refreshControl ? renderMaybe(props.refreshControl) : null,
      inner,
    );
  }

  function renderMaybe(x) {
    if (x == null) return null;
    if (React.isValidElement(x)) return x;
    if (typeof x === "function") return h(x);
    return x;
  }

  function FlatList(props) {
    const data = props.data || [];
    const keyEx = props.keyExtractor || ((item, i) => (item && item.id != null ? String(item.id) : String(i)));
    const Sep = props.ItemSeparatorComponent;
    const rows = data.map((item, index) => {
      const el = props.renderItem ? props.renderItem({ item, index, separators: {} }) : null;
      const sep = Sep && index < data.length - 1 ? renderMaybe(Sep) : null;
      return h(React.Fragment, { key: keyEx(item, index) }, el, sep);
    });
    const cols = props.numColumns && props.numColumns > 1
      ? h("div", { "data-rn": "flatlist-content", style: st({ display: "grid", gridTemplateColumns: "repeat(" + props.numColumns + ", 1fr)" }, props.contentContainerStyle) }, rows)
      : h("div", { "data-rn": "flatlist-content", style: st({ display: "flex", flexDirection: props.horizontal ? "row" : "column" }, props.contentContainerStyle) }, rows);
    const overflow = props.horizontal
      ? { overflowX: "auto", overflowY: "hidden" }
      : { overflowY: "auto", overflowX: "hidden" };
    return h(
      "div",
      Object.assign({ "data-rn": "flatlist", style: st(Object.assign({ display: "flex", flexDirection: "column", boxSizing: "border-box", flexGrow: 1, flexBasis: 0 }, overflow), props.style) }, common(props)),
      props.refreshControl ? renderMaybe(props.refreshControl) : null,
      renderMaybe(props.ListHeaderComponent),
      data.length === 0 ? renderMaybe(props.ListEmptyComponent) : cols,
      renderMaybe(props.ListFooterComponent),
    );
  }

  function Pressable(props) {
    const [pressed, setPressed] = React.useState(false);
    const style = typeof props.style === "function" ? props.style({ pressed }) : props.style;
    const children = typeof props.children === "function" ? props.children({ pressed }) : props.children;
    const p = Object.assign(
      {
        "data-rn": "pressable",
        role: "button",
        tabIndex: 0,
        onClick: props.disabled ? undefined : props.onPress,
        onMouseDown: () => setPressed(true),
        onMouseUp: () => setPressed(false),
        onMouseLeave: () => setPressed(false),
        style: st(Object.assign({}, VIEW_BASE, { cursor: props.disabled ? "default" : "pointer" }), style),
      },
      common(props),
    );
    return h("div", p, children);
  }

  function Touchable(kind) {
    return function (props) {
      const p = Object.assign(
        {
          "data-rn": kind,
          role: "button",
          tabIndex: 0,
          onClick: props.disabled ? undefined : props.onPress,
          style: st(Object.assign({}, VIEW_BASE, { cursor: props.disabled ? "default" : "pointer", opacity: props.disabled ? 0.5 : 1 }), props.style),
        },
        common(props),
      );
      return h("div", p, props.children);
    };
  }

  function Button(props) {
    return h(
      "button",
      Object.assign(
        {
          "data-rn": "button",
          type: "button",
          disabled: !!props.disabled,
          onClick: props.disabled ? undefined : props.onPress,
          style: {
            backgroundColor: props.color || "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            fontSize: 16,
            cursor: props.disabled ? "default" : "pointer",
            opacity: props.disabled ? 0.5 : 1,
          },
        },
        common(props),
      ),
      props.title,
    );
  }

  function TextInput(props) {
    const onChange = (e) => {
      if (props.onChangeText) props.onChangeText(e.target.value);
      if (props.onChange) props.onChange(e);
    };
    const style = st({ boxSizing: "border-box", fontSize: 16 }, props.style);
    const base = Object.assign({ "data-rn": "textinput", placeholder: props.placeholder, onChange, style }, common(props));
    if (props.value != null) base.value = props.value;
    else if (props.defaultValue != null) base.defaultValue = props.defaultValue;
    if (props.editable === false) base.readOnly = true;
    if (props.multiline) {
      if (props.numberOfLines) base.rows = props.numberOfLines;
      return h("textarea", base);
    }
    base.type = props.secureTextEntry
      ? "password"
      : props.keyboardType === "numeric" || props.keyboardType === "number-pad"
        ? "number"
        : props.keyboardType === "email-address"
          ? "email"
          : "text";
    if (props.keyboardType === "numeric" || props.keyboardType === "number-pad") base.inputMode = "numeric";
    return h("input", base);
  }

  function Switch(props) {
    return h(
      "input",
      Object.assign(
        {
          "data-rn": "switch",
          type: "checkbox",
          checked: !!props.value,
          onChange: (e) => props.onValueChange && props.onValueChange(e.target.checked),
        },
        common(props),
      ),
    );
  }

  function ActivityIndicator(props) {
    const size = props.size === "large" ? 36 : typeof props.size === "number" ? props.size : 20;
    return h("div", Object.assign(
      {
        "data-rn": "activityindicator",
        role: "progressbar",
        "aria-label": "Ачаалж байна",
        style: st(
          {
            width: size,
            height: size,
            border: "3px solid rgba(0,0,0,0.15)",
            borderTopColor: props.color || "#2563eb",
            borderRadius: "50%",
            animation: "khiye-rn-spin 0.8s linear infinite",
          },
          props.style,
        ),
      },
      common(props),
    ));
  }

  function StatusBar() {
    return null;
  }

  // ── APIs ────────────────────────────────────────────────────────────────────
  const StyleSheet = {
    create: (obj) => obj,
    flatten: (style) => flatten(style),
    compose: (a, b) => [a, b],
    hairlineWidth: 1,
    absoluteFill: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
    absoluteFillObject: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  };

  const Platform = {
    OS: "ios",
    Version: 17,
    isPad: false,
    isTV: false,
    select: (spec) =>
      spec && ("ios" in spec ? spec.ios : "native" in spec ? spec.native : "default" in spec ? spec.default : spec.web),
  };

  const win = () => ({
    width: window.innerWidth || 390,
    height: window.innerHeight || 844,
    scale: 1,
    fontScale: 1,
  });
  const Dimensions = {
    get: () => win(),
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  };
  function useWindowDimensions() {
    return win();
  }
  function useColorScheme() {
    return "light";
  }

  const Alert = {
    alert: (title, message, buttons) => {
      window.__rnLastAlert = { title: title, message: message };
      const host = document.body || document.documentElement;
      const box = document.createElement("div");
      box.setAttribute("data-rn", "alert");
      box.setAttribute("role", "alertdialog");
      box.style.cssText =
        "position:fixed;left:50%;top:24px;transform:translateX(-50%);z-index:9999;max-width:280px;" +
        "background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:16px;text-align:center;font:14px system-ui,sans-serif;color:#18181b;";
      if (title) {
        const t = document.createElement("div");
        t.setAttribute("data-rn", "alert-title");
        t.style.cssText = "font-weight:700;margin-bottom:6px;";
        t.textContent = String(title);
        box.appendChild(t);
      }
      if (message) {
        const m = document.createElement("div");
        m.setAttribute("data-rn", "alert-message");
        m.style.cssText = "opacity:.8;margin-bottom:10px;";
        m.textContent = String(message);
        box.appendChild(m);
      }
      const list = buttons && buttons.length ? buttons : [{ text: "OK" }];
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;justify-content:center;";
      list.forEach((b) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = b.text || "OK";
        btn.style.cssText = "border:none;background:#2563eb;color:#fff;border-radius:8px;padding:8px 14px;cursor:pointer;";
        btn.onclick = () => {
          if (b.onPress) b.onPress();
          box.remove();
        };
        row.appendChild(btn);
      });
      box.appendChild(row);
      host.appendChild(box);
    },
  };

  const Linking = {
    openURL: () => Promise.resolve(),
    canOpenURL: () => Promise.resolve(true),
    getInitialURL: () => Promise.resolve(null),
    addEventListener: () => ({ remove: () => {} }),
  };

  // ── mounting (AppRegistry / Expo.registerRootComponent) ──────────────────────
  const roots = new WeakMap();
  const registry = {};
  function resolveNode(rootTag) {
    let node = rootTag;
    if (typeof rootTag === "string") node = document.getElementById(rootTag);
    if (node && node.rootTag && typeof node.rootTag === "object") node = node.rootTag;
    if (!node) node = document.getElementById("root");
    if (!node) {
      node = document.createElement("div");
      node.id = "root";
      (document.body || document.documentElement).appendChild(node);
    }
    return node;
  }
  function mount(element, rootTag) {
    const node = resolveNode(rootTag);
    let root = roots.get(node);
    if (!root) {
      root = ReactDOM.createRoot(node);
      roots.set(node, root);
    }
    root.render(element);
    return root;
  }
  const AppRegistry = {
    registerComponent: (name, factory) => {
      registry[name] = factory;
      return name;
    },
    runApplication: (name, params) => {
      const factory = registry[name];
      if (!factory) throw new Error("AppRegistry: '" + name + "' бүртгэгдээгүй байна.");
      mount(h(factory()), params && params.rootTag);
    },
    getAppKeys: () => Object.keys(registry),
  };
  function registerRootComponent(App) {
    mount(h(App), "root");
  }

  // AsyncStorage backed by the harness localStorage shim.
  const store = () => window.localStorage;
  const AsyncStorage = {
    getItem: (k) => Promise.resolve(store().getItem(k)),
    setItem: (k, v) => {
      store().setItem(k, String(v));
      return Promise.resolve();
    },
    removeItem: (k) => {
      store().removeItem(k);
      return Promise.resolve();
    },
    clear: () => {
      store().clear();
      return Promise.resolve();
    },
    getAllKeys: () => Promise.resolve(Object.keys(store())),
    mergeItem: (k, v) => {
      try {
        const cur = JSON.parse(store().getItem(k) || "{}");
        store().setItem(k, JSON.stringify(Object.assign(cur, JSON.parse(v))));
      } catch (e) {
        store().setItem(k, v);
      }
      return Promise.resolve();
    },
    multiGet: (keys) => Promise.resolve(keys.map((k) => [k, store().getItem(k)])),
  };

  // ── SectionList (real grouped sections) ─────────────────────────────────────
  function SectionList(props) {
    const sections = props.sections || [];
    const keyEx = props.keyExtractor || ((item, i) => (item && item.id != null ? String(item.id) : String(i)));
    const rows = [];
    sections.forEach((section, si) => {
      if (props.renderSectionHeader) {
        rows.push(h(React.Fragment, { key: "sh" + si }, renderMaybe(props.renderSectionHeader({ section }))));
      }
      (section.data || []).forEach((item, index) => {
        const el = props.renderItem ? props.renderItem({ item, index, section }) : null;
        rows.push(h(React.Fragment, { key: si + "-" + keyEx(item, index) }, el));
      });
      if (props.renderSectionFooter) {
        rows.push(h(React.Fragment, { key: "sf" + si }, renderMaybe(props.renderSectionFooter({ section }))));
      }
    });
    return h(
      "div",
      Object.assign({ "data-rn": "sectionlist", style: st({ display: "flex", flexDirection: "column", boxSizing: "border-box", flexGrow: 1, flexBasis: 0, overflowY: "auto" }, props.style) }, common(props)),
      props.refreshControl ? renderMaybe(props.refreshControl) : null,
      renderMaybe(props.ListHeaderComponent),
      h("div", { "data-rn": "sectionlist-content", style: st({ display: "flex", flexDirection: "column" }, props.contentContainerStyle) },
        sections.length === 0 ? renderMaybe(props.ListEmptyComponent) : rows),
      renderMaybe(props.ListFooterComponent),
    );
  }

  // ── RefreshControl (pull-to-refresh, driven by a button in the shim) ─────────
  function RefreshControl(props) {
    return h(
      "div",
      { "data-rn": "refresh-control", style: { display: "flex", justifyContent: "center", padding: props.refreshing ? 8 : 4 } },
      props.refreshing
        ? h("div", {
            "data-rn": "refresh-spinner",
            role: "progressbar",
            "aria-label": "Дахин ачаалж байна",
            style: { width: 18, height: 18, border: "2px solid rgba(0,0,0,.15)", borderTopColor: props.tintColor || "#2563eb", borderRadius: "50%", animation: "khiye-rn-spin .8s linear infinite" },
          })
        : h("button", {
            "data-rn": "refresh-button",
            type: "button",
            onClick: props.onRefresh,
            style: { border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", fontSize: 13, padding: "4px 0" },
          }, "↻ Дахин ачаалах"),
    );
  }

  // ── Modal (overlay, shown only while visible) ────────────────────────────────
  function Modal(props) {
    if (!props.visible) return null;
    return h(
      "div",
      Object.assign(
        {
          "data-rn": "modal",
          role: "dialog",
          "aria-modal": "true",
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            boxSizing: "border-box",
            alignItems: props.transparent ? "center" : "stretch",
            justifyContent: "center",
            background: props.transparent ? "rgba(0,0,0,0.45)" : "#ffffff",
          },
        },
        common(props),
      ),
      props.children,
    );
  }

  const Keyboard = {
    dismiss: () => {},
    addListener: () => ({ remove: () => {} }),
    removeAllListeners: () => {},
    removeListener: () => {},
  };
  const Vibration = { vibrate: () => {}, cancel: () => {} };
  const Appearance = { getColorScheme: () => "light", addChangeListener: () => ({ remove: () => {} }) };

  // ── Animated (end-state semantics: animations jump to their final value) ─────
  // No real tweening in a headless DOM; timing/spring jump to the final value and
  // notify subscribed Animated.* components so they re-render with the end style.
  function AnimatedValue(initial) {
    this._value = typeof initial === "number" ? initial : 0;
    this.__anim = true;
    this._listeners = new Set();
  }
  AnimatedValue.prototype.setValue = function (v) {
    this._value = v;
    this._listeners.forEach((f) => f());
  };
  AnimatedValue.prototype.__subscribe = function (fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  };
  AnimatedValue.prototype.setOffset = function () {};
  AnimatedValue.prototype.flattenOffset = function () {};
  AnimatedValue.prototype.addListener = function () { return "0"; };
  AnimatedValue.prototype.removeListener = function () {};
  AnimatedValue.prototype.stopAnimation = function (cb) { if (cb) cb(this._value); };
  AnimatedValue.prototype.interpolate = function (config) {
    const self = this;
    const out = { __anim: true, __subscribe: (fn) => self.__subscribe(fn) };
    Object.defineProperty(out, "_value", {
      configurable: true,
      get() {
        const inR = config.inputRange || [0, 1];
        const outR = config.outputRange || [0, 1];
        const x = self._value;
        for (let i = 0; i < inR.length - 1; i++) {
          if (x <= inR[i + 1] || i === inR.length - 2) {
            const span = inR[i + 1] - inR[i] || 1;
            const tt = Math.max(0, Math.min(1, (x - inR[i]) / span));
            const a = outR[i], b = outR[i + 1];
            if (typeof a === "number" && typeof b === "number") return a + (b - a) * tt;
            return tt < 0.5 ? a : b;
          }
        }
        return outR[outR.length - 1];
      },
    });
    return out;
  };
  function animController(applyFinal) {
    return {
      start: (cb) => { applyFinal(); if (cb) cb({ finished: true }); },
      stop: () => {},
      reset: () => {},
    };
  }
  // Gather every Animated.Value referenced anywhere in a style so the wrapper
  // can subscribe to their changes.
  function collectAnimVals(style) {
    const flat = flatten(style);
    const found = [];
    for (const k in flat) {
      const v = flat[k];
      if (v && typeof v === "object" && v.__anim) found.push(v);
      else if (Array.isArray(v)) {
        for (const seg of v) {
          if (seg && typeof seg === "object") {
            for (const kk in seg) if (seg[kk] && typeof seg[kk] === "object" && seg[kk].__anim) found.push(seg[kk]);
          }
        }
      }
    }
    return found;
  }
  function makeAnimated(Comp) {
    return function (props) {
      const [, force] = React.useReducer((x) => x + 1, 0);
      React.useEffect(() => {
        const unsubs = collectAnimVals(props.style).map((v) => v.__subscribe(force));
        return () => unsubs.forEach((u) => u());
      });
      return h(Comp, props);
    };
  }
  const AnimatedNoop = () => (x) => x;
  const Animated = {
    Value: function (v) { return new AnimatedValue(v); },
    ValueXY: function (v) { return new AnimatedValue(typeof v === "number" ? v : 0); },
    View: makeAnimated(View),
    Text: makeAnimated(Text),
    ScrollView: makeAnimated(ScrollView),
    Image: makeAnimated(Image),
    FlatList: makeAnimated(FlatList),
    timing: (value, config) => animController(() => value && value.setValue(config.toValue)),
    spring: (value, config) => animController(() => value && value.setValue(config.toValue)),
    decay: (value) => animController(() => {}),
    parallel: (list) => animController(() => (list || []).forEach((a) => a && a.start && a.start())),
    sequence: (list) => animController(() => (list || []).forEach((a) => a && a.start && a.start())),
    stagger: (_t, list) => animController(() => (list || []).forEach((a) => a && a.start && a.start())),
    loop: (anim) => animController(() => anim && anim.start && anim.start()),
    delay: () => animController(() => {}),
    createAnimatedComponent: (Comp) => Comp,
    Easing: { linear: (x) => x, ease: (x) => x, quad: (x) => x, cubic: (x) => x, in: AnimatedNoop, out: AnimatedNoop, inOut: AnimatedNoop, bezier: AnimatedNoop },
  };

  // One-time base CSS so #root fills the device and the spinner can spin.
  if (!document.getElementById("khiye-rn-base")) {
    const style = document.createElement("style");
    style.id = "khiye-rn-base";
    style.textContent =
      "html,body{height:100%;margin:0;}" +
      "body{font-family:system-ui,'Segoe UI',Roboto,sans-serif;background:#fff;color:#111;}" +
      "#root{min-height:100%;display:flex;flex-direction:column;}" +
      "[data-rn]{box-sizing:border-box;}" +
      "@keyframes khiye-rn-spin{to{transform:rotate(360deg);}}";
    (document.head || document.documentElement).appendChild(style);
  }

  window.ReactNative = {
    View: View,
    Text: Text,
    Image: Image,
    ImageBackground: View,
    ScrollView: ScrollView,
    FlatList: FlatList,
    SectionList: SectionList,
    RefreshControl: RefreshControl,
    Modal: Modal,
    Animated: Animated,
    Keyboard: Keyboard,
    Vibration: Vibration,
    Appearance: Appearance,
    Pressable: Pressable,
    TouchableOpacity: Touchable("touchableopacity"),
    TouchableHighlight: Touchable("touchablehighlight"),
    TouchableWithoutFeedback: Touchable("touchablewithoutfeedback"),
    Button: Button,
    TextInput: TextInput,
    Switch: Switch,
    ActivityIndicator: ActivityIndicator,
    SafeAreaView: SafeAreaView,
    KeyboardAvoidingView: KeyboardAvoidingView,
    StatusBar: StatusBar,
    StyleSheet: StyleSheet,
    Platform: Platform,
    Dimensions: Dimensions,
    useWindowDimensions: useWindowDimensions,
    useColorScheme: useColorScheme,
    Alert: Alert,
    Linking: Linking,
    AppRegistry: AppRegistry,
  };
  window.Expo = { registerRootComponent: registerRootComponent };
  window.ExpoStatusBar = { StatusBar: StatusBar };
  window.RNAsyncStorage = AsyncStorage;
})();
