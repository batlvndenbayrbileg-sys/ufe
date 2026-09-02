# Хийе (Khiye) — Product & Technical Blueprint v1.0

> **Working product name:** **Хийе** / `khiye.mn`
> Mongolian for *"let's do it."* It is the exact sentence we want in the student's head before every task,
> and the opposite of the passive verb ("үзье" — *let's watch*) that every existing platform trains.
> Alternates if the domain is taken: `Kodlon`, `Buld.mn`, `Ööröö` (*by myself*).

**One-line definition:**
An interactive, Mongolian-language, project-based platform where a student builds one real
e-commerce application (**Shop.mn**) from empty file to deployed full-stack product, writing every
line themselves, with instant live preview and automatic per-task verification.

---

## 0.1 How to read this blueprint

This blueprint is written so that **an implementation agent can pick up any single file and build that
module without reading the others**, and so that a team can parallelise. Every file states its own
inputs, outputs, contracts, and acceptance criteria.

| # | File | Owns | Consumed by |
|---|------|------|-------------|
| 01 | [`01-vision-personas-journey.md`](01-vision-personas-journey.md) | Vision, principles, personas, end-to-end user journey | Everyone |
| 02 | [`02-information-architecture.md`](02-information-architecture.md) | Route map, screen inventory, navigation model | Frontend |
| 03 | [`03-curriculum.md`](03-curriculum.md) | Full Internet Programming curriculum: 9 stages → 15 modules → 142 lessons → ~520 tasks | Content, Frontend |
| 04 | [`04-content-schema.md`](04-content-schema.md) | Lesson/Task JSON schema, authoring pipeline, content repo layout | Content, Backend, Teacher panel |
| 05 | [`05-validation-engine.md`](05-validation-engine.md) | Checker types, DSL, runners, anti-cheat, feedback generation | Backend, Runner |
| 06 | [`06-ai-tutor.md`](06-ai-tutor.md) | Socratic tutor architecture, prompts, context assembly, guardrails, cost model | AI/Backend |
| 07 | [`07-editor-and-preview.md`](07-editor-and-preview.md) | Code editor, file tree, live preview, device frames, console, terminal | Frontend |
| 08 | [`08-dashboards.md`](08-dashboards.md) | Student / Teacher / Admin dashboards, gamification, analytics | Frontend, Backend |
| 09 | [`09-database-schema.md`](09-database-schema.md) | Platform ERD + Shop.mn teaching ERD, Prisma schema | Backend |
| 10 | [`10-api-spec.md`](10-api-spec.md) | REST endpoints, payloads, errors, realtime channels | Backend, Frontend |
| 11 | [`11-system-architecture.md`](11-system-architecture.md) | Services, stack decisions + rationale, deployment, regions, cost | Everyone |
| 12 | [`12-code-execution.md`](12-code-execution.md) | 3-tier execution model, sandbox isolation, limits, lifecycle | Runner, DevOps |
| 13 | [`13-security.md`](13-security.md) | AuthN/AuthZ, threat model, untrusted-code containment, privacy, PDPL | Everyone |
| 14 | [`14-design-system.md`](14-design-system.md) | Visual language, tokens, typography (Cyrillic), components, motion, MN copy rules | Design, Frontend |
| 15 | [`15-mvp-scope.md`](15-mvp-scope.md) | Exact MVP cut line, in/out list, success metrics | Everyone |
| 16 | [`16-roadmap.md`](16-roadmap.md) | Phases P0–P6, team shape, milestones, future platform vision | Leadership |
| 17 | [`17-example-content-mn.md`](17-example-content-mn.md) | Fully written Mongolian lessons, tasks, hints, solutions, tests | Content |
| 18 | [`18-build-tickets.md`](18-build-tickets.md) | Module-by-module implementable tickets with acceptance criteria | Implementation agents |

---

## 0.2 The one-sentence product bet

> Mongolian students do not fail to become developers because content does not exist —
> it exists in English on YouTube. They fail because **nothing verifies them, nothing sequences them,
> and nothing makes the next 20 minutes obvious.**
> Хийе sells *structure + verification + momentum*, in Mongolian, around one product they can point at.

## 0.3 What must be true for this to work (the core loop)

```
  Даалгавар уншина  →  Код бичнэ  →  Preview-д харна  →  Шалгагдана  →  Дараагийнх нээгдэнэ
   (read task)        (write code)   (see it live)      (validated)     (next unlocks)
        ▲                                                                     │
        └─────────────────────────── < 90 seconds ────────────────────────────┘
```

**Non-negotiable performance budget for the loop** (see [11](11-system-architecture.md) §11.7):

| Step | Budget |
|------|--------|
| Keystroke → preview repaint (Tier-1 HTML/CSS/JS) | ≤ 150 ms |
| "Ажиллуулах" → preview repaint (Tier-2 React) | ≤ 1.5 s warm |
| "Шалгах" → verdict (Tier-1, client checks) | ≤ 300 ms |
| "Шалгах" → verdict (Tier-3, server sandbox) | ≤ 6 s p95 |
| Cold sandbox boot | ≤ 4 s p95 |
| First lesson interactive after login (3G Ulaanbaatar) | ≤ 3.5 s |

If the loop is slower than this, no amount of curriculum quality saves the product. Treat these as
release gates, not aspirations.

## 0.4 Repository layout this blueprint assumes

```
khiye/
├── apps/
│   ├── web/                    # Next.js 15 App Router — student, teacher, admin, marketing
│   └── runner/                 # Fastify service: sandbox orchestration + server-side validation
├── packages/
│   ├── ui/                     # design system (tokens + primitives)
│   ├── editor/                 # CodeMirror 6 wrapper, file tree, tabs, console
│   ├── preview/                # iframe host, harness bundle, device frames
│   ├── checkers/               # validation DSL + client-runnable checkers (isomorphic)
│   ├── content-sdk/            # lesson schema (zod), loader, validator CLI
│   ├── db/                     # Prisma schema + client + migrations
│   └── shared/                 # types, errors, i18n keys, XP rules
├── content/
│   └── courses/internet-programming/   # git-versioned MDX + JSON lesson content
├── infra/                      # Terraform/Fly configs, sandbox image, seccomp profiles
└── docs/blueprint/             # this document set
```

## 0.5 Decisions already locked (do not re-litigate without a written ADR)

| # | Decision | Rationale (full text in linked file) |
|---|----------|--------------------------------------|
| D1 | **CodeMirror 6**, not Monaco | [07](07-editor-and-preview.md) §7.2 — Monaco is ~5 MB and unusable on phones; half our students are phone-first. |
| D2 | **3-tier execution**: browser iframe → WebContainer → remote microVM | [12](12-code-execution.md) §12.1 — 80% of tasks never touch a server; that is where the margin and the speed live. |
| D3 | **PGlite (WASM Postgres)** for SQL lessons | [12](12-code-execution.md) §12.4 — real Postgres semantics, zero server cost, instant. |
| D4 | **Client checks are advisory; server re-verification is authoritative** | [05](05-validation-engine.md) §5.6 — anti-cheat without paying server cost per keystroke. |
| D5 | **Content lives in a git repo as MDX+JSON**, edited by the Teacher panel through a PR-like flow | [04](04-content-schema.md) §4.6 — reviewable, diffable, rollback-able, and instructors never touch platform code. |
| D6 | **AI tutor never emits a working solution for the current task** unless the solution is already unlocked | [06](06-ai-tutor.md) §6.4 |
| D7 | **Mongolian is the source language.** English is a translation, not the other way round. | [14](14-design-system.md) §14.6 |
| D8 | **One project, not many exercises.** Every task mutates the same `shop-mn/` workspace. | [03](03-curriculum.md) §3.1 |

---

*Blueprint v1.0 — 2026-09-02. Change log at the bottom of [16-roadmap.md](16-roadmap.md).*
