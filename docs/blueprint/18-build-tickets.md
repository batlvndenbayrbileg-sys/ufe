# 18 — Build Tickets (implementation-ready)

This file exists so that **each ticket can be handed to a separate implementation agent** with no
other context than the ticket, its listed reference sections, and the repo. Every ticket states:
dependencies · files to create · the contract · acceptance criteria.

Scope of this file: **P0 (MVP)** in full, plus the P1–P2 epic outlines.
Ticket ids are stable; do not renumber.

---

## 18.0 Conventions

- Package manager **pnpm**, monorepo via **turborepo**. Node 22. TypeScript strict.
- Every package exports types from `src/index.ts`. No deep imports across packages.
- Tests: **Vitest** (unit), **Playwright** (E2E). A ticket is not done without tests.
- Definition of Done for every ticket: types pass, tests pass, lint passes, the acceptance criteria
  are demonstrated, and any new public contract is documented in the relevant blueprint file.

### Dependency graph (P0)

```
E0 Foundations
 ├── E1 Design system ──────────────┐
 ├── E2 Data layer ────────┐        │
 ├── E3 Content SDK ───┐   │        │
 │                     │   │        │
 ├── E4 Editor ────────┼───┼────────┤
 ├── E5 Preview ───────┼───┼────────┤
 │                     │   │        │
 └── E6 Checkers ──────┘   │        │
        │                  │        │
        └──► E7 Learning loop (needs E1–E6) ◄┘
                 │
                 ├──► E8 Progression & dashboard
                 ├──► E9 AI tutor
                 ├──► E10 Content authoring (CLI + the 25 MVP lessons)
                 ├──► E11 Sharing & export
                 └──► E12 Admin, ops, launch
```

Parallelisable from day 1: **E1, E2, E3, E4, E5** (5 agents).
E6 needs E3's types only. E7 is the integration point and should be one owner.

---

# E0 — Foundations

### T0.1 — Monorepo scaffold
**Deps:** none
**Create:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`,
`.editorconfig`, `.gitignore`, `apps/web` (Next.js 15, App Router, TS), empty `packages/*`.
**AC:** `pnpm i && pnpm build && pnpm test` succeed on a clean clone; `apps/web` serves `/` .

### T0.2 — CI pipeline
**Deps:** T0.1
**Create:** `.github/workflows/ci.yml` — typecheck, lint, unit, build, bundlesize, Playwright smoke.
**AC:** CI is red when a type error is introduced; bundlesize gate fails when the lesson shell
exceeds 400 KB gz.

### T0.3 — Local environment
**Deps:** T0.1
**Create:** `docker-compose.yml` (Postgres 16, Redis, MinIO), `.env.example`, `scripts/dev.sh`.
**AC:** `pnpm dev` starts app + services; `pnpm db:reset && pnpm db:seed` works.

### T0.4 — Error, logging & i18n primitives
**Deps:** T0.1
**Create:** `packages/shared/src/errors.ts` (typed `AppError` with `code`, `mn`, `httpStatus`),
`packages/shared/src/logger.ts` (structured, request-id), `apps/web/src/i18n` (next-intl, `mn` default).
**AC:** an `AppError` thrown in any route handler renders the §10.1 envelope with `X-Request-Id`.

---

# E1 — Design system (`packages/ui`)

**Reference:** [14](14-design-system.md)

### T1.1 — Tokens & theming
**Create:** `packages/ui/src/tokens.css`, Tailwind v4 config, `ThemeProvider` (light/dark/system,
persisted, no flash of wrong theme via an inline script).
**AC:** every token in §14.2 exists in both themes; an automated contrast test passes for all
text/background pairs; `/learn` defaults to dark.

### T1.2 — Typography & fonts
**Create:** `next/font` setup for Inter + JetBrains Mono, subset `latin, cyrillic, cyrillic-ext`.
**AC:** `Ө ө Ү ү` render correctly in all weights in both fonts; no network request to Google Fonts;
font CSS ≤ 30 KB per weight.

### T1.3 — Primitives
**Create:** Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Badge, Avatar, Tooltip,
Popover, Dialog, Sheet, Tabs, Accordion, Skeleton, Spinner, Toast, ProgressBar, ProgressRing,
DropdownMenu, Table, EmptyState, Alert, Kbd. Radix-based where applicable.
**AC:** Storybook (or a `/dev/ui` route) shows every component in both themes; axe reports zero
criticals; all interactive components are keyboard-operable with visible focus.

### T1.4 — Layout shells
**Create:** `AppShell` (student), `WorkspaceShell` (3-pane resizable, persisted sizes), `AuthShell`.
**AC:** WorkspaceShell adapts at 1280/1024/768/375 exactly as [02](02-information-architecture.md) §2.2
describes; pane sizes persist per user.

---

# E2 — Data layer (`packages/db`)

**Reference:** [09](09-database-schema.md)

### T2.1 — Prisma schema (platform)
**Create:** `packages/db/prisma/schema.prisma` with all models in §9.2, initial migration.
**AC:** `prisma migrate dev` clean; all `@@unique`/`@@index` from §9.4 present; cascade deletes
verified by a test that deletes a user and leaves no orphans.

### T2.2 — Seed
**Create:** `packages/db/src/seed.ts` — skills, achievements, one org+cohort, 3 demo students at
0%/35%/90% progress, content import hook.
**AC:** `pnpm db:seed` is idempotent and produces a login-able demo student.

### T2.3 — Repository layer
**Create:** `packages/db/src/repos/*` — typed accessors for progress, attempts, XP, workspace.
Includes the **single transaction** used by submit (§11.4 step 8).
**AC:** `awardTaskCompletion()` is atomic; a forced failure mid-transaction leaves no XP and no
attempt; concurrent double-submit awards XP exactly once (test with 20 parallel calls).

### T2.4 — Auth
**Create:** Auth.js config, argon2id hashing, email verification, Google OAuth, session model,
`packages/shared/authz` policy module with `can()`.
**AC:** register/login/logout/reset flows tested; sessions revocable; a route handler that reads a
user-scoped model without `can()` fails the custom lint rule.

---

# E3 — Content SDK (`packages/content-sdk`)

**Reference:** [04](04-content-schema.md)

### T3.1 — Schema & types
**Create:** zod schemas for `Lesson`, `Task`, `Check`, `Hint`, `FilePatch`; inferred TS types.
**AC:** the example in §4.4 validates; 10 malformed fixtures each produce a precise error path.

### T3.2 — Loader & patch engine
**Create:** `loadCourse(dir)`, `applyPatch(fileSet, patch[])` supporting all 6 `FilePatch` ops,
`@asset:` resolution.
**AC:** `insertAfter` with a missing anchor throws a named error; patches never clobber student files
unless `force`; round-trip test on a 3-lesson fixture course.

### T3.3 — Content CLI
**Create:** `khiye content lint | test | build | sync` (bin in `packages/content-sdk`).
`lint` implements every rule in §4.5; `test` runs reference + bad fixtures through the checkers;
`build` emits the JSON bundle; `sync` upserts to Postgres.
**AC:** all §4.5 rules enforced with the stated severity; `test` fails CI when a reference solution
does not pass; `sync` is transactional per lesson and idempotent.

---

# E4 — Editor (`packages/editor`)

**Reference:** [07](07-editor-and-preview.md) §7.2–7.3, §7.6

### T4.1 — CodeMirror wrapper
**Create:** `Editor.tsx` with html/css/js/json languages, line numbers, bracket matching, folding,
search, undo, khiye light/dark themes.
**AC:** ≤ 220 KB gz for the Tier-1 language set; typing latency < 16 ms on a 2,000-line file.

### T4.2 — Workspace FS
**Create:** in-memory `FileSet` store (Zustand), IndexedDB mirror, dirty tracking, patch application.
**AC:** reload restores files, open tabs, active file, cursor and scroll; a chaos test (kill tab
mid-edit) loses no more than the last 200 ms of typing.

### T4.3 — File tree & tabs
**Create:** `FileTree` (respects `visibleFiles`), `EditorTabs` (open/close/reorder, dirty dot).
**AC:** files outside `visibleFiles` are hidden; `readOnlyFiles` are greyed and non-editable.

### T4.4 — Marker anchoring & read-only ranges
**Create:** scroll-to-marker + cursor placement + one-shot line pulse; read-only range decorations.
**AC:** opening a task with `marker` places the cursor there; typing inside a read-only range is
rejected without an error toast storm.

### T4.5 — Autocomplete
**Create:** HTML tag/attribute, CSS property/value, JS global + project-symbol completion sources.
**AC:** typing `<art` suggests `article`; typing `dis` in CSS suggests `display` with values;
completion latency < 30 ms.

### T4.6 — Mobile editing
**Create:** code key strip, sticky-preview coordination hook, line-step controls, soft wrap,
`autocorrect/autocapitalize/spellcheck` off.
**AC:** a real device test completes `m1-l5` on a 375×812 phone; no horizontal scroll anywhere;
all touch targets ≥ 44 px.

### T4.7 — Formatting & reset
**Create:** Prettier-in-worker (`Shift+Alt+F`), `Даалгаврыг эхнээс нь` / `Файлыг сэргээх` with
snapshot + undo.
**AC:** formatting never runs on a read-only file; reset takes a snapshot first and is undoable
for 60 s.

### T4.8 — Console panel
**Create:** `Console` component consuming harness messages; levels, expandable objects, source links,
"Тайлбарлуулах 🤖" button, clear.
**AC:** `console.log({a:1})` renders an expandable tree; an uncaught error shows file:line and links
to the editor position.

---

# E5 — Preview (`packages/preview`)

**Reference:** [07](07-editor-and-preview.md) §7.4–7.5, [12](12-code-execution.md) §12.2

### T5.1 — Preview origin & host page
**Create:** `preview.khiye.dev` route/app serving the harness host, iframe host component with the
exact sandbox/CSP attributes from §12.2.
**AC:** the iframe has no `allow-same-origin`; a script inside cannot read `document.cookie` of the
app; CSP blocks a `fetch('https://example.com')` from student code before the fetch lessons.

### T5.2 — Tier-1 assembler
**Create:** `tier1.ts` — inline CSS, blob-module JS with an import map, `<base>`, asset rewriting.
**AC:** a 3-file project (html + css + 2 js modules with imports) renders; keystroke → repaint
≤ 150 ms p95 measured in a Playwright perf test.

### T5.3 — Harness
**Create:** console bridge, error capture + source mapping, heartbeat watchdog, state preservation
(scroll/sessionStorage/focus), `alert` throttle, checker runtime host.
**AC:** `while(true){}` triggers the Mongolian infinite-loop message within 4 s and the app stays
responsive; a CSS-only edit hot-swaps `<style>` with zero iframe reloads (assert a load counter).

### T5.4 — Preview chrome
**Create:** device selector (5 presets + fit), rotate, zoom, reload, popout via `BroadcastChannel`,
compare mode with an opacity slider.
**AC:** device switching preserves the rendered state; popout stays in sync; compare mode overlays
`expected.image` correctly.

---

# E6 — Checkers (`packages/checkers`)

**Reference:** [05](05-validation-engine.md)

### T6.1 — Registry & contract
**Create:** `registry.ts`, `types.ts` per §5.8, isomorphic runner (`runChecks(checks, ctx)`).
**AC:** a checker that throws is converted to `errorKind: "infra"` and never counts as a student
failure; every checker returns `durationMs`.

### T6.2 — `dom.*` + `html.valid`
**Create:** exists, notExists, count, text, attr, hierarchy, order, formField, a11y (axe subset), valid.
**AC:** each has ≥ 3 positive and ≥ 3 negative fixtures; `dom.text` normalises whitespace and is
Unicode-correct for Cyrillic; `dom.a11y` catches a missing `alt`.

### T6.3 — `css.*`
**Create:** computed, numeric, layout, box, responsive, contrast, noHardcoded.
**AC:** `css.computed` reads *computed* values (a class-applied colour passes, an inline one too);
`css.responsive` re-runs children at a given viewport and restores the original size afterwards.

### T6.4 — `ast.*` and basic `js.*`
**Create:** ast.declares/callsFunction/forbids/imports/usesHook (babel), js.evaluate,
js.consoleClean, js.interaction (step grammar per §5.2).
**AC:** `js.interaction` supports click/type/waitFor/expectText/expectEval with a 3 s waitFor cap;
`ast.forbids` catches `innerHTML`.

### T6.5 — Server-side authoritative runner
**Create:** Node worker pool running the same checkers against `happy-dom`; 250 ms timeout; no network.
**AC:** for 50 sample tasks the server verdict matches the client verdict 100% of the time;
a forged `clientResults` payload cannot complete a task (integration test).

### T6.6 — Error translation table
**Create:** `packages/shared/src/errors/mn.ts` — ≥ 20 entries for stages 1–2 with the
Юу/Хаана/Яагаад/Яаж structure; matcher with a raw-message fallback.
**AC:** the 10 most common beginner errors produce hand-written Mongolian output; unmatched errors
still render the card with an "AI-аас асуух" action.

---

# E7 — The learning loop (`apps/web`)

**Reference:** [02](02-information-architecture.md) §2.2, [10](10-api-spec.md) §10.4–10.6

### T7.1 — Content API
**Create:** `GET /api/courses/:id`, `/api/courses/:id/map`, `/api/lessons/:id`, `/api/tasks/:id`
with `TaskPublic` redaction (§10.4).
**AC:** the response never contains `checks[].args`, an unviewed hint's text, or a locked solution
(asserted by a test that greps the serialized payload).

### T7.2 — `/learn/[lessonId]` page
**Create:** the workspace route wiring instruction pane + editor + preview + action bar, task stepper,
requirement checklist, deep links (`?task=n`), keyboard shortcuts.
**AC:** full state restoration on reload (files, tabs, cursor, scroll, task index, console);
`Ctrl+Enter` runs, `Ctrl+Shift+Enter` checks.

### T7.3 — Instruction pane & MDX renderer
**Create:** MDX components (callout, code, image, diagram host, requirement list), the lesson header
with `why`, collapsible sections.
**AC:** renders `m1-l5` exactly as in [17](17-example-content-mn.md) §17.1; prose max 68ch;
line-height per §14.3.

### T7.4 — Submit endpoint
**Create:** `POST /api/tasks/:id/submit` per §10.5 — authz, rate limit, size guard, snapshot,
authoritative re-run, the single transaction, achievements, streak, response.
**AC:** p95 ≤ 300 ms for Tier 1 under a k6 run of 50 rps; idempotent under `Idempotency-Key`;
double submission awards XP once; a 503 from the checker path does not create a `TaskAttempt`.

### T7.5 — Result panel
**Create:** verdict rendering, per-check rows with actual vs expected, first-failure emphasis,
"Шалгалт буруу байна" report button, celebration at three intensities.
**AC:** passed checks are visible on a failed attempt; only the first failure is expanded;
`prefers-reduced-motion` removes animation but keeps every message.

### T7.6 — Hints & solution gate
**Create:** `POST /api/tasks/:id/hint`, `POST /api/tasks/:id/solution` with the §10.5 gate,
`HintLadder` and `SolutionGate` UI showing the exact remaining conditions.
**AC:** hint level 3 cannot be fetched before level 2; the solution endpoint returns 403 with the
precise unmet conditions; revealing sets `assisted` and awards 40% XP.

### T7.7 — Workspace sync
**Create:** `GET/PUT /api/workspace/:courseId`, patch-based autosave (2 s debounce), snapshot
endpoints, 409 conflict handling with a chooser UI.
**AC:** a two-device edit produces a conflict UI rather than silent loss; offline edits flush on
reconnect; workspace > 512 KB is rejected with a clear Mongolian message.

### T7.8 — Progression service
**Create:** unlock rules (§2.3), `LessonProgress` status transitions, prerequisite DAG evaluation,
`Enrollment.currentLessonId` denormalisation.
**AC:** completing the last task of a lesson unlocks the next lesson; a locked lesson is readable
with a disabled editor; a teacher override unlocks correctly.

---

# E8 — Progression, dashboard, gamification

**Reference:** [08](08-dashboards.md)

### T8.1 — XP, levels, streaks
**Create:** XP rules table in `packages/shared/src/xp.ts`, ledger writes inside the submit
transaction, level formula, streak service with freezes and pause.
**AC:** `totalXp == Σ ledger` after a 500-event fuzz; streak counts only days with a passed task;
a freeze auto-applies exactly once and is consumed.

### T8.2 — Achievements engine
**Create:** declarative criteria evaluation on the 6 MVP badges; idempotent award.
**AC:** re-running evaluation never double-awards; a badge earned appears in the response of the
submit that earned it.

### T8.3 — Dashboard `/app`
**Create:** continue card, progress ring, skill bars, streak calendar, badges, project thumbnail,
all empty/edge states from §8.1.
**AC:** LCP ≤ 1.8 s p95; the continue card is above the fold at 375×667; the "returning after 7 days"
state renders with the recap CTA.

### T8.4 — Course map `/app/course/[id]`
**Create:** stage spine, module cards, lesson dots with 5 states, deep links.
**AC:** locked/available/in-progress/complete/assisted all visually distinct and colour-independent.

### T8.5 — Analytics events
**Create:** `packages/shared/src/analytics.ts` with the §8.5 taxonomy, server emitters, a queued
client emitter.
**AC:** every event in §8.5 is emitted at the right moment (asserted by an E2E run that walks a
full lesson and snapshots the event stream); no student source code appears in any event payload.

---

# E9 — AI tutor

**Reference:** [06](06-ai-tutor.md)

### T9.1 — Context assembler
**Create:** server-side `TutorContext` builder with truncation rules (§6.3).
**AC:** total prompt ≤ 6 K tokens for a 40-file workspace; client-supplied context is ignored.

### T9.2 — Policy engine + post-filter
**Create:** the §6.4 table, similarity gate (normalised token similarity vs the reference solution),
length/language/scope gates.
**AC:** the §6.10 adversarial suite (200 prompts) yields zero leaks at similarity ≥ 0.75;
a non-Mongolian response is regenerated.

### T9.3 — Tutor endpoint & drawer
**Create:** `POST /api/ai/tutor` (SSE), `AiDrawer` with the structured card layout, quota display,
proactive-offer trigger (3 failures or 12 min idle, max 1 per 10 min).
**AC:** first token ≤ 1.2 s median; the drawer never auto-opens; killing the AI provider leaves the
loop working and shows the fallback.

### T9.4 — Error explainer
**Create:** `POST /api/ai/explain-error` — table lookup first, Haiku fallback.
**AC:** ≥ 60% of stage-1/2 errors resolve from the table with no model call.

---

# E10 — Content production (the 25 MVP lessons)

**Reference:** [03](03-curriculum.md), [17](17-example-content-mn.md)

### T10.1 — Course scaffolding
**Create:** `content/courses/internet-programming/{course.json, skills.json, project/_base/}`.
**AC:** `khiye content lint` passes on an empty course; the base workspace opens in the editor.

### T10.2–T10.7 — Lessons
| Ticket | Content | Tasks |
|---|---|---|
| T10.2 | `m0-l1..l6` (Level 0, incl. 3 interactive diagrams) | ~18 |
| T10.3 | `m1-l1..l4` | ~15 |
| T10.4 | `m1-l5..l7` | ~13 |
| T10.5 | `m1-l8..l10` | ~14 |
| T10.6 | `m2-l1..l3` | ~11 |
| T10.7 | `m2-l4..l6` | ~13 |

**AC (each):** every task has ≥ 1 check with a hand-written `onFail`, 3 escalating hints, a reference
solution that passes CI, and ≥ 3 known-bad fixtures each failing with a *distinct* message;
`khiye content lint` clean; every task completed on a real phone by a human before merge.

### T10.8 — Interactive diagrams
**Create:** `ConceptDiagram` host + `request-response`, `dns-lookup`, `dom-tree`, `box-model`.
**AC:** keyboard-steppable, `prefers-reduced-motion` respected, static fallback image present.

---

# E11 — Sharing & export

### T11.1 — Public project page
**Create:** `/u/[username]/shop-mn` rendering the student's latest snapshot in a sandboxed frame with
a persistent "Оюутны бүтээл · Хийе" ribbon and `script-src 'none'` for free accounts.
**AC:** the page cannot set cookies on `khiye.mn`; a student can toggle it private; OG image renders
a screenshot of the build.

### T11.2 — ZIP export & screenshot job
**Create:** signed R2 ZIP export; a BullMQ job that headless-renders the project thumbnail on
milestone completion.
**AC:** ZIP opens locally and the site works from `file://` for Tier-1 projects.

---

# E12 — Admin, ops, launch

### T12.1 — Admin panel (minimal)
**Create:** KPI page (the 6 pilot metrics), user search, role change, audited impersonation,
feature flags.
**AC:** impersonation is time-boxed, banner-visible, audited, and blocked for other admins.

### T12.2 — Observability
**Create:** Sentry (web + server), OTel traces on submit, RUM for the four latency budgets,
alerts on p95 breaches and false-fail reports.
**AC:** a deliberately slow submit triggers an alert in staging.

### T12.3 — Privacy self-service
**Create:** export (ZIP of profile+progress+code) and delete-account flows per §13.8.
**AC:** both complete within 10 minutes in staging; delete leaves no orphaned rows and anonymises
analytics.

### T12.4 — Launch readiness
**Create:** runbooks (content hotfix, rollback, incident, data request), status page, k6 load test at
3× expected pilot load, bug bash checklist, the §15.8 DoD sign-off.
**AC:** every item in [15](15-mvp-scope.md) §15.8 is checked off with evidence.

---

# P1–P2 epic outlines (not yet ticket-level)

| Epic | Contents | Reference |
|---|---|---|
| **E13 JS checkers** | `js.unit` (Vitest), extended `js.interaction`, ESLint-in-worker with MN messages | [05](05-validation-engine.md) §5.2 |
| **E14 Teacher panel v1** | Cohorts, join codes, roster, progress table, at-risk list, CSV export | [08](08-dashboards.md) §8.3 |
| **E15 Billing** | QPay invoices + webhook, plans, paywall, dunning, invoices | [10](10-api-spec.md) §10.13 |
| **E16 Network panel** | Fetch instrumentation in the harness + the preview Network tab | [07](07-editor-and-preview.md) §7.5 |
| **E17 Tier 2** | WebContainer boot, dependency snapshots, vitest-in-browser, capability detection + fallback | [12](12-code-execution.md) §12.3 |
| **E18 Runner service** | Firecracker pool, jailer, cgroups, TAP firewall, file sync, preview proxy, WS logs/pty | [12](12-code-execution.md) §12.5 |
| **E19 Sandbox security** | Escape-test suite, quotas, abuse detection, origin split hardening | [13](13-security.md) §13.6 |
| **E20 Terminal** | xterm + restricted shell + command telemetry | [07](07-editor-and-preview.md) §7.7 |
| **E21 React checkers** | `react.render`, `react.behaviour`, `build.succeeds` | [05](05-validation-engine.md) §5.2 |
| **E22 PGlite** | Browser Postgres, `sql.*` checkers, seed snapshots | [12](12-code-execution.md) §12.4 |
| **E23 Author Studio** | Lesson form, live student preview, visual checker builder, fixture runner, publish/rollback | [04](04-content-schema.md) §4.7 |

---

## 18.1 Suggested parallel assignment for a 5-agent start

| Agent | Tickets | Blocking anyone? |
|---|---|---|
| A | T0.1 → T0.4, then E12 | Yes — do T0.1 first, alone |
| B | E1 (T1.1–T1.4) | Blocks E7 |
| C | E2 (T2.1–T2.4) | Blocks E7, E8 |
| D | E4 (T4.1–T4.8) | Blocks E7 |
| E | E5 (T5.1–T5.4) then E6 | Blocks E7 |
| — | E3 can go to whoever finishes first; E7 starts only when B–E land |

**Do not start E7 before E1–E6 are green.** E7 is the integration seam and rewriting it against
moving contracts is the most likely way to lose two weeks.

---

*Back to: [00 — README](00-README.md)*
