# 14 — Design System, Visual Language & Mongolian Content Style

---

## 14.1 Design direction

**Reference points:** Linear (density + restraint), Vercel (typographic clarity, dark surfaces),
Stripe (information hierarchy in dense screens), VS Code (editor chrome), Apple (spacing discipline).

**Explicitly rejected:** LMS aesthetics (Moodle, Blackboard), cartoon mascots, playful gradients,
rounded 24px "friendly" cards, illustration-heavy empty states, badge glitter, drop shadows on
everything.

**The feeling to produce:** *"Энэ бол жинхэнэ хөгжүүлэгчийн хэрэгсэл."*
A 19-year-old should feel slightly elevated by using it, and a professional developer should not
wince. Confidence comes from restraint: one accent colour, one type scale, a lot of empty space,
and a dark mode that looks like the editors students aspire to use.

**One deliberate warmth:** the celebration moments and the Mongolian voice. The chrome is cool and
precise; the words are human.

---

## 14.2 Colour tokens

```css
:root {
  /* Neutrals — the product is 90% these */
  --bg:            #FFFFFF;
  --bg-subtle:     #FAFAFA;
  --bg-muted:      #F4F4F5;
  --surface:       #FFFFFF;
  --border:        #E4E4E7;
  --border-strong: #D4D4D8;
  --text:          #18181B;
  --text-muted:    #71717A;
  --text-subtle:   #A1A1AA;

  /* Accent — a single blue. Trustworthy, technical, not "education blue". */
  --accent:        #2563EB;
  --accent-hover:  #1D4ED8;
  --accent-subtle: #EFF6FF;
  --accent-text:   #1E40AF;

  /* Semantic */
  --success:       #16A34A;  --success-subtle: #F0FDF4;
  --warning:       #D97706;  --warning-subtle: #FFFBEB;
  --danger:        #DC2626;  --danger-subtle:  #FEF2F2;
  --info:          #0891B2;

  /* Progress / gamification — muted on purpose */
  --xp:            #7C3AED;
  --streak:        #EA580C;

  /* Code surfaces */
  --code-bg:       #FAFAFA;
  --code-border:   #E4E4E7;

  --radius-sm: 4px; --radius: 6px; --radius-lg: 10px; --radius-xl: 14px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / .05);
  --shadow-md: 0 4px 12px rgb(0 0 0 / .08);
  --shadow-lg: 0 12px 32px rgb(0 0 0 / .12);
}

:root[data-theme="dark"] {
  --bg:            #09090B;
  --bg-subtle:     #0F0F11;
  --bg-muted:      #18181B;
  --surface:       #111113;
  --border:        #27272A;
  --border-strong: #3F3F46;
  --text:          #FAFAFA;
  --text-muted:    #A1A1AA;
  --text-subtle:   #71717A;

  --accent:        #3B82F6;
  --accent-hover:  #60A5FA;
  --accent-subtle: #172554;
  --accent-text:   #93C5FD;

  --success: #22C55E; --success-subtle: #052E16;
  --warning: #F59E0B; --warning-subtle: #451A03;
  --danger:  #EF4444; --danger-subtle:  #450A0A;

  --code-bg: #0D0D0F; --code-border: #27272A;
}
```

**Dark mode is the default in `/learn`** (matching editor expectations) and follows the system
preference elsewhere; the toggle is always available. Every colour pair meets WCAG AA (4.5:1 for
text, 3:1 for UI); success/danger are never the sole signal.

---

## 14.3 Typography — Cyrillic is a first-class constraint

This is where most "premium" web design fails Mongolian products. Many fashionable fonts have thin,
badly-hinted, or absent Cyrillic. Mongolian Cyrillic also uses **Ө ө** and **Ү ү**, which some
"Cyrillic" subsets omit entirely — always verify these two characters specifically.

| Role | Font | Notes |
|---|---|---|
| UI & body | **Inter** (Cyrillic + Cyrillic-Ext subsets) | Excellent Ө/Ү, wide weights, variable |
| Display/marketing | Inter Tight or **Manrope** | Verify Ө/Ү before shipping |
| Code | **JetBrains Mono** | Full Cyrillic; students *will* write Mongolian in comments and strings |
| Fallback stack | `Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif` | Windows students get Segoe UI, which has solid Mongolian Cyrillic |

Typographic adjustments for Mongolian:
- Cyrillic sets read denser than Latin → **line-height +0.05** vs a Latin design (body 1.65).
- Mongolian words are long; avoid narrow columns. Instruction pane min-width 320px, prose max 68ch.
- Never use `text-transform: uppercase` on Mongolian sentences — it hurts legibility and reads as
  shouting. Uppercase only for short labels (`ЗААВАР`, `КОД`, `PREVIEW`).
- Avoid letter-spacing below 0 on Cyrillic body text.
- Font loading: `next/font` with `display: swap`, subset to `cyrillic, cyrillic-ext, latin`
  (~28 KB per weight). Self-hosted — no Google Fonts request from Mongolian networks.

```
Type scale (rem):  0.75  0.8125  0.875  1  1.125  1.25  1.5  1.875  2.25  3
Weights:           400 body · 500 UI labels · 600 headings · 700 display only
Body:              0.9375rem / 1.65
Instruction prose: 1rem / 1.7
Code:              0.875rem / 1.55  (mobile 0.875rem minimum, never smaller)
```

---

## 14.4 Layout & spacing

- 4px base scale: `4 8 12 16 20 24 32 40 48 64 80 96`.
- Content max width 1440px; the learning workspace is full-bleed.
- Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- **Borders over shadows.** Elevation is used for genuinely floating things only (dialogs, popovers,
  the AI drawer). Cards use a 1px border and a subtle background shift.
- Density: the learning workspace is *dense*; marketing and dashboards are *airy*. Don't mix.

---

## 14.5 Component inventory (`packages/ui`)

**Primitives:** Button (primary/secondary/ghost/danger, sm/md/lg, loading, icon), IconButton, Input,
Textarea, Select, Checkbox, Radio, Switch, Slider, Badge, Chip, Avatar, Tooltip, Popover, Dialog,
Sheet (mobile drawer), Tabs, Accordion, Separator, Skeleton, Spinner, Toast, ProgressBar,
ProgressRing, Breadcrumb, DropdownMenu, Table, EmptyState, Alert, Kbd.

**Domain components:**

| Component | Purpose |
|---|---|
| `LessonPane` | Instruction rendering (MDX) + task stepper |
| `TaskStepper` | `●●●○○` pips with states available/current/passed/assisted |
| `RequirementList` | Checklist that ticks live as checks pass |
| `ResultPanel` | Pass/fail verdict, per-check rows with actual vs expected |
| `CheckRow` | ✓/✗, label, expandable detail |
| `HintLadder` | 3 progressive hints with XP cost and an unlock confirm |
| `SolutionGate` | Locked state with the exact remaining conditions, then the solution + explanation |
| `AiDrawer` | Streaming tutor chat with the structured card layout |
| `ErrorCard` | Юу болов / Хаана / Яагаад / Яаж олох вэ |
| `CodeEditor` | CodeMirror wrapper |
| `FileTree` / `EditorTabs` / `Console` / `Terminal` / `NetworkPanel` |
| `PreviewFrame` | Device selector, zoom, reload, popout, compare mode |
| `DiffView` | Before/after (bridge lessons, solution comparison, snapshot replay) |
| `ProgressRing` / `SkillBar` / `SkillRadar` / `StreakCalendar` / `XpCounter` |
| `BadgeTile` / `CelebrationOverlay` / `ShareCard` |
| `ContinueCard` | The dashboard's primary CTA |
| `CourseMap` | Stage spine with module/lesson nodes |
| `CohortHeatmap` | Teacher matrix |
| `SnapshotScrubber` | Replay a student's edit history |
| `ConceptDiagram` | The interactive explainer host (see below) |

### Interactive concept explainers (the visual-learning system)

A small library of **parameterised, animated diagrams** driven by content JSON — not one-off SVGs.
Twelve types cover the whole curriculum:

```
request-response   client ⇄ server packet animation, method/status configurable
dns-lookup         типing a domain → resolver → IP → server
dom-tree           HTML source ⇄ live tree, hoverable both ways
box-model          interactive padding/border/margin with live numbers
flexbox-playground drag the properties, watch the boxes move
render-cycle       state change → re-render → DOM diff (React)
data-flow          props down / events up, animated through a component tree
api-lifecycle      browser → route handler → db → JSON → UI, with the real payload shown
sql-join           two tables sliding together, rows matching visually
auth-flow          login → hash compare → session cookie → protected route
order-transaction  the four writes that must succeed or roll back together
deploy-pipeline    git push → build → deploy → live URL
```

Each accepts props from `lesson.json` (`{ type: "api-lifecycle", props: { endpoint: "/api/products" } }`),
respects `prefers-reduced-motion`, is keyboard-steppable, and has a static fallback image for
low-bandwidth mode.

---

## 14.6 Mongolian content style guide (binding for all authors)

### Voice
Peer, not professor. Concrete, not abstract. Encouraging without flattery.
Address the student as **"чи"** (informal singular) — consistently. It is warmer, matches how
Mongolian developers actually talk to each other, and suits an audience of 17–30 year olds.
Never use "та" in lesson body copy (only in legal/billing/system emails).

### Term policy

Keep in English, in backticks or as-is: `component, props, state, hook, API, endpoint, request,
response, database, query, function, variable, array, object, event, commit, branch, deploy, cache,
token, session, middleware, migration, index, transaction`.

Translate: файл, хуудас, товч, зураг, жагсаалт, хэрэглэгч, захиалга, сагс, үнэ, нөөц, алдаа,
шалгах, ажиллуулах, хадгалах.

**Never invent Mongolian words for established technical terms.** A student who learns "бүрэлдэхүүн"
instead of "component" cannot read documentation, cannot search Stack Overflow, and cannot pass an
interview. First occurrence: `component` (бүрэлдэхүүн хэсэг) — *once*, then English forever.

### Sentence rules
- ≤ 20 words per sentence. Break instead of using a comma chain.
- Active voice, imperative for instructions: *"`<article>` элемент нэм."* not
  *"…нэмэгдсэн байх шаардлагатай."*
- One idea per paragraph, max 3 sentences.
- Concrete numbers and names: *"6 бүтээгдэхүүний карт"* not *"хэдэн карт"*.

### Examples

| ✗ Robotic / translated | ✓ Natural |
|---|---|
| "Элементэд event listener бүртгэх замаар callback function execution хийнэ." | "Хэрэглэгч товчийг дарахад юу болохыг JavaScript-д зааж өгнө." |
| "State-ийн утга өөрчлөгдөх үед component дахин render хийгдэнэ." | "`state` өөрчлөгдөхөд React тухайн хэсгийг дахин зурна." |
| "Асинхрон үйлдлийн үр дүнг хүлээн авах." | "Сервер хариу илгээх хүртэл хүлээгээд, ирсэн өгөгдлийг ашиглана." |
| "Та даалгавраа амжилттай гүйцэтгэлээ." | "Болсон. Чи анхны картаа өөрөө хийлээ." |
| "Алдаа гарлаа. Дахин оролдоно уу." | "Одоохондоо болоогүй байна. `class`-ийн бичлэгээ шалгаад үзээрэй." |

### Failure & error copy rules
1. Never say "буруу" (wrong) or "алдаа гаргалаа" (you made an error) about the student.
   Say what the code does, not what the student is.
2. Always name the next concrete action.
3. Never more than two sentences before the actionable part.
4. Structure for runtime errors: **Юу болов? / Хаана? / Яагаад? / Яаж өөрөө олох вэ?**

### Celebration copy
Three intensities: `small` (task) — *"Болсон. +10 XP"*; `medium` (lesson) — one sentence naming what
they can now do; `large` (milestone, 3 per course) — full overlay, share card, what it means.
Never exclamation-stack, never "Гайхалтай!!!", never more than one emoji per message.

### Localisation mechanics
- `next-intl`, `mn` is the source locale, `en` a translation. Keys live with the feature.
- All dates/times in `Asia/Ulaanbaatar` (UTC+8), format `2026 оны 9-р сарын 2`.
- Money: `₮ 129,000` — symbol, space, thin-space-free comma grouping, no decimals.
- Numbers: comma thousands separator.
- Weekday order Monday-first; Mongolian abbreviations Да Мя Лха Пү Ба Бя Ня.
- Support Mongolian names with Cyrillic in usernames? **No** — usernames are ASCII slugs (URLs),
  display names are full Unicode. Handle the transliteration suggestion at signup
  (Ануужин → `anuujin`).

---

## 14.7 Motion

| Interaction | Motion |
|---|---|
| Hover/press | 120 ms, `ease-out` |
| Panel open/close | 200 ms, `cubic-bezier(.2,.8,.2,1)` |
| Task unlock | 320 ms slide + fade of the next pip |
| Pass verdict | Checkmark draw 400 ms, then the result rows stagger 40 ms apart |
| Milestone celebration | 900 ms, once, dismissible, no looping particles |
| Preview repaint | **No animation at all** — it must feel instantaneous |
| Route change | 150 ms crossfade; the editor never animates |

`prefers-reduced-motion: reduce` removes all non-essential motion and keeps every message.

---

## 14.8 Accessibility standard

Target **WCAG 2.2 AA** across the product.
- Full keyboard operation, visible focus rings (`:focus-visible`, 2px accent outline, 2px offset).
- Touch targets ≥ 44×44 px.
- All state changes announced via ARIA live regions (verdicts, unlocks, tutor messages).
- Contrast verified in both themes by an automated check in CI (`@axe-core/playwright` on 8 key screens).
- The editor is the hardest surface: CodeMirror's a11y is decent but diagnostics must be exposed to
  screen readers explicitly, and read-only regions must be announced.
- We teach accessibility in M13-l6, so the platform failing it would be indefensible.

---

## 14.9 Brand

- **Wordmark:** `Хийе` in Inter Tight 600, with a subtle `▸` (play/forward) replacing nothing —
  used as a standalone mark in favicons and badges.
- **Tone line:** *"Уншиж биш, хийж сур."* (Learn by doing, not by reading.)
- **Imagery:** screenshots of real student builds, never stock photos of people at laptops.
- **Illustration:** technical diagrams only. No characters, no mascots.

---

*Next: [15 — MVP Scope](15-mvp-scope.md)*
