# Хийе

Interactive, Mongolian-language, project-based programming education. Students build one real
e-commerce application (**Shop.mn**) from an empty file to a deployed full-stack product, writing
every line themselves, with instant live preview and automatic per-task verification.

> Full product & technical blueprint: [`docs/blueprint/`](docs/blueprint/00-README.md) (19 documents).

## Monorepo layout

```
apps/
  web/               Next.js 15 — student, teacher, admin, marketing (+ /api)
packages/
  shared/            errors, logger, i18n keys, shared types  ← implemented (E0)
  ui/                design system (E1)
  db/                Prisma schema + client (E2)
  content-sdk/       lesson schema + loader + content CLI (E3)
  editor/            CodeMirror wrapper (E4)
  preview/           iframe host + harness (E5)
  checkers/          validation DSL + checkers (E6)
content/             git-versioned MDX + JSON lessons (E10)
docs/blueprint/      the plan
```

## Prerequisites

- Node **22+** (`.nvmrc`)
- pnpm **9** — `npm i -g pnpm@9.15.0` (or `corepack pnpm`)
- Docker (optional for the Tier-1 MVP; needed for Postgres/Redis/MinIO later)

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev              # turbo runs all app/package dev tasks
```

The web app serves at http://localhost:3000. Health check: `GET /api/health`.

## Scripts (root)

| Command | Does |
|---|---|
| `pnpm dev` | Run all dev servers via turbo |
| `pnpm build` | Build every workspace |
| `pnpm typecheck` | `tsc --noEmit` across the graph |
| `pnpm lint` | ESLint across the graph |
| `pnpm test` | Vitest across the graph |
| `pnpm format` | Prettier write |

## Status

**E0 — Foundations** ✅ scaffolded: monorepo, `@khiye/shared` (errors, logger, i18n primitives),
Next.js 15 app with a health route, CI, docker-compose. Next up: **E1 Design system**, **E2 Data
layer**, **E3 Content SDK** (parallelisable — see [`docs/blueprint/18-build-tickets.md`](docs/blueprint/18-build-tickets.md)).
