# 05 — Task Validation Engine

> The single feature that separates this from a tutorial site. If validation is weak, students
> either get falsely rewarded (learn nothing) or falsely blocked (quit). Both are fatal.

---

## 5.1 Design goals

| Goal | Consequence |
|---|---|
| **Fast** — verdict in < 300 ms for Tier 1 | Run checks in the browser, in the same iframe that already rendered the preview |
| **Honest** — cannot be faked | Server re-verification on every claimed pass (§5.6) |
| **Kind** — never a raw stack trace | Every check carries an author-written Mongolian `onFail` |
| **Tolerant** — many correct answers pass | Semantic checks (DOM/AST/behaviour), never string equality against the solution |
| **Debuggable by authors** | Every check is individually reported with ✓/✗ and the actual observed value |
| **Extensible** | Checker registry; a new type is a new package export |

**Anti-goal:** we do *not* grade style, formatting, or "elegance" automatically. That's the AI
reviewer's advisory job in [06](06-ai-tutor.md), never a blocker.

---

## 5.2 Check taxonomy

A `Check` is:

```ts
type Check = {
  id: string;                        // unique within the task
  type: CheckType;                   // registry key
  args: Record<string, unknown>;     // typed per checker
  onFail: { mn: string; en?: string };
  onPass?: { mn: string };           // optional positive note
  weight?: number;                   // default 1
  hidden?: boolean;                  // not shown before submit (used in checkpoints)
  runsOn: "client" | "server" | "either";  // derived, author rarely sets it
};
```

### Registry (v1)

#### Structure / markup — `dom.*` (Tier 1–4, runs in preview iframe or on server via happy-dom)

| Type | Args | Meaning |
|---|---|---|
| `dom.exists` | `selector, min?, max?` | element(s) present |
| `dom.notExists` | `selector` | element absent (e.g. "no inline styles left") |
| `dom.count` | `selector, equals \| min \| max` | exact cardinality (6 product cards) |
| `dom.text` | `selector, equals? \| contains? \| matches?, trim?, normalizeWhitespace?` | text content |
| `dom.attr` | `selector, name, equals? \| contains? \| exists?` | attribute check (`alt`, `href`, `type`) |
| `dom.hierarchy` | `parent, child, direct?` | nesting relation |
| `dom.order` | `selectors[]` | document order (header before main before footer) |
| `dom.formField` | `name, type, required?, labelled?` | form correctness incl. a11y label |
| `dom.a11y` | `rules[]` | axe-core subset: img-alt, label, contrast, heading-order |
| `html.valid` | `allowWarnings?` | HTML parse validity (no unclosed tags) |

#### Styling — `css.*` (runs in the preview iframe; **computed** styles, not source text)

| Type | Args | Meaning |
|---|---|---|
| `css.computed` | `selector, prop, equals? \| oneOf? \| notEquals?` | `getComputedStyle` value |
| `css.numeric` | `selector, prop, min?, max?` | e.g. `padding-top` ≥ 12px |
| `css.layout` | `selector, mode: "flex"\|"grid", axis?, columns?` | layout system in effect |
| `css.box` | `selector, widthMin?, heightMin?, visible?` | geometry via `getBoundingClientRect` |
| `css.responsive` | `viewport: {w,h}, then: Check[]` | re-runs child checks at a viewport size |
| `css.contrast` | `selector, min: 4.5` | WCAG contrast |
| `css.noHardcoded` | `props[], allowVars: true` | forces custom-property use in the tokens lesson |

#### Code shape — `ast.*` (parsed with `@babel/parser` / `postcss` / `parse5`)

Used to require a *technique*, not an output. Use sparingly — over-constraining kills the
"many correct answers" property.

| Type | Args | Meaning |
|---|---|---|
| `ast.usesHook` | `file, hook: "useState"` | React hook used |
| `ast.callsFunction` | `file, name, minTimes?` | e.g. `fetch` called |
| `ast.declares` | `file, kind: "function"\|"const", name` | named export/function exists |
| `ast.forbids` | `file, patterns[]` | e.g. forbid `innerHTML` in the XSS lesson, forbid `var` |
| `ast.imports` | `file, from, named?` | import present |
| `ast.noHardcodedSecret` | `file` | flags literal API keys |

#### Behaviour — `js.*` / `test.*`

| Type | Args | Meaning |
|---|---|---|
| `js.unit` | `testFile` | Vitest file runs against the student's module. Failures mapped by test name. |
| `js.evaluate` | `expr, equals \| matches` | evaluate an expression in the sandboxed page (`formatPrice(129000) === "₮ 129,000"`) |
| `js.interaction` | `steps[]` | scripted user interaction then assertions — the workhorse for cart tasks |
| `js.consoleClean` | `allow?: string[]` | no uncaught errors during load+interaction |
| `react.render` | `component, props, then: Check[]` | render in isolation with Testing Library |
| `react.behaviour` | `steps[]` | fireEvent/userEvent script + assertions on DOM and state |

`js.interaction` step grammar:

```json
{
  "type": "js.interaction",
  "args": {
    "steps": [
      { "click": "[data-testid='add-to-cart-1']" },
      { "waitFor": "[data-testid='cart-count']" },
      { "expectText": { "selector": "[data-testid='cart-count']", "equals": "1" } },
      { "click": "[data-testid='add-to-cart-1']" },
      { "expectText": { "selector": "[data-testid='cart-count']", "equals": "2" } },
      { "expectEval": { "expr": "window.cart.length", "equals": 1 } }
    ]
  },
  "onFail": { "mn": "Нэг бүтээгдэхүүнийг 2 удаа дарахад сагсанд 2 өөр мөр болох ёсгүй — тоо ширхэг нь 2 болох ёстой." }
}
```

> **Contract note:** tasks that need selectors give the student the `data-testid` in the statement.
> We never silently depend on a class name the student was free to invent.

#### HTTP — `http.*` (Tier 3, against the student's running dev server inside the sandbox)

| Type | Args | Meaning |
|---|---|---|
| `http.request` | `method, path, headers?, body?, expect: {status?, jsonSchema?, jsonPath?, headers?}` | one request |
| `http.sequence` | `requests[]`, with `capture` to reuse values (e.g. token, order id) | multi-step flows |
| `http.authz` | `as: userA, target: userB resource, expectStatus: 403\|404` | ownership/permission tests |
| `http.idempotent` | `request, times` | repeated POST must not duplicate |

```json
{
  "type": "http.sequence",
  "args": {
    "requests": [
      { "method": "POST", "path": "/api/auth/login",
        "body": { "email": "test@shop.mn", "password": "Test1234" },
        "expect": { "status": 200 }, "capture": { "cookie": "header:set-cookie" } },
      { "method": "POST", "path": "/api/orders", "cookie": "$cookie",
        "body": { "addressId": 1 }, "expect": { "status": 201, "jsonPath": { "$.status": "pending" } },
        "capture": { "orderId": "$.id" } },
      { "method": "GET", "path": "/api/orders/$orderId", "cookie": "$cookie",
        "expect": { "status": 200, "jsonPath": { "$.items.length": 2 } } }
    ]
  },
  "onFail": { "mn": "Захиалга үүсгэсний дараа түүнийг дахин уншиж чадсангүй. `GET /api/orders/:id` буцаах өгөгдлөө шалгаарай." }
}
```

#### Data — `sql.*` / `db.*`

| Type | Args | Meaning |
|---|---|---|
| `sql.resultEquals` | `query?, expectRows, orderSensitive?, columns?` | run the student's query (or the fixed grading query against their schema) and compare result sets |
| `sql.schema` | `table, columns[], pk?, fk?, notNull?, unique?` | schema-shape assertion |
| `sql.plan` | `query, mustUseIndex` | EXPLAIN contains an index scan (perf lesson) |
| `db.state` | `after: Check[]`, `query`, `expect` | DB state after an HTTP flow (order rows created, stock decremented) |
| `db.transactional` | `flow, failAt, expect: "no partial rows"` | injects a failure mid-flow to prove atomicity |

#### Meta

| Type | Args | Meaning |
|---|---|---|
| `file.exists` | `path` | file created/renamed correctly |
| `file.matches` | `path, pattern` | **discouraged** — regex on source. Allowed only for config files (`.env.example`, `package.json`). Linter warns. |
| `build.succeeds` | `command` | `next build` / `tsc --noEmit` passes |
| `lighthouse` | `metric, min` | perf/a11y score in the perf lesson |
| `deploy.live` | `urlSource: "student.deployUrl", expect: Check[]` | hits the student's real deployed URL |

---

## 5.3 Where each check runs

```
                       ┌────────────────────────────────────────────┐
Tier 1  (static)       │ BROWSER — preview iframe                   │
  dom.* css.* js.*     │  harness.js injected into the sandboxed     │  ≤ 300 ms
  ast.* (worker)       │  iframe; postMessage results to the host    │
                       └────────────────────────────────────────────┘
                       ┌────────────────────────────────────────────┐
Tier 2  (react/vite)   │ BROWSER — WebContainer                     │
  + react.* js.unit    │  vitest runs inside the WebContainer        │  1–4 s
                       └────────────────────────────────────────────┘
                       ┌────────────────────────────────────────────┐
Tier 3  (node+pg)      │ SERVER — microVM sandbox (Runner service)   │
  + http.* sql.* db.*  │  student dev server + ephemeral Postgres    │  2–8 s
  + build.* deploy.*   │                                            │
                       └────────────────────────────────────────────┘
```

`packages/checkers` is **isomorphic**: the same checker implementation runs in the browser harness
and in the server runner. This guarantees the client verdict and the server verdict agree.

---

## 5.4 Submission flow

```
Student presses  [ ✓ Шалгах ]
        │
        ├─ 1. Client freezes the editor buffers → builds a FileSet
        │
        ├─ 2. Local run  (Tier 1/2) → CheckResult[]  ────────────► render verdict IMMEDIATELY
        │                                                          (optimistic, labelled ✓)
        ├─ 3. POST /api/tasks/:id/submit  { files, clientResults, durationMs, hintsUsed }
        │
        ├─ 4. Server:
        │       a. rate limit + size limit (≤ 512 KB, ≤ 200 files)
        │       b. persist Submission (files as a snapshot ref)
        │       c. re-run checks authoritatively
        │             Tier 1/2 → headless (happy-dom / jsdom / node vitest) in a worker
        │             Tier 3   → dispatch to Runner, sandboxed
        │       d. compare with clientResults → if mismatch, flag `suspicious`, trust the server
        │       e. if pass: award XP, unlock next, update progress, emit events
        │
        └─ 5. Response { passed, checks[], xpAwarded, unlocked, feedback, attemptNo }
                 │
                 └─ Client reconciles. Divergence from the optimistic verdict is rare;
                    when it happens the UI shows the server result with a short note.
```

**Why optimistic-then-confirm?** The perceived latency of the loop is what makes the product feel
alive. But we still need a verdict we can put on a certificate.

Server re-verification budget: Tier 1 checks re-run in ~40 ms in a Node worker with `happy-dom`, so
this is cheap. It is *not* skipped, ever, for the run that flips a task to complete.

---

## 5.5 Result & feedback rendering

```
┌── ҮР ДҮН ────────────────────────────────┐   ┌── ҮР ДҮН ────────────────────────────┐
│ ✅ Бүх шалгалт амжилттай                 │   │ ⚠️ 2/3 шалгалт давлаа                │
│                                          │   │                                      │
│ ✓ product-card class-тай article байна   │   │ ✓ <article> элемент байна            │
│ ✓ Зураг alt-тай                          │   │ ✓ Зураг байна                        │
│ ✓ Үнэ ₮ тэмдэгтэй                        │   │ ✗ Үнэ ₮ тэмдэгтэй байх               │
│                                          │   │   Таны бичсэн: "129000"              │
│ +10 XP     🎉 Дараагийн даалгавар →      │   │   Хүлээгдсэн: "₮" тэмдэгт агуулсан   │
└──────────────────────────────────────────┘   │                                      │
                                                │   💡 Заавар авах   🤖 AI-аас асуух   │
                                                └──────────────────────────────────────┘
```

Feedback rules:
1. **Show passed checks too.** Partial success is the main motivation signal on a failed attempt.
2. **Show the observed value** next to the expected one whenever the checker can produce it
   (`actual` field on `CheckResult`). This alone resolves ~40% of failures without a hint.
3. **Only the first failing check gets an expanded explanation**; the rest collapse. Beginners cannot
   process 5 simultaneous errors.
4. **Never show the solution in the failure message.**
5. **Runtime errors are translated.** A `TypeError: Cannot read properties of undefined (reading 'map')`
   becomes:
   > **Юу болов?** `products` хувьсагч одоохондоо `undefined` байна, тиймээс `.map()` ажиллаж чадахгүй.
   > **Хаана?** `ProductGrid.jsx:12`
   > **Яагаад?** Өгөгдөл ирэхээс өмнө component нэг удаа render хийгддэг.
   > **Хэрхэн олох вэ?** `console.log(products)`-ыг `.map()`-ийн өмнө тавьж юу байгааг хараарай.

   Implemented as an **error translation table** (`packages/shared/errors/mn.ts`): ~120 regex→template
   entries covering the most common beginner errors per stage. Anything unmatched falls back to the
   raw message plus an "AI-аас асуух" button. Coverage of the top-20 errors per stage is a content
   deliverable, tracked in `/author/health`.

---

## 5.6 Anti-cheat & integrity

| Vector | Mitigation |
|---|---|
| Forged client results | Server always re-runs. Client results only affect perceived latency. |
| Hardcoding output to satisfy checks | Checks assert *behaviour and structure*, and every task has ≥ 1 check the student cannot satisfy by hardcoding (e.g. `dom.count` against a data array of variable length, or a `js.interaction` that adds a new product at runtime). Author linter warns if all checks in a task are static. |
| Copying the solution | Solution is gated (≥ 2 failed attempts **and** hint 3 viewed **and** ≥ 5 minutes on task). Revealing sets `Submission.assisted = true`, awards 40% XP, marks the task **"Тусламжтай"** in the teacher view. Not blocked — blocking makes students leave the platform to find the answer elsewhere. |
| Copying from another student | `CodeSnapshot` timeline + paste-burst detection: a single edit event inserting > 120 chars that matches another student's snapshot ≥ 90% (normalised) raises a `similarity` signal. Never auto-punished; surfaced to the teacher only. |
| Asking the AI for the answer | Tutor policy engine refuses; see [06](06-ai-tutor.md) §6.4. Attempts are counted, not punished. |
| Editing the check payload in devtools | Checks are never sent to the client in a form that grants passing; the server holds the canonical `checks[]` and the client receives only ids + display text. |
| Certificate fraud | Certificates only reference tasks that passed **server-side, unassisted** ≥ 70%. Verification page shows assisted ratio. |

---

## 5.7 Determinism, flakiness & timeouts

- Every sandbox run gets a **fixed clock** (`Date.now` frozen offset) and a **seeded RNG** where the
  content declares randomness.
- `js.interaction` uses explicit `waitFor` with a 3 s cap; no arbitrary sleeps allowed in content
  (linter rejects `{"sleep": n}` over 300 ms).
- Per-check timeout: Tier 1 = 2 s, Tier 2 = 15 s, Tier 3 = 30 s. Whole submission cap: 60 s.
- **Flake detection:** the platform records `checkId → (pass, fail)` per run. A check whose verdict
  flips for the *same file hash* is auto-flagged in `/author/health` and, above a 2% flip rate, is
  automatically down-weighted to `weight: 0` (advisory) with an alert, so a broken check never blocks
  a cohort at 23:00.

---

## 5.8 Checker implementation contract

```ts
// packages/checkers/src/types.ts
export interface CheckerContext {
  files: FileSet;                        // student's files
  dom?: Document;                        // Tier 1/2: live or parsed
  window?: Window;                       // Tier 1/2 only
  http?: (req: HttpReq) => Promise<HttpRes>;   // Tier 3
  sql?: (q: string, params?: unknown[]) => Promise<Rows>;
  ast: (path: string) => Promise<Node>;  // cached parse
  log: (msg: string) => void;
}

export interface CheckResult {
  id: string;
  passed: boolean;
  actual?: string;          // rendered next to expected in the UI
  expected?: string;
  errorKind?: "assertion" | "runtime" | "timeout" | "infra";
  raw?: string;             // never shown directly; used by the AI tutor & author debugging
  durationMs: number;
}

export type Checker = (args: unknown, ctx: CheckerContext) => Promise<CheckResult>;
```

Rules for checker authors:
- A checker **must not throw**; infra failures return `errorKind: "infra"`, which is treated as
  "not the student's fault" — the attempt is not counted and the UI says
  *"Систем дээр алдаа гарлаа. Таны буруу биш. Дахин оролдоно уу."*
- A checker **must** fill `actual` when the value is showable and non-huge (≤ 200 chars).

---

## 5.9 Acceptance criteria for this module

1. `POST /api/tasks/:id/submit` returns a verdict for a Tier-1 task in ≤ 300 ms p95 (server side).
2. All 12 v1 checker families implemented with unit tests, including ≥ 3 negative fixtures each.
3. Content CI runs every published task's reference solution and known-bad fixtures.
4. A deliberately forged client result never marks a task complete (integration test).
5. Flake auto-down-weighting proven by a synthetic flaky check.
6. Error translation table covers ≥ 20 errors for stages 1–2 at launch.

---

*Next: [06 — AI Tutor](06-ai-tutor.md)*
