# 16 — Development Roadmap & Future Vision

---

## 16.1 Phase overview

| Phase | Name | Duration | Team | Ships |
|---|---|---|---|---|
| **P0** | MVP — Static Shop.mn | 10 weeks | 4 | Level 0 + Stage 1, Tier 1, core loop, pilot with 60 students |
| **P1** | Interactive Shop.mn | 8 weeks | 5 | Stage 2 (JavaScript), teacher panel v1, billing, certificates-lite |
| **P2** | React & the compute tier | 10 weeks | 6 | Stage 3, Tier 2 (WebContainers) + Tier 3 runner, terminal |
| **P3** | Full-stack | 12 weeks | 7 | Stages 4–6 (Next.js, API, Postgres/PGlite), Author Studio |
| **P4** | The complete course | 10 weeks | 8 | Stages 7–9 (auth, cart/orders, admin, testing, deploy), certificates, capstone |
| **P5** | Institution product | 8 weeks | 8 | Cohorts at scale, analytics, LTI, SSO, plagiarism signals, B2B contracts |
| **P6** | Platform | ongoing | 10+ | Second course, community, careers, mobile app, marketplace |

Total to a complete 12-week course: **≈ 12 months** from a standing start.

---

## 16.2 P0 — MVP (weeks 1–10)

Fully specified in [15](15-mvp-scope.md).
**Exit gate:** all 11 pilot criteria measured; ≥ 8 of 11 met, including activation, D7 and false-fail.

---

## 16.3 P1 — Interactive Shop.mn (weeks 11–18)

| Workstream | Deliverables |
|---|---|
| Content | M2 (rest of CSS), M3 (responsive), M4 (JS basics), M5 (dynamic store) — 46 lessons, ~172 tasks |
| Checkers | `js.unit`, `js.interaction`, `js.evaluate`, `ast.*`, `js.consoleClean`; the interaction-script grammar |
| Editor | ESLint-in-worker with Mongolian messages, Prettier, project-aware autocomplete |
| Preview | Network panel (for `fetch` lessons), state preservation hardening |
| Teacher | Cohort creation + join codes, roster, progress table, at-risk list, CSV export |
| Billing | QPay integration, plans, paywall at Stage 2, invoices, dunning |
| Growth | Public profiles, share cards, referral ("найзаа урих") with 2 free weeks |
| Ops | RUM dashboards, error budget, on-call, status page |

**Milestone:** the free→paid conversion moment exists and is measured. Target trial→paid ≥ 12%.

---

## 16.4 P2 — React & compute (weeks 19–28)

| Workstream | Deliverables |
|---|---|
| Content | M6 React — 16 lessons, ~58 tasks, incl. the bridge lesson refactoring the student's own code |
| Tier 2 | WebContainer boot, pinned dependency snapshots, HMR, vitest-in-browser, capability detection |
| Tier 3 | **Runner service**: Firecracker VM pool, jailer, seccomp, cgroups, TAP firewall, warm pool, preview proxy, WS logs/terminal, file sync agent |
| Security | Escape-test suite in CI, quotas, abuse detection, `preview.khiye.dev` origin split |
| Editor | Terminal (xterm + restricted shell), multi-file refactor UX |
| Checkers | `react.render`, `react.behaviour`, `build.succeeds` |

**Decision gate (ADR-002):** after 4 weeks of production data, compare
`WebContainer licence cost` vs `runner cost for Stage-3 traffic`. Pick one as the default for React;
keep the other as fallback.

**Risk:** this is the phase where the platform's engineering difficulty jumps. Budget 25% schedule
buffer. Nothing in Stage 3 content should block on the runner — WebContainers ship first, runner
second, with the fallback path proving both.

---

## 16.5 P3 — Full-stack (weeks 29–40)

| Workstream | Deliverables |
|---|---|
| Content | M7 Next.js+TS, M8 REST API, M9 Postgres — 40 lessons, ~148 tasks |
| Execution | PGlite for M9-l1..l7; per-VM Postgres for M9-l8+; TypeScript language service in a worker |
| Checkers | `http.request`, `http.sequence`, `http.authz`, `sql.resultEquals`, `sql.schema`, `db.state`, `db.transactional` |
| **Author Studio** | Lesson form + live student preview, visual checker builder, fixture runner, publish/rollback, `/author/health` |
| Teacher | Heatmap, snapshot replay, failure hotspots, common-mistake clustering |
| AI | Task-FAQ cache with pgvector, error-translation coverage for stages 4–6, post-pass reviews |

**Milestone:** an external author (not on the team) writes and publishes a lesson without engineering
help. This is the test that P10 ("instructors never touch platform code") actually holds.

---

## 16.6 P4 — The complete course (weeks 41–50)

| Workstream | Deliverables |
|---|---|
| Content | M10 auth, M11 cart/orders/payment, M12 admin, M13 testing, M14 git/deploy, M15 capstone — 46 lessons, ~150 tasks |
| Deployment | GitHub OAuth + push, Vercel + Neon provisioning for students, `deploy.live` checker |
| Certificates | Issuance, public verification page, unassisted-ratio disclosure, CV blurb generator (MN + EN) |
| Capstone | Rubric, AI draft review, human final review, showcase gallery |
| Growth | Graduate showcase page — the strongest marketing asset the product will ever have |

**Milestone:** the first cohort graduates with live URLs. Collect employment outcomes from month 12;
this is the number that sells everything afterwards.

---

## 16.7 P5 — Institution product (weeks 51–58)

Cohort management at scale · assignments and deadlines · weighted gradebook and export · LTI 1.3 for
Moodle/Canvas · SSO (OIDC/SAML) for universities · plagiarism/integrity signals with evidence views ·
teacher training material · a proctored assessment mode · per-institution content overrides.

**Business milestone:** 3 signed university contracts (≥ 300 seats total). Institutional revenue is
what makes the content investment repayable; consumer revenue alone in a market of 3.4 M people is thin.

---

## 16.8 P6 — Platform (year 2+)

### Second and third courses (proving the platform thesis)
Ordered by Mongolian labour-market demand:
1. **Mobile app development** (React Native) — build a Shop.mn *app* against the API they already wrote.
2. **Python & data** — a course whose project is an analytics dashboard over Shop.mn's data.
3. **Programming fundamentals for schools** — a 10–12 grade curriculum, sold to the Ministry/schools.
4. **English for developers** — reading docs, writing commits, interviewing. Enormous local demand,
   trivial to deliver on this engine, and it removes the ceiling our own students hit.

### Community & careers
Per-task Q&A forum with XP for accepted answers · graduate mentors paid per resolved question ·
a hiring board with partner companies (banks, fintech, telcos, agencies) · verified skill profiles
employers can filter · internship pipeline with cohort partners.

### Product
Native mobile app (review, read, quiz, short tasks — heavy coding stays on the web) ·
offline PWA for low-connectivity aimags · a Mongolian technical glossary as a public good ·
"build your own idea" mode with the same tooling and AI review · a content marketplace where
Mongolian developers publish paid courses on our engine with revenue share.

### The 3-year vision

> **Хийе becomes the default way a Mongolian learns to build software** — the place a 17-year-old
> in Khovd, a career-switcher in Ulaanbaatar, and a university in Darkhan all use, in Mongolian,
> with verifiable outcomes an employer trusts.

Concretely, by end of year 3: 4 courses, 15,000 registered / 3,500 paying students, 20 institutional
contracts, 1,200 graduates, and a published employment-outcome report. The moat is not the software —
it is **1,400 hours of verified, tested, Mongolian-language content** and the outcome data behind it.

---

## 16.9 Hiring plan

| Phase | Adds |
|---|---|
| P0 | Full-stack lead, frontend eng, content author, designer (0.5), PM/founder (0.5) |
| P1 | +1 content author (the content pipeline is the bottleneck, always) |
| P2 | +1 infra/platform engineer (runner, security, on-call) |
| P3 | +1 full-stack, +1 content author |
| P4 | +1 QA/education specialist (runs real beginners through every lesson) |
| P5 | +1 B2B sales/partnerships, +1 support/community |

The recurring lesson from every phase: **content authoring is the constraint, not engineering.**
Under-hiring authors delays the roadmap more than any technical decision in this document.

---

## 16.10 Sequenced risk register

| Phase | Top risk | Early warning | Response |
|---|---|---|---|
| P0 | Content reads like a translation | Pilot exit interviews, high attempts/task | Rewrite with the style guide; hire a second author |
| P1 | Paywall kills the funnel | Trial→paid < 6% | Move the gate later; test annual pricing; institution-first |
| P2 | Runner cost/complexity explodes | Cost per Tier-3 minute > plan | Push more to Tier 2; harder idle timeouts; queue at peak |
| P3 | Author Studio slips, content stalls | Lessons/week < 3 | Ship the CLI path; Studio can lag |
| P4 | Deployment lessons break on third-party changes | Vercel/Neon API churn | Abstract the provider; keep a self-hosted fallback |
| P5 | University procurement is slow | No signed contract by week 56 | Start procurement conversations at P1, not P5 |
| P6 | Second course dilutes quality | Course-1 metrics drop | Do not start course 2 until course 1's completion rate ≥ 35% |

---

## 16.11 Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-02 | Initial blueprint — vision, curriculum, architecture, MVP, roadmap |

---

*Next: [17 — Example Mongolian Content](17-example-content-mn.md)*
