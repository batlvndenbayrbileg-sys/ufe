# 11 — System Architecture & Technology Choices

---

## 11.1 System diagram

```
                                   ┌────────────────────────────────┐
        Ulaanbaatar student        │  CDN / Edge  (Cloudflare)      │
        Browser (PWA)  ───────────►│  static, content bundles, WAF  │
             │                     └──────────────┬─────────────────┘
             │                                    │
             │  1. Tier-1 preview & checks        ▼
             │     run HERE (no network)   ┌──────────────────────────────┐
             │                             │  WEB APP  (Next.js 15)       │
             │  2. everything else ───────►│  Tokyo / Singapore region    │
             │                             │  • RSC pages & dashboards    │
             │                             │  • /api route handlers (BFF) │
             │                             │  • auth, progression, XP     │
             │                             │  • server-side re-validation │
             │                             │    (Tier 1/2, happy-dom)     │
             │                             └───┬──────┬─────────┬────────┘
             │                                 │      │         │
             │                                 ▼      ▼         ▼
             │                    ┌────────────┐  ┌────────┐ ┌───────────────┐
             │                    │ PostgreSQL │  │ Redis  │ │  Anthropic    │
             │                    │  (Neon)    │  │(Upstash│ │  Claude API   │
             │                    │ + pgvector │  │ queue, │ │  Sonnet/Haiku │
             │                    └────────────┘  │ cache, │ └───────────────┘
             │                                    │ rate)  │
             │                                    └────────┘
             │                                 │
             │  3. Tier-3 (Node + Postgres)    ▼
             │                        ┌─────────────────────────────────────┐
             ├───WS: terminal, logs──►│  RUNNER SERVICE (Fastify)           │
             │                        │  Fly.io / Hetzner, Tokyo            │
             ├───HTTPS: preview──────►│  ┌───────────────────────────────┐  │
             │   *.preview.khiye.dev  │  │ Sandbox pool (Firecracker VM) │  │
             │                        │  │  student code + pg + node     │  │
             │                        │  └───────────────────────────────┘  │
             │                        │  Validator workers (BullMQ)         │
             │                        └─────────────────────────────────────┘
             │
             └───► Object storage (Cloudflare R2): snapshots, ZIP exports,
                   lesson assets, project screenshots
```

---

## 11.2 Stack decisions and why

### Frontend & app server — **Next.js 15 (App Router) + React 19 + TypeScript**

- One deployable covers marketing (SEO, static), the app (RSC + client islands), dashboards, and the
  API. For a small team this halves the operational surface.
- Server Components let the course map and dashboards render with zero client data-fetching waterfall
  — important on Mongolian mobile networks.
- **It is also what we teach in Stage 4.** Students who inspect our stack learn from it; job postings
  in Ulaanbaatar increasingly list React/Next.
- Rejected: SvelteKit/Nuxt (smaller local hiring pool, and we'd be teaching a stack we don't use);
  Remix (fine, but smaller ecosystem for the editor/preview libraries we need); separate SPA + API
  (two deploys, more latency, no SEO on marketing).

### Styling — **Tailwind CSS v4 + a small owned component layer (Radix primitives)**

- Tailwind keeps CSS out of the critical path and makes the design tokens in [14](14-design-system.md)
  literal. Radix gives accessible primitives (dialog, popover, tabs) without a heavyweight kit.
- Rejected: MUI/Chakra (visual identity too generic, bundle too heavy), pure CSS modules (slower
  iteration for a 3-person team).

### Client state — **Zustand** (editor/workspace) + **TanStack Query** (server state)

The editor is a high-frequency, non-serializable-to-URL state machine; Redux is overkill and Context
re-renders too much. Server state (progress, lessons) belongs in a cache with invalidation, not in a
store.

### Editor — **CodeMirror 6** (see [07](07-editor-and-preview.md) §7.2 for the full argument)

### Database — **PostgreSQL 16 on Neon** (+ **pgvector**)

- Relational data with real invariants (progress, XP ledger, billing) — this is not a document store.
- Neon: branching (a DB branch per preview deploy is genuinely useful for content migrations),
  scale-to-zero for the early months, Tokyo region.
- pgvector for the task-FAQ cache; avoids a separate vector DB.
- **Migration path:** if Neon's cold starts hurt, move to a managed Postgres (Crunchy/RDS) or
  self-hosted on Hetzner — Prisma makes this a connection-string change.

### ORM — **Prisma**

Type-safe, great migrations, and it is the ORM we teach in M9. Raw SQL via `$queryRaw` for the
analytics/materialised-view queries where Prisma is a poor fit.

### Cache / queue / rate-limit — **Redis (Upstash)**

BullMQ for validation jobs and background work (screenshots, weekly emails, FAQ clustering);
sliding-window rate limits; session and content-bundle caching.

### Code execution — **3 tiers** (full detail in [12](12-code-execution.md))

Browser iframe → WebContainer → Firecracker microVM. The economic argument: ~80% of the 520 tasks
never need a server. Running all of them server-side would cost roughly 10–15× more per student and
add 2–5 s to every loop.

### AI — **Anthropic Claude** (Sonnet 5 tutor, Haiku 4.5 classification/translation, Opus 5 reviews)

Strong code reasoning, good Mongolian, prompt caching (important for our repetitive lesson context),
and streaming. Abstracted behind `packages/ai` so a provider swap is one adapter.

### Auth — **Auth.js (NextAuth v5)**

Email+password (argon2id) and Google at MVP; GitHub OAuth added for the deployment lessons; school
SSO (SAML/OIDC) at Phase 3. Sessions are DB-backed opaque cookies, not JWTs — we need instant
revocation for impersonation and suspension.

### Hosting & regions

| Component | Where | Why |
|---|---|---|
| Static/CDN | Cloudflare (global, incl. Asia PoPs) | Lowest RTT to Mongolia; free-tier bandwidth |
| Web app | Vercel **or** Fly.io, region `nrt` (Tokyo) | Tokyo is the lowest-latency major region from Ulaanbaatar (~90–130 ms) via the common transit paths; Singapore ~160–200 ms |
| Runner + sandboxes | Fly.io `nrt`, or dedicated Hetzner boxes if unit costs demand | Firecracker needs bare-metal-ish control |
| Postgres | Neon `ap-northeast-1` | Co-located with the app |
| Redis | Upstash `ap-northeast-1` | Co-located |
| Object storage | Cloudflare R2 | No egress fees — matters for ZIP exports |

> **Latency reality check to validate in week 1:** measure real RTT from UB (Mobicom/Unitel/Skytel)
> to Tokyo, Singapore, Hong Kong and Frankfurt from 20 student devices. If Tokyo is not the winner,
> move. This is a measurement, not an assumption.

### Email / notifications
Resend (transactional) with Mongolian templates; web push via a PWA service worker. SMS (OTP,
reminders) via a local aggregator only if phone auth ships.

### Payments
QPay (dominant in Mongolia, QR + deeplink from every banking app), plus direct bank transfer with a
reference code, plus Stripe for diaspora/USD. Card acquiring in-country is slow to set up; QPay first.

### Observability
Sentry (errors, frontend + backend), OpenTelemetry traces on `submit` and sandbox lifecycle,
Grafana/Prometheus or Better Stack for infra, PostHog (self-hosted or EU) for product analytics —
**no third-party SDK ever receives student source code.**

---

## 11.3 Service boundaries

| Service | Responsibility | Scaling profile |
|---|---|---|
| **web** (Next.js) | UI, auth, progression, XP, content serving, Tier-1/2 server re-validation, AI orchestration | Bursty; scales horizontally, stateless |
| **runner** (Fastify) | Sandbox lifecycle, file sync, terminal/WS, Tier-3 validation, preview proxy | CPU/memory-bound; pool of warm VMs; scales by concurrent sandboxes |
| **worker** (BullMQ) | Screenshots, emails, FAQ clustering, materialised views, nightly reconciliation | Cron + queue |
| **content** (build-time) | Lint, test, bundle, publish content versions | CI only |

Only these three runtime services. Resist a microservice split until the runner is genuinely a
different scaling problem — it already is; nothing else is.

---

## 11.4 Data flow: a task submission (end to end)

```
 1. Client freezes buffers → FileSet
 2. Client runs checkers in the preview iframe             (Tier 1)   ~40 ms
 3. UI paints the optimistic verdict                                   ~10 ms
 4. POST /api/tasks/:id/submit
 5. web: authz, rate limit, size guard                                  ~5 ms
 6. web: persist Submission + CodeSnapshot (R2 if large)               ~20 ms
 7. web: authoritative re-run
       Tier 1/2 → happy-dom + Node worker pool                          ~40 ms
       Tier 3   → enqueue → runner → warm VM → checkers                1–5 s
 8. web: transaction {
        TaskAttempt, CheckResult[], XpLedger, StudentProfile.totalXp,
        LessonProgress, SkillMastery, UserAchievement[], streak
    }                                                                   ~25 ms
 9. web: emit analytics events (fire-and-forget to the queue)
10. Response → client reconciles, animates the unlock
```

Everything in step 8 is one transaction so a crash never leaves XP awarded without the attempt
recorded, or a task unlocked without XP.

---

## 11.5 Environments

| Env | Purpose | Data |
|---|---|---|
| `local` | Docker Compose: Postgres, Redis, MinIO, runner (Docker sandbox mode) | seeded |
| `preview` | Per-PR deploy + Neon branch + shared runner with tight quotas | seeded |
| `staging` | Mirror of prod, real content, synthetic students, nightly E2E | anonymised |
| `production` | — | real |

Content has its own promotion path (draft → review → published version) independent of code deploys,
so an author can fix a typo at 22:00 without a code release.

---

## 11.6 Failure modes & degradation

| Failure | Behaviour |
|---|---|
| Anthropic down | Tutor drawer shows hints + FAQ + forum. Learning loop unaffected. |
| Runner down | Tier 1/2 fully works. Tier 3 lessons show "Сервер завгүй байна" with a retry and a queue position; attempts are not counted. |
| Postgres down | Read-only mode from cache for lessons; submissions queue in the client (IndexedDB) and flush later; a clear banner is shown. |
| Redis down | Rate limits fail open with a lower in-process cap; queues degrade to inline processing for critical paths. |
| CDN/content bundle stale | Version pinning means students continue on the version they hold. |
| Student network drops | Editor keeps working; autosave queues; submit queues. |
| WebContainer unsupported | Transparent fallback to Tier 3. |

**Rule:** no dependency other than the web app + Postgres may sit on the critical path of
"student passes a Tier-1 task".

---

## 11.7 Performance budgets (release gates)

| Metric | Budget |
|---|---|
| TTFB `/learn/:id` from UB | ≤ 400 ms p95 |
| Lesson interactive (warm) | ≤ 1.2 s p95 |
| Lesson interactive (cold, 4G) | ≤ 3.5 s p95 |
| Keystroke → preview | ≤ 150 ms p95 |
| Submit verdict tier 1 | ≤ 300 ms p95 |
| Submit verdict tier 3 | ≤ 6 s p95 |
| Sandbox cold boot | ≤ 4 s p95 |
| Lesson shell JS | ≤ 400 KB gz |
| Dashboard LCP | ≤ 1.8 s p95 |

Enforced by: bundlesize CI gate, Lighthouse CI on 3 key routes, k6 load test in staging, and RUM
alerts in production.

---

## 11.8 Cost model (order of magnitude, monthly)

At **1,000 active students**, 60% on paid, average 8 h/week:

| Item | Est. |
|---|---|
| Vercel/Fly web | $120 |
| Neon Postgres | $70 |
| Upstash Redis | $30 |
| R2 storage + ops (snapshots ~50 GB) | $15 |
| Runner: ~40 concurrent sandboxes peak → 3× dedicated 16 vCPU/64 GB | $420 |
| Anthropic (tutor, after FAQ cache) | $600 |
| Cloudflare, Sentry, Resend, misc | $120 |
| **Total** | **≈ $1,375 / mo ≈ ₮4.8M** |

Revenue at 600 paying × ₮69,000 ≈ ₮41M ≈ $11,700 → **~88% gross margin**, before content and
salaries. The two variables that can break this are sandbox concurrency and AI tokens; both have
explicit caps and both are why the 3-tier execution model exists.

WebContainer commercial licensing (if adopted) is a separate line item — evaluate against the
runner-cost delta at P2.

---

## 11.9 Architecture Decision Records to write first

| ADR | Question |
|---|---|
| ADR-001 | CodeMirror vs Monaco *(decided: CodeMirror)* |
| ADR-002 | WebContainers vs remote sandboxes for Tier 2 *(decided: hybrid, revisit at P2)* |
| ADR-003 | Firecracker vs gVisor vs plain Docker for Tier 3 *(decided: Firecracker, gVisor fallback)* |
| ADR-004 | Content in git vs in DB *(decided: git, DB mirror)* |
| ADR-005 | Region choice *(pending the week-1 latency measurement)* |
| ADR-006 | Session cookies vs JWT *(decided: DB sessions)* |
| ADR-007 | Client-side checking with server re-verification *(decided)* |

---

*Next: [12 — Code Execution](12-code-execution.md)*
