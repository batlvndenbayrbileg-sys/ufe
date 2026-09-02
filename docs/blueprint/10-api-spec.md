# 10 — API Specification

Base: `https://khiye.mn/api` · JSON only · auth via httpOnly session cookie (`khiye_session`)
Runner service: `https://runner.khiye.dev` (internal; called only by the web app with a service token)

---

## 10.1 Conventions

**Success**
```json
{ "data": { … }, "meta": { "requestId": "req_…" } }
```

**Error** (never a bare string; the `mn` message is displayable to students)
```json
{
  "error": {
    "code": "TASK_LOCKED",
    "message": "Task is locked for this user",
    "mn": "Энэ даалгавар хараахан нээгдээгүй байна. Өмнөх даалгавраа дуусгана уу.",
    "details": { "requiredTaskId": "m1-l5-t2" }
  },
  "meta": { "requestId": "req_…" }
}
```

| HTTP | Use |
|---|---|
| 400 | validation (`VALIDATION_FAILED`, `details.fields[]`) |
| 401 | not authenticated (`UNAUTHENTICATED`) |
| 403 | authenticated but not permitted (`FORBIDDEN`, `TASK_LOCKED`, `PLAN_REQUIRED`) |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` (e.g. workspace version conflict) |
| 413 | `PAYLOAD_TOO_LARGE` (workspace/submission caps) |
| 422 | `UNPROCESSABLE` (semantically invalid content) |
| 429 | `RATE_LIMITED` + `Retry-After` |
| 500/503 | `INTERNAL` / `SANDBOX_UNAVAILABLE` — **never counts as a failed attempt** |

Pagination: `?page=1&limit=20` → `meta: { page, limit, total, hasNext }`.
Idempotency: mutating endpoints that can be retried accept `Idempotency-Key` header.
Versioning: URL-less v1; breaking changes ship as `/api/v2/...`. Content shape is versioned by
`ContentVersion`, not by the API.

---

## 10.2 Auth

```
POST   /api/auth/register        { email, password, name, username? }        → 201 { user }
POST   /api/auth/login           { email, password }                          → 200 { user } + cookie
POST   /api/auth/logout                                                       → 204
GET    /api/auth/me                                                           → { user, profile, plan }
POST   /api/auth/verify-email    { token }                                    → 204
POST   /api/auth/forgot          { email }                                    → 204 (always)
POST   /api/auth/reset           { token, password }                          → 204
GET    /api/auth/oauth/:provider                → 302   (google, github)
GET    /api/auth/oauth/:provider/callback       → 302 → /app
POST   /api/auth/github/link     { code }        → 200  (for deployment lessons)
```

Rate limits: register 5/h/IP · login 10/10min/IP+email · forgot 3/h/email.

---

## 10.3 Onboarding & placement

```
GET    /api/onboarding/placement                       → { questions[] }
POST   /api/onboarding/placement    { answers[] }      → { entryPoint, skippedModules[] }
POST   /api/onboarding/complete     { goal, hoursPerWeek }
                                                       → { targetDate, firstLessonId }
```

---

## 10.4 Course & content (read-heavy, edge-cached by `ContentVersion`)

```
GET /api/courses                                  → [{ id, title, description, stats }]
GET /api/courses/:courseId                        → { course, stages[ modules[ lessons[] ] ],
                                                      progress }           # progress merged for the caller
GET /api/courses/:courseId/map                    → lightweight tree for the course map screen
GET /api/lessons/:lessonId                        → {
      lesson, tasks: TaskPublic[], workspacePatch, executionConfig,
      progress: { taskIndex, statuses[] }, locked: bool, lockReason?
   }
GET /api/lessons/:lessonId/content                → MDX bundle (edge-cached, immutable per version)
GET /api/tasks/:taskId                            → TaskPublic
```

`TaskPublic` **excludes** `checks[].args`, `solution`, and unviewed hints:

```ts
type TaskPublic = {
  id; order; title; statement; requirements; expected; targetFile; marker;
  starterPatch; xp; estimatedMinutes; skills;
  checkSummaries: { key: string; label: string }[];   // display labels only
  hints: { level: 1|2|3; unlocked: boolean; text?: string; code?: string }[];
  solution: { unlocked: boolean; patch?: FilePatch[]; explanation?: string };
};
```

---

## 10.5 The learning loop (the critical path)

```
POST /api/tasks/:taskId/submit
Body: {
  files: { "index.html": "…", "styles/main.css": "…" },   // ≤ 512 KB total, ≤ 200 files
  clientResults?: [{ key, passed, actual?, durationMs }],
  durationMs: number,
  hintsUsed: number,
  sandboxSessionId?: string           // tier 3
}
→ 200 {
  passed: true,
  attemptNo: 3,
  checks: [ { key, label, passed, actual?, expected?, onFail? } ],
  feedback: { headline: "🎉 Маш сайн!", body?: "…" },
  xpAwarded: 10,
  assisted: false,
  unlocked: { nextTaskId?: "m1-l5-t2", nextLessonId?: null },
  progress: { lesson: { tasksPassed: 2, tasksTotal: 4 }, course: { percent: 12.4 } },
  achievements: [ { id: "first-website", title: {…} } ],
  streak: { days: 7, extendedToday: true }
}
```

```
POST /api/tasks/:taskId/run          { files, sandboxSessionId? }
     → tier 1/2: 204 (client renders locally; endpoint only records telemetry)
     → tier 3:  { previewUrl, logsChannel }         # triggers a sandbox build

POST /api/tasks/:taskId/hint         { level: 1|2|3 }
     → { level, text, code?, xpCost, xpBalance }
       403 HINT_LOCKED if level > current+1

POST /api/tasks/:taskId/solution
     → { patch, explanation, xpPenalty }
       403 SOLUTION_LOCKED { details: { attemptsRequired: 2, attemptsMade: 1,
                                        hintsRequired: 3, hintsViewed: 1,
                                        minMinutes: 5, minutesOnTask: 2 } }

POST /api/tasks/:taskId/reset        { scope: "task" | "file", path? }
     → { files }                     # snapshot taken first, undo token returned

GET  /api/tasks/:taskId/attempts     → [{ attemptNo, passed, createdAt, failedChecks[] }]
```

**Submit is the most important endpoint in the product.** Requirements:
p95 ≤ 300 ms (tier 1), ≤ 1.5 s (tier 2), ≤ 6 s (tier 3); idempotent under retry with the same
`Idempotency-Key`; never awards XP twice for the same task; writes `Submission`, `CheckResult[]`,
`TaskAttempt`, `XpLedger`, `LessonProgress`, achievements — all in **one transaction**.

---

## 10.6 Workspace & snapshots

```
GET   /api/workspace/:courseId                       → { files, updatedAt, version }
PUT   /api/workspace/:courseId   { patch[], baseVersion }
                                                     → { version } | 409 CONFLICT { serverFiles }
POST  /api/workspace/:courseId/snapshot { kind, taskId? } → { snapshotId }
GET   /api/snapshots/:id                             → { files }
GET   /api/snapshots?taskId=…&limit=50               → timeline for replay
GET   /api/workspace/:courseId/export                → 302 → signed R2 ZIP URL
POST  /api/workspace/:courseId/share  { public: bool } → { url: "https://khiye.mn/u/anuujin/shop-mn" }
```

Autosave uses `PUT` with a JSON-patch-style `patch[]` to keep payloads at a few hundred bytes.

---

## 10.7 Progress, profile, gamification

```
GET  /api/progress                                → { course, modules[], skills[], xp, level, streak }
GET  /api/progress/:courseId/timeline             → daily tasks/xp for the graph
GET  /api/achievements                            → { earned[], available[], next[] }
GET  /api/profile/me                              → { user, profile, editorPrefs }
PATCH /api/profile/me      { name, username, avatarUrl, locale, editorPrefs, hoursPerWeek }
GET  /api/profile/:username                       → public profile (no email)
POST /api/streak/freeze                           → { freezesLeft }
POST /api/streak/pause     { until }              → { pausedUntil }
```

---

## 10.8 AI tutor

```
POST /api/ai/tutor         { lessonId, taskId, message, conversationId? }
     → text/event-stream:
        event: meta      data: { conversationId, resolvedBy: "llm"|"faq", policy: {…} }
        event: delta     data: { text: "…" }
        event: done      data: { messageId, tokensIn, tokensOut, filtered: false }
        event: error     data: { code: "AI_UNAVAILABLE", mn: "…" }

POST /api/ai/explain-error { lessonId, taskId, error: { message, stack, file, line } }
     → { explanation: { what, where, why, howToFind } }     # table lookup first, LLM fallback

POST /api/ai/review        { taskId }                        # post-pass, optional
     → { note: { mn }, severity: "info" }

GET  /api/ai/conversations?lessonId=…                        → history
GET  /api/ai/quota                                           → { used, limit, resetsAt }
```

429 `AI_QUOTA_EXCEEDED` carries `mn` copy pointing to hints and the forum.

---

## 10.9 Sandbox / code execution (proxied to the Runner)

```
POST   /api/sandbox/start      { lessonId }         → { sessionId, status: "booting" }
GET    /api/sandbox/:id                             → { status, previewUrl?, ports[], error? }
WS     /api/sandbox/:id/events                      → { type: "log"|"status"|"port"|"exit", … }
WS     /api/sandbox/:id/terminal                    → pty stream (restricted shell)
POST   /api/sandbox/:id/sync   { patch[] }          → 204     # file sync into the VM
POST   /api/sandbox/:id/exec   { command }          → { execId } (allowlisted commands only)
DELETE /api/sandbox/:id                             → 204
GET    /api/sandbox/quota                           → { concurrent, minutesUsed, minutesLimit }
```

Runner internal API (service-token auth, never reachable from browsers):

```
POST /internal/vm/create   { image, limits, files, services }   → { vmId, endpoint }
POST /internal/vm/:id/run  { command, timeoutMs }               → { stdout, stderr, exitCode }
POST /internal/validate    { taskId, checks[], files, runtime } → { results[] }
DELETE /internal/vm/:id
```

---

## 10.10 Teacher

```
GET  /api/teach/cohorts                              → [{ id, name, students, avgPercent }]
POST /api/teach/cohorts       { name, courseId, startsAt } → { cohort, joinCode }
GET  /api/teach/cohorts/:id/students                 → roster + progress + riskFlags[]
GET  /api/teach/cohorts/:id/heatmap                  → matrix (from the materialised view)
GET  /api/teach/cohorts/:id/analytics                → hotspots, medians, funnel
GET  /api/teach/students/:userId                     → detailed progress (cohort-scoped authz)
GET  /api/teach/students/:userId/attempts?taskId=…   → attempts + snapshot ids
GET  /api/teach/students/:userId/replay?taskId=…     → ordered snapshots for the scrubber
POST /api/teach/assignments   { cohortId, targetType, targetId, dueAt, weight }
GET  /api/teach/gradebook/:cohortId?format=csv|xlsx  → file
GET  /api/teach/integrity/:cohortId                  → similarity clusters, paste bursts
POST /api/teach/message       { cohortId|userId, text }
```

Authorization rule: a TEACHER may read a student's data **only** through a cohort they own, and only
for the enrolled course. Every such read writes an `AuditLog` row.

---

## 10.11 Author / content

```
GET    /api/author/courses
POST   /api/author/lessons                { moduleId, …lesson }   → draft
PATCH  /api/author/lessons/:id
POST   /api/author/lessons/:id/tasks
PATCH  /api/author/tasks/:id
POST   /api/author/tasks/:id/checks       { type, args, onFail }
POST   /api/author/tasks/:id/test         { fixture: "solution" | "bad-1" | files }
       → { results[], passed }            # runs the real checkers
POST   /api/author/lessons/:id/preview    → { previewToken }      # opens the student view
POST   /api/author/publish                { lessonIds[], changelog } → { contentVersionId }
POST   /api/author/rollback               { contentVersionId }
GET    /api/author/health                 → { hardTasks[], flakyChecks[], slowTasks[], faqClusters[] }
```

---

## 10.12 Admin

```
GET  /api/admin/kpis?range=30d
GET  /api/admin/users?q=&role=&status=
POST /api/admin/users/:id/impersonate        → short-lived token, audited, banner in UI
PATCH /api/admin/users/:id                   { role, status }
GET  /api/admin/sandboxes                    → live sessions
DELETE /api/admin/sandboxes/:id
GET  /api/admin/ai/usage?range=
GET  /api/admin/flags     |  PATCH /api/admin/flags/:key
GET  /api/admin/audit?actorId=&action=
```

---

## 10.13 Billing (Mongolian providers)

```
GET  /api/billing/plans                              → plans in ₮
POST /api/billing/checkout   { plan, provider }      → { invoiceId, qpayDeeplink?, bankDetails? }
GET  /api/billing/invoices/:id                       → { status }
POST /api/billing/webhook/qpay                       → 200 (signature-verified, idempotent)
POST /api/billing/cancel
GET  /api/billing/subscription
```

QPay flow: create invoice → return deeplink + QR → poll/webhook → activate plan. Bank transfer flow:
generate a reference code, reconcile via a daily statement import (manual at MVP).

---

## 10.14 Shop.mn API — the spec the **student** implements

This is *curriculum*, not platform code. It is the contract the `http.*` checks assert against, and it
is published to the student as documentation in the lesson.

```
GET    /api/products?category=&q=&sort=price_asc|price_desc|newest&page=&limit=
       → { data: Product[], meta: { page, limit, total, hasNext } }
GET    /api/products/:id            → Product | 404
POST   /api/products                → 201 Product          [admin]
PUT    /api/products/:id            → 200 Product          [admin]
DELETE /api/products/:id            → 204                  [admin]

GET    /api/categories              → Category[]
POST   /api/categories              → 201                  [admin]

POST   /api/auth/register  { email, password, name }  → 201 { user }
POST   /api/auth/login     { email, password }        → 200 { user } + httpOnly cookie
POST   /api/auth/logout                               → 204
GET    /api/auth/me                                   → { user } | 401

GET    /api/cart                    → { items: CartItem[], subtotal }
POST   /api/cart/items   { productId, quantity }      → 200 cart   (upsert, not append)
PATCH  /api/cart/items/:id { quantity }               → 200 cart   (0 ⇒ remove)
DELETE /api/cart/items/:id                            → 200 cart

GET    /api/addresses  |  POST /api/addresses  |  PUT/DELETE /api/addresses/:id

POST   /api/orders       { addressId, couponCode? }   → 201 Order   (transaction: order +
                                                          items + stock decrement + cart clear)
GET    /api/orders                                    → Order[]     (own only)
GET    /api/orders/:id                                → Order | 404 (404, not 403, for
                                                          another user's order)
PATCH  /api/orders/:id   { status }                   → 200         [admin]

POST   /api/payments/checkout { orderId }             → { invoiceId, deeplink }
POST   /api/payments/webhook                          → 200 (idempotent, signature-verified)

GET    /api/admin/stats?range=                        → { revenue, orders, topProducts[] } [admin]
```

The grading fixtures for M8–M12 assert exactly these shapes, so the student's API is portable and
their frontend code from earlier stages keeps working. Deviations are allowed where the spec says
"any of", but the contract-critical fields are fixed and stated in the lesson.

---

## 10.15 Non-functional API requirements

| Requirement | Value |
|---|---|
| p95 latency (read endpoints) | ≤ 200 ms from Ulaanbaatar |
| p95 latency (submit, tier 1) | ≤ 300 ms |
| Availability | 99.5% monthly (learning loop), 99.0% (sandbox) |
| Rate limits | 600 req/min/user global; submit 30/min; AI 20/min; sandbox start 10/h |
| Payload caps | body 1 MB; workspace 512 KB; files 200 |
| Observability | every response carries `X-Request-Id`; structured logs; traces on submit & sandbox |
| Auth | httpOnly + Secure + SameSite=Lax cookie, 30-day rolling, CSRF token on mutations |
| Caching | content endpoints `Cache-Control: public, max-age=31536000, immutable` keyed by version |

---

*Next: [11 — System Architecture](11-system-architecture.md)*
