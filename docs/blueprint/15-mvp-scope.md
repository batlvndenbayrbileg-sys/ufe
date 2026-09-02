# 15 — MVP Scope

> **The MVP's only job:** prove that a real Mongolian student, alone, with no human help, can
> read a task in Mongolian → write code → see it live → be verified → and want to do the next one.
> Everything that does not serve that sentence is out.

---

## 15.1 MVP definition

**Name:** Хийе MVP — "Static Shop.mn"
**Scope:** Level 0 + Stage 1 (HTML & the first half of CSS) — **25 lessons, 95 tasks, ~14 hours of
student work** ending in a shareable, good-looking static Shop.mn home + product page.
**Execution:** **Tier 1 only.** No server sandbox, no WebContainers, no Postgres, no terminal.
**Timeline:** 10 weeks with the team in §15.5.

Choosing a Tier-1-only MVP is the highest-leverage decision in this plan: it removes the entire
runner service, sandbox security work, and capacity planning from the critical path, while still
exercising **100% of the core learning loop**.

---

## 15.2 In scope

### Student
| Feature | Detail |
|---|---|
| Register / login | Email+password, Google. Email verification. |
| Placement + onboarding | 5-question placement, goal, hours/week, target date, straight into task 1 |
| Dashboard | Continue card, course progress, streak, skills (3 skills), badges (6) |
| Course map | Level 0 + Stage 1, lock/unlock states |
| **Learning workspace** | 3-pane desktop, 2-pane tablet, stacked mobile with sticky preview |
| **Editor** | CodeMirror 6: HTML/CSS/JS highlighting, autocomplete, line numbers, tabs, file tree, format, read-only regions, marker anchoring, mobile key strip |
| **Live preview** | Tier-1 iframe, ≤150 ms, device selector (mobile/tablet/desktop), reload, compare-with-expected |
| **Console** | Errors + logs with source links and translated messages |
| **Task system** | Multi-task lessons, stepper, requirements checklist, unlock chain |
| **Validation** | `dom.*`, `css.*`, `html.valid`, basic `js.*` checkers; client-run + server re-verified |
| **Result panel** | Per-check ✓/✗ with actual vs expected, first-failure emphasis |
| **Hint ladder** | 3 levels, XP cost, gated solution |
| **AI tutor** | Sonnet, Socratic policy engine, post-filter, quota. *Behind a flag — can ship at week 9.* |
| Progress & XP | XP ledger, levels, streak (+freeze), 6 badges, 3 skill bars |
| Workspace persistence | IndexedDB + server sync, snapshot on submit, restore on reload |
| Share & export | Public `/u/:username/shop-mn` preview + ZIP download |
| Settings | Profile, theme, editor prefs, language toggle (mn/en shell) |
| Billing | **Not in MVP.** Everything is free during the pilot; a waitlist for paid stages. |

### Author (internal, minimal)
| Feature | Detail |
|---|---|
| Content in git (MDX + JSON) | The real pipeline from day one |
| `khiye content lint` + `test` | Reference solution + 3 bad fixtures per task, in CI |
| Local content preview | `pnpm dev` renders any lesson as a student |
| Publish | Version bundle + DB sync command |
| Author Studio UI | **Not in MVP.** Authors use the repo + CLI. |

### Teacher
**Not in MVP** — except one thing: a read-only **cohort progress table** (no heatmap, no replay),
because the pilot runs with two university classes and we need to see them.

### Admin
Minimal: user search, role change, impersonate (audited), feature flags, KPI page with the 6 metrics
in §15.4.

---

## 15.3 Explicitly out of MVP

React / Next.js / backend / database lessons · Tier 2 & Tier 3 execution · terminal · Postgres ·
deployment lessons · GitHub integration · Author Studio UI · teacher heatmap, gradebook, analytics,
plagiarism signals · payments & subscriptions · certificates · forum / community · mobile app ·
notifications beyond a weekly email · leaderboards · quizzes · notes · playground · offline PWA ·
LMS/LTI · English content translation (UI shell only) · i18n beyond mn/en · SSO.

Each of these has a phase assigned in [16](16-roadmap.md). None is cancelled; all are sequenced.

---

## 15.4 Success criteria (the pilot gate)

Pilot: **60 students** — 2 university sections (~40) + 20 self-learners recruited from Facebook
developer groups — over **4 weeks**.

| # | Metric | Target | Why it matters |
|---|---|---|---|
| 1 | **Activation** — completes task #1 in the signup session | ≥ 70% | The onboarding works |
| 2 | **Module 1 completion** within 14 days | ≥ 50% | The loop holds beyond novelty |
| 3 | **Median tasks/active week** (WVT) | ≥ 18 | The core engagement number |
| 4 | **D7 retention** | ≥ 45% | Habit formed |
| 5 | **Unassisted pass rate** (tasks passed without revealing a solution) | ≥ 80% | Content difficulty is right and they are actually learning |
| 6 | **Median attempts per task** | 1.5–2.5 | Below 1.3 = too easy; above 3 = too hard/unclear |
| 7 | **Keystroke→preview p95** | ≤ 150 ms | The product feels alive |
| 8 | **Submit verdict p95** | ≤ 300 ms | ditto |
| 9 | **False-fail rate** (correct solution rejected) | < 1% | Trust in validation |
| 10 | **Students who share their build** | ≥ 30% | Organic growth signal |
| 11 | **Qualitative:** ≥ 15 students say some form of *"Би өөрөө хийж байгаа юм шиг санагдсан"* in exit interviews | — | The actual product promise |

**Kill/pivot signals:** activation < 45%, or D7 < 25%, or false-fail > 5%, or median attempts > 4.
Any of these means the loop, not the marketing, is broken — fix before building Stage 2.

---

## 15.5 MVP team

| Role | FTE | Owns |
|---|---|---|
| Full-stack engineer (lead) | 1.0 | Next.js app, API, progression, auth, DB |
| Frontend engineer | 1.0 | Editor, preview, workspace, mobile, design system |
| Content author (MN, developer) | 1.0 | 25 lessons, 95 tasks, hints, solutions, checks |
| Designer (part-time) | 0.5 | Design system, workspace UX, marketing page |
| PM/founder | 0.5 | Pilot recruitment, interviews, metrics, university relationships |

**4 people ≈ 10 weeks.** The content author is on the critical path from week 1 and must be a
developer who writes well in Mongolian — this hire is harder than the engineering hires and should
start first.

---

## 15.6 MVP build order (10 weeks)

```
W1  Foundations   monorepo, design tokens, UI primitives, auth, DB schema, CI
W2  Content SDK   lesson schema (zod), loader, content lint CLI, 2 sample lessons
W3  Editor        CodeMirror wrapper, file tree, tabs, IndexedDB FS, mobile key strip
W4  Preview       iframe host, harness, console, device frames, ≤150 ms budget met
W5  Checkers      dom.*, css.*, html.valid + client harness runner + server happy-dom runner
W6  Loop          /learn page: instruction pane, stepper, submit endpoint, result panel,
                  hints, solution gate, XP, unlock  ←  END-TO-END LOOP WORKS
W7  Content       lessons m0-l1..l6 + m1-l1..l10 authored and CI-green
W8  Progress      dashboard, course map, streak, badges, skills, share page, ZIP export
W9  AI + polish   tutor with policy engine + post-filter, error translation table, empty states,
                  a11y pass, perf pass
W10 Pilot prep    m2-l1..l6 content, seed, admin page, onboarding, load test, bug bash, launch
```

**Hard gate at end of W6:** a person outside the team must complete `m1-l5` unaided on a phone and
on a laptop. If that fails, W7–W10 do not start until it passes.

---

## 15.7 MVP risks and pre-mortems

| Risk | Likelihood | Pre-mortem: "we failed because…" | Mitigation |
|---|---|---|---|
| Content quality is mediocre | **High** | "…the Mongolian read like a translation and students didn't understand the tasks." | Hire the author first; every lesson tested on 2 real beginners before merge; style guide in [14](14-design-system.md) §14.6 is binding |
| Validation false-fails | High | "…students wrote correct code and were told it was wrong, and never came back." | Semantic checks only; 3 bad fixtures per task in CI; false-fail is a P0 bug class; a "Шалгалт буруу байна" report button on every failed verdict feeding `/author/health` |
| Mobile editing is painful | Medium | "…45% of students were on phones and the editor was unusable." | Key strip + sticky preview built in W3–W4, not retrofitted; every task in the MVP tested on a real phone |
| Scope creep into React/backend | Medium | "…we spent 6 weeks on the sandbox and never shipped." | Tier-1-only is a written constraint; the runner service does not exist in the MVP repo |
| Editor performance on cheap laptops | Medium | "…it lagged on a 4 GB Windows machine." | Test on a low-end device weekly; CodeMirror over Monaco; bundle budget in CI |
| No students show up | Medium | "…we built it and nobody came." | Pilot recruitment starts in W1, not W10; two university sections committed before code is written |
| AI slows or complicates the launch | Low | "…the tutor gated the release." | Behind a flag; the loop works without it |

---

## 15.8 Definition of Done for the MVP

1. A student can register, onboard, and pass `m1-l1` in under 12 minutes without help.
2. All 95 tasks pass CI: reference solution passes, 3 bad fixtures fail with distinct messages.
3. Every performance budget in [11](11-system-architecture.md) §11.7 that applies to Tier 1 is met
   in production RUM.
4. Every task in the MVP has been completed on a real phone by a human.
5. Workspace never loses code: proven by a chaos test (kill network, kill tab, kill server mid-submit).
6. Forged client results cannot complete a task (integration test).
7. a11y: 8 key screens pass axe with zero criticals.
8. The share page renders a student's build publicly and is safe (sandboxed, labelled).
9. Admin can impersonate, and every impersonation is audited.
10. Runbook exists for: content hotfix, rollback, incident, and data export/deletion requests.

---

*Next: [16 — Roadmap](16-roadmap.md)*
