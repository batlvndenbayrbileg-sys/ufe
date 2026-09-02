# 07 — Code Editor & Live Preview Architecture

---

## 7.1 Package boundaries

```
packages/editor/          # CodeMirror wrapper, file tree, tabs, console, key strip
   ├─ Editor.tsx          # single-file editing surface
   ├─ Workspace.tsx       # tree + tabs + editor + console composition
   ├─ langs/              # html, css, js, jsx, ts, tsx, json, sql, prisma, md
   ├─ theme/khiye-dark.ts, khiye-light.ts
   └─ fs/                 # in-memory FS + IndexedDB persistence + sync client

packages/preview/
   ├─ PreviewHost.tsx     # iframe host, device frames, reload, popout
   ├─ harness/            # injected bundle: console bridge, error capture, checker runtime
   ├─ tier1.ts            # srcdoc/blob assembly for static projects
   ├─ tier2.ts            # WebContainer boot + Vite dev server + HMR proxy
   └─ tier3.ts            # remote sandbox URL + WS status channel
```

---

## 7.2 Editor: CodeMirror 6 (decision D1)

**Why not Monaco:** ~5 MB gzip, poor touch/IME behaviour, no usable mobile experience, heavy DOM.
Persona C (phone-first) and Persona B (mid-range Windows laptops) would both suffer.
**Why CodeMirror 6:** ~180 KB with the languages we need, real touch support, tree-sitter-quality
Lezer grammars, composable extensions, and excellent IME/Cyrillic handling.

**Cost of the decision:** no built-in TypeScript language service. We recover ~85% of the perceived
"VS Code feel" with:

| Feature | Implementation |
|---|---|
| Syntax highlighting | Lezer grammars per language |
| Autocomplete | `@codemirror/autocomplete` + per-stage completion sources: HTML tags/attrs, CSS props/values, JS globals, **project-aware symbols** (exports from the student's own files, parsed with a cheap AST walk), React hooks, Prisma model names |
| Type errors & IntelliSense (Stage 4+) | `@typescript/vfs` + the real TS compiler in a **web worker**, feeding CM diagnostics + hover + go-to-definition. Loaded lazily, only for `.ts/.tsx` lessons (adds ~2 MB, acceptable at week 6 on desktop; disabled on mobile). |
| Lint diagnostics | ESLint-in-worker (Stage 2+) with a tiny beginner-friendly rule set + our own rules (e.g. "`=` vs `==` in a condition") with **Mongolian messages** |
| Formatting | Prettier standalone in a worker, `Shift+Alt+F` and format-on-save-toggle |
| Multi-cursor, search/replace, folding, bracket match, indent guides | CM6 built-ins |
| Vim/Emacs mode | `@replit/codemirror-vim`, opt-in in settings |
| Minimap | Deliberately omitted — noise for beginners |

### Editor UX rules for beginners

- **Marker anchoring.** Tasks declare a `marker` comment; on task activation the editor scrolls to it,
  places the cursor, and pulses the line once. The student never hunts for "where do I type".
- **Read-only regions.** Files/regions the task must not change are visually greyed and non-editable
  (CM `EditorState.readOnly` via a range set), preventing "I broke it and don't know how".
- **Auto-close + auto-indent** on, but **no aggressive snippet expansion** — the student should type
  `<article>` themselves at least the first few times.
- **Reset controls** at two granularities: `Даалгаврыг эхнээс нь` (restore this task's starter) and
  `Файлыг сэргээх` (restore one file). Both take an automatic snapshot first and offer undo.
- **Undo history survives** task advancement within a lesson.

---

## 7.3 File system & persistence

```ts
type FileSet = Record<string /*path*/, { content: string; readonly?: boolean; binary?: boolean }>;
```

- In-memory source of truth (Zustand store) → **IndexedDB** mirror (immediate, per keystroke) →
  **server** `CodeSnapshot` (debounced 2 s, plus on blur / task change / submit / route change).
- Offline: edits continue; a queue flushes on reconnect. Conflict policy: **last-writer-wins per
  file**, with the server keeping both and showing a "Хоёр хувилбар олдлоо" chooser in the rare
  two-device case.
- Binary assets (product images) are not stored per student; they resolve from a CDN asset map
  (`images/deel.jpg` → `cdn.khiye.mn/assets/products/deel.jpg`) so student workspaces stay text-only
  and small (typical: 20–120 KB).
- Snapshot storage: full snapshot on submit; **diffs** in between (jsdiff patches), coalesced nightly.
  Retention: all submit snapshots forever (small), intermediate diffs 90 days.

---

## 7.4 Preview architecture

### Tier 1 — static (HTML/CSS/JS) — the majority of lessons

```
FileSet ──► assemble()  ──► srcdoc string
              • inline <style> from styles/*.css, rewritten url() → CDN
              • inline <script type="module"> from js/*.js with an import map
                mapping "./x.js" → blob: URLs of the student's other files
              • inject harness.js FIRST (console bridge, error capture, checker runtime)
              • inject <base href> so relative asset paths resolve
              ▼
   <iframe sandbox="allow-scripts allow-forms allow-modals allow-popups"
           srcdoc=… referrerpolicy="no-referrer" />
   Served from a SEPARATE ORIGIN: preview.khiye.dev  (never khiye.mn — see 13 §13.5)
```

- **No network round-trip.** Update latency = assemble (≈5 ms) + iframe paint. Meets the 150 ms budget.
- **Debounced 250 ms** while typing, plus immediate on `Ctrl+S` / blur.
- **State preservation across reloads:** the harness serialises `sessionStorage`, scroll position and
  focused element before teardown and restores after — otherwise a student styling a modal loses the
  modal on every keystroke. (This alone is worth a week of engineering.)
- CSS-only edits are applied by **hot-swapping the `<style>` node**, no reload at all.

### Tier 2 — React / Vite — WebContainers

```
Boot WebContainer (once per session, ~2.5 s cold)
  ├─ mount FileSet
  ├─ npm install from a PRE-WARMED node_modules snapshot (we ship a tarball; no registry hit)
  ├─ vite dev --port 5173
  └─ preview iframe ← WebContainer's served URL, HMR over the same channel
```

- Warm boot on lesson open, *before* the student needs it (prefetch on hover of "Дараагийнх").
- `npm install` is never run live from npm: each stage has a pinned dependency snapshot shipped as a
  binary blob (~8–25 MB, cached in the browser Cache API). First React lesson pays it once.
- **Fallback:** if WebContainers are unavailable (Safari quirks, licence, corporate proxy, low RAM),
  transparently fall back to Tier 3 (remote sandbox). The UI shows a small "сервер дээр ажиллаж
  байна" indicator; nothing else changes.
- **Licensing note:** StackBlitz WebContainer API is commercially licensed. Budget for it, or use the
  Tier-3 remote path as the default for React and keep WebContainers as the fast path for paying
  users. Decision gate at P2 based on measured cost per student — see [16](16-roadmap.md) §16.4.

### Tier 3 — Node + Postgres — remote sandbox

```
Browser ──WS──► Runner service ──► microVM (per session)
                                     ├─ node dev server :3000
                                     ├─ postgres :5432 (ephemeral db)
                                     └─ file sync agent
Preview iframe ← https://<sessionId>.preview.khiye.dev  (reverse proxy → microVM :3000)
Terminal      ← WS pty stream (restricted shell, see 12 §12.6)
```

Full lifecycle, limits and isolation: [12 — Code Execution](12-code-execution.md).

---

## 7.5 Preview chrome

```
┌─ [📱 Mobile ▾] [375×812]      ⟳  ⧉  🔍100%  ⚙ ─────────────────────┐
│                                                                     │
│   device frame (optional, off by default on small screens)          │
│                                                                     │
├─ Console (3) ▾ ─────────────── Terminal ──── Network ───────────────┤
│ ▸ error  Uncaught TypeError: products.map is not a function         │
│          ProductGrid.jsx:12        [Тайлбарлуулах 🤖]  [Кодруу очих]│
└─────────────────────────────────────────────────────────────────────┘
```

- **Device presets:** Mobile 375×812, Mobile L 414×896, Tablet 768×1024, Desktop 1280×800,
  plus "Тааруулах" (fit-to-pane). Rotate button. Zoom 50–150%.
- **Console** is a first-class teaching tool: object inspection (expandable), `console.table`,
  filter by level, and **every error row links to the source line and offers the AI explainer**.
- **Errors overlay:** an uncaught error paints a non-blocking red banner *inside* the preview with
  the translated Mongolian explanation, not a white screen. White screens make beginners quit.
- **Network tab** appears from Stage 5 (fetch/API lessons) and shows method, URL, status, timing,
  request/response JSON — this *is* the teaching material for "what is a request".
- **Popout (⧉)** opens the preview in a second window synced over `BroadcastChannel`.
- **Compare mode** (`⚖`) splits the preview 50/50 against the task's `expected.image` or reference
  preview, with an opacity slider. Used heavily in CSS lessons.

---

## 7.6 Mobile editing (mandatory, not a nice-to-have)

| Problem on phones | Solution |
|---|---|
| No `Tab`, `{`, `<`, `=` on the primary keyboard | **Code key strip** above the keyboard: `⇥ { } ( ) < > / " ' = ; : $ _ →` plus `undo/redo` and a `⌫word`. Horizontally scrollable, context-aware per language. |
| Can't see the result while typing | Preview **pins to the top 38%** when the editor focuses; body scrolls under it |
| Fat-finger cursor placement | Long-press magnifier (native) + a **line jump** control (`⌃ ⌄` step by line) + tap-a-line-number to place cursor at end |
| Horizontal scrolling of long lines | Soft wrap on by default with continuation indent guides |
| Accidental selection of read-only regions | Read-only ranges are non-selectable on touch |
| Long tasks are painful | `mobileFriendly: false` banner + "remind me on desktop" queue |
| Autocorrect mangling code | `autocapitalize=off autocorrect=off spellcheck=false inputmode=text` on the CM content DOM |

Target: a student can complete **every Stage 0–2 task** on a phone. Stages 3+ are marked
desktop-recommended but remain readable and reviewable on mobile.

---

## 7.7 Terminal (Stage 5+)

- xterm.js ↔ WS ↔ pty in the microVM.
- **Restricted shell:** an allowlist wrapper permitting `npm`(subset), `npx prisma`, `node`, `git`,
  `ls/cd/cat/mkdir/rm` within the workspace, `psql`. Anything else prints
  *"Энэ команд одоохондоо боломжгүй."* This is pedagogy (keep them on the path) plus defence in depth
  — the real containment is the microVM ([12](12-code-execution.md) §12.5), not the allowlist.
- Command history is stored and shown to teachers (a student who never runs `npm run dev` is stuck
  in a way the code doesn't reveal).
- Guided commands: the task statement can render a `[Ажиллуулах: npx prisma migrate dev]` button that
  types the command into the terminal (not runs it) so the student presses Enter themselves.

---

## 7.8 Performance budgets

| Metric | Budget | Enforcement |
|---|---|---|
| Lesson shell JS (Tier 1) | ≤ 400 KB gz | bundlesize CI gate |
| Editor + languages (Tier 1) | ≤ 220 KB gz | lazy language loading |
| TS language service | lazy, desktop-only, Stage 4+ | dynamic import behind a capability check |
| Keystroke → preview repaint | ≤ 150 ms p95 | RUM metric `preview.repaint` |
| Lesson open → editable | ≤ 1.2 s p95 warm, ≤ 3.5 s cold on 4G | RUM |
| Memory in tab after 1 h | ≤ 500 MB | snapshot trimming, iframe recycling every 200 reloads |

---

## 7.9 Accessibility

- Full keyboard operation of the whole workspace; visible focus rings; skip links between panes.
- Editor announces diagnostics via an ARIA live region.
- Preview iframe has `title` and is reachable by keyboard.
- Result panel is a live region so screen readers announce pass/fail.
- Colour is never the only signal (✓/✗ glyphs accompany green/red).
- Respects `prefers-reduced-motion` (kills celebrations' animation, keeps the message).

---

## 7.10 Acceptance criteria

1. Editing `index.html` updates the preview in ≤ 150 ms p95 with scroll position preserved.
2. A CSS-only change does not reload the iframe (assert via a load counter).
3. A student can complete `m1-l5` end-to-end on a 375×812 device in a real browser test.
4. Killing the network mid-lesson keeps the editor functional; edits persist and sync on reconnect.
5. WebContainer failure transparently falls back to Tier 3 with no data loss.
6. A `TypeError` in Tier 1 renders a translated banner, a console row, a source link, and an AI button.

---

*Next: [08 — Dashboards & Gamification](08-dashboards.md)*
