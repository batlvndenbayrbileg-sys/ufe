# The course as built

[03-curriculum.md](blueprint/03-curriculum.md) is the **plan**: 9 stages → 15 modules →
142 lessons, spread across Tier 1 (browser), Tier 2 (WebContainer) and Tier 3 (Firecracker
microVM). This file records what actually **shipped**, and where and why it diverges — so nobody
reads the plan and assumes it describes the repository.

**Shipped:** 13 stages → 17 modules → **84 lessons**, every one of them Tier 1.

Run `pnpm --filter @khiye/content-sdk content test content/courses/internet-programming` to check
all of it; that command is the source of truth for the numbers below.

---

## 1. The shape

| Stage | Module | Lessons | Runtime |
|---:|---|---:|---|
| 1 · HTML + CSS | HTML: Shop.mn-ийн араг яс | 6 | static |
| | CSS: Shop.mn-ийг үзэсгэлэнтэй болгох | 6 | static |
| | Responsive: бүх төхөөрөмж дээр | 4 | static |
| 2 · JavaScript | JavaScript: Shop.mn-ийг амьд болгох | 5 | static |
| | Хайлт, эрэмбэ ба хадгалалт | 6 | static |
| 3 · React | React: component-оор бүтээх | 6 | static |
| | React: форм, effect ба custom hook | 6 | static |
| 4 · Router | Олон хуудас: өөрийн router | 4 | static |
| 5 · API | API: сервертэй ярих | 4 | static |
| 6 · SQL | SQL: Shop.mn-ий өгөгдлийн сан | 6 | **sqlite** |
| 7 · Сервер тал | Сервер: Request → Response | 5 | static |
| 8 · Нэвтрэлт | Нэвтрэлт ба эрх | 5 | static |
| 9 · Deploy | Deploy: production-д гаргах | 5 | static |
| 10 · Тест | Тест бичих | 4 | static |
| 11 · Хүртээмж | Хүртээмж (accessibility) | 5 | static |
| 12 · TypeScript | TypeScript | 4 | static |
| 13 · Төгсгөлийн төсөл | Төгсгөлийн төсөл: админ самбар | 3 | static |

---

## 2. Why everything is Tier 1

Tier 2 and Tier 3 need a container runtime. Docker never came up on the development machine this
was built on — `docker ps` itself hangs — so nothing that depends on a server sandbox could be
built, let alone tested. Rather than ship lessons that cannot run, each server-side topic was
re-grounded on something that genuinely executes in the browser **and** in happy-dom, so the same
check grades both.

| Topic | Plan | Built | Is it real? |
|---|---|---|---|
| SQL | Postgres / PGlite in Tier 3 | **SQLite** (sql.js asm build), inlined into the preview | Real SQLite. The asm build is plain JS, so it runs under the preview CSP (which forbids `eval`) and in happy-dom unchanged. Verified in a browser before the module was written. |
| Server | Node + Express in Tier 3 | `handleRequest(Request) → Response` | The Web-standard handler signature Cloudflare Workers, Deno Deploy, Bun and Next.js route handlers all share. happy-dom implements `Request`/`Response`/`Headers`/`URL` fully. The one concession is the closing `window.handleRequest = …`, which the file itself explains. |
| Auth | argon2 + Postgres sessions | PBKDF2-SHA256 via `crypto.subtle`, in-memory sessions | Real Web Crypto. The hashing helpers are *given*, the way a team takes them from a library; the student writes the auth flow. |
| API client | fetch against the student's own server | fetch against a mock in `src/api.js` | The student writes exactly the code they would write against a real backend. The mock is what gets swapped out later, not their component. |
| TypeScript | `tsc` in the build step | `ts.typecheck` runs the **real compiler** in Node | No approximation. Node-only, registered from `./server`, so the browser bundle never pulls it in. |
| Deploy | deploy to a host | config, health check, security headers, error boundary, deploy files | We cannot start a host, and the module does not pretend to. It covers what must be true *before* a deploy is safe, all of it executed and graded. |

Two topics from the plan are **not** built and are not faked: running a real Postgres, and an
actual deploy to a host. Both need infrastructure this machine does not have. Everything needed on
the platform side for them (the DB schema, `awardTaskCompletion`, the auth policy) exists and is
tested; it is wiring and a sandbox that are missing.

## 3. Modules the plan did not have

Added because the arc had holes a professional course cannot leave:

- **Тест бичих (10).** The platform had been grading students with tests since lesson one, and
  never taught them to write one. Graded by **mutation**: a suite passes only if it passes on the
  correct implementation and fails on every deliberately broken one — the honest way to answer
  "is this test any good?".
- **Хүртээмж (11).** The student inherits a Shop.mn page with ordinary accessibility bugs and fixes
  them, which is how this work actually happens.
- **TypeScript (12).** Types are mutation-tested too: `ts.rejects` appends a deliberately wrong
  usage and requires the compiler to refuse it, because `type X = any` passes every type check
  while proving nothing.
- **Төгсгөлийн төсөл (13).** Sixteen modules of guided lessons had no ending. The capstone
  introduces no new concept on purpose: the statements read as specs, the hints are conceptual,
  and the work is assembling what the course already taught into an admin panel.

## 4. What the content pipeline guarantees

`khiye content test` fails CI unless all four hold, for every task:

1. the reference solution passes its own checks;
2. the **starter fails** at least one — a task you cannot fail teaches nothing;
3. the starter **renders without crashing** — failing checks is the point, a blank preview is not;
4. the solution **runs without console errors**.

Plus `khiye content lint`, which reads the workspace as the student receives it and rejects a task
whose `targetFile` is missing, whose editor marker is not in that file, whose solution patches a
file the workspace never created, whose skill is not in `skills.json`, or whose prerequisite lives
in a later stage. Checks that *throw* are reported too: an infra error is never the student's
fault, but at authoring time it means the check judges nothing.

Each of these gates was added after it caught a real bug. They are listed in the commit log with
what they found.
