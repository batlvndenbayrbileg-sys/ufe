# 12 — Code Execution Architecture (running untrusted student code)

> **Threat statement:** every byte a student writes is untrusted code that we will execute.
> Some of it will be malicious — a security-curious 19-year-old *will* try `require('child_process')`,
> a fork bomb, an outbound port scan, and reading `/etc/passwd`. The architecture must make all of
> those boring and harmless, not detected-and-punished.

---

## 12.1 The three tiers

| Tier | Runs in | Used for | Latency | Marginal cost |
|---|---|---|---|---|
| **1** | The student's **browser**, sandboxed iframe | HTML, CSS, vanilla JS, DOM — Stages 0–2 (**~62% of tasks**) | 5–150 ms | ~0 |
| **2** | The student's **browser**, WebContainer (WASM Node) | Vite + React, Vitest, npm scripts — Stage 3 (**~18% of tasks**) | 1–4 s | ~0 (licence aside) |
| **3** | **Server** microVM | Next.js server, Node API, Postgres, Prisma, git, deploy — Stages 4–9 (**~20% of tasks**) | 2–8 s | CPU-seconds |

Plus a special case:

| **PGlite** | The student's **browser**, WASM Postgres | SQL lessons M9-l1..l7 | ~200 ms | ~0 |

This split is the single most important cost and UX decision in the platform. It is why the loop is
fast and why the margin is ~88%.

---

## 12.2 Tier 1 — browser iframe

### Isolation
```html
<iframe
  src="https://preview.khiye.dev/host?sid=…"     <!-- SEPARATE ORIGIN, not a subdomain of khiye.mn -->
  sandbox="allow-scripts allow-forms allow-modals allow-popups"
  referrerpolicy="no-referrer"
  allow=""                                        <!-- no camera/mic/geo/payment -->
  csp="default-src 'none'; img-src https://cdn.khiye.mn data:; style-src 'unsafe-inline';
       script-src 'unsafe-inline' blob:; connect-src 'none'; font-src https://cdn.khiye.mn"
></iframe>
```

Key points:
- **No `allow-same-origin`.** The iframe is opaque-origin, so student JS cannot touch our cookies,
  localStorage, or DOM. Communication is `postMessage` only.
- **Separate registrable domain** (`preview.khiye.dev`, not `*.khiye.mn`) so even a cookie or
  same-site bug cannot reach the platform session. Cost: one extra domain. Worth it.
- **`connect-src 'none'`** until the fetch lessons; then it is widened to the lesson's declared
  allowlist only (`self` + the lesson's mock API).
- Popups/downloads from the preview are blocked; `window.open` is stubbed by the harness.

### What can still go wrong, and the answer
| Attack | Result |
|---|---|
| `while(true){}` | The iframe's own main thread hangs, not ours. A watchdog in the host detects no heartbeat for 3 s → kills and recreates the iframe → shows *"Таны код хязгааргүй давталтад орсон байна. `for` давталтын нөхцөлөө шалгаарай."* |
| Memory bomb | Browser tab may OOM. Harness monitors `performance.memory` where available and warns at 60%; the iframe is recycled every 200 reloads. |
| `alert()` spam | `allow-modals` is granted (students need `alert` in lesson m4-l1) but the harness throttles to 3 per run and then stubs it. |
| Phishing page inside the preview | Preview origin has no credentials and is visually framed as a preview; the public share view (`/u/:username/...`) carries a persistent "Оюутны бүтээл" ribbon. |
| Crypto-mining in a shared preview link | Public share pages run with `script-src 'none'` unless the owner is on a paid plan and the build passed a static scan; CPU watchdog kills long-running scripts. |

### The harness (`packages/preview/harness`)

Injected as the first script in every preview. Responsibilities:
1. Console bridge (`log/warn/error/table/dir` → `postMessage` to the host, with structured cloning
   and depth limits).
2. `window.onerror` / `unhandledrejection` capture with source mapping back to the student's file.
3. Heartbeat every 500 ms (the infinite-loop watchdog).
4. **Checker runtime**: the host posts `{ type: "runChecks", checks }`; the harness executes
   `packages/checkers` against the live document and posts results back. Because the checks run in
   the same document that the student sees, `getComputedStyle` and interaction checks are truthful.
5. State preservation across reloads (scroll, sessionStorage, focus).
6. Network shim from Stage 5 that logs fetches into the preview's Network panel.

**Trust boundary:** harness results are advisory. The host never grants completion from them
([05](05-validation-engine.md) §5.6).

---

## 12.3 Tier 2 — WebContainers

- Boots a WASM Node runtime in the browser; a real filesystem, real `npm run dev`, real Vite HMR.
- **Zero server cost, full isolation** (it is just the browser sandbox again).
- `node_modules` is never installed from npm live: each stage ships a pinned, pre-resolved dependency
  snapshot as a compressed blob served from the CDN and cached in the browser Cache API.
- Requires cross-origin isolation (`COOP: same-origin`, `COEP: require-corp`) on the page hosting it,
  which constrains third-party embeds — accounted for in the app's header policy.
- **Constraints:** memory-hungry (≈ 400–700 MB), unsupported/unreliable on some mobile browsers and
  older Safari. Detection at lesson open → transparent Tier-3 fallback.
- **Licence:** StackBlitz WebContainer API requires a commercial licence for commercial use. Two paths:
  (a) licence it and enjoy near-zero marginal cost for Stage 3; (b) run Stage 3 on Tier 3 and accept
  higher runner cost. Decide at P2 with real numbers ([16](16-roadmap.md) §16.4).

---

## 12.4 PGlite — SQL without a server

`@electric-sql/pglite` is a real Postgres compiled to WASM (~3 MB). For M9-l1..l7:

- Instant `CREATE TABLE` / `INSERT` / `SELECT` with authentic Postgres error messages
  (which we translate to Mongolian).
- Seed data is loaded from a fixture; each task starts from a deterministic snapshot.
- `sql.resultEquals` runs both the student query and the reference query in the same instance and
  compares result sets (order-insensitive unless the task tests `ORDER BY`).
- Students hit a real `duplicate key value violates unique constraint` — the pedagogical value of
  authentic errors is enormous, and we pay nothing for it.

From M9-l8 (schema design with Prisma migrations) the lessons move to Tier 3 with a real server
Postgres, because migrations, transactions across a network, and connection pooling are the point.

---

## 12.5 Tier 3 — server sandbox

### Isolation model

```
Runner host (bare metal / dedicated VM, KVM enabled)
 └── Firecracker microVM   ← the hard boundary
      • kernel: minimal, custom config, no modules
      • rootfs: read-only squashfs (node 22 + pnpm + postgres client + git)
      • /workspace: writable overlay (tmpfs or thin block device), 256 MB
      • /tmp: tmpfs 64 MB, noexec, nosuid
      • user: uid 10001, non-root, no sudo, no setuid binaries in the image
      • network: TAP device on a per-VM /30, default DENY
            allow → the runner's file-sync/pty agent
            allow → the lesson's declared endpoints only (e.g. its own :3000, its own :5432)
            deny  → all egress, metadata endpoints (169.254.169.254), private ranges, DNS
      • seccomp: Firecracker's default + our jailer profile
      • jailer: cgroup v2 + namespaces + chroot
```

Why Firecracker: hardware-virtualised boundary (a container escape via a kernel bug does not reach
the host), ~125 ms boot, ~5 MB overhead per VM, purpose-built for exactly this.
**Fallback if Firecracker is impractical on the chosen host:** gVisor (`runsc`) containers, which
give a user-space kernel and a much better boundary than plain Docker. **Plain Docker with default
settings is not acceptable** — shared kernel, and one CVE from a host compromise.

### Resource limits (per VM)

| Limit | Value | Enforced by |
|---|---|---|
| vCPU | 1 (cpu.max 50% sustained, 100% burst 10 s) | cgroup v2 |
| Memory | 512 MB (Tier-3 lesson), 1 GB (Postgres lesson) | Firecracker + cgroup, OOM kills the VM only |
| Disk | 256 MB writable | overlay quota |
| Processes | 128 | pids.max |
| Open files | 1024 | rlimit |
| Wall clock (dev server) | 30 min idle timeout, 4 h hard | runner supervisor |
| Wall clock (one exec) | 30 s | supervisor kill |
| CPU seconds per validation run | 20 s | cgroup + kill |
| Network egress | 0 bytes to the internet | TAP firewall |
| Concurrent VMs per user | 1 (Learner), 2 (Institution) | runner accounting |
| Sandbox minutes / month | 600 Learner, 1,500 Institution | quota, soft-warned at 80% |

Anything killed by a limit produces a **teaching message**, not a stack trace:

> ⏱ **Кодыг ажиллуулах хугацаа дууслаа (20 секунд).**
> Ихэвчлэн энэ нь хязгааргүй давталтаас болдог. `while` эсвэл `for` давталтын зогсох нөхцөлөө шалгаарай.

### Lifecycle

```
lesson open (tier 3)
   │  POST /api/sandbox/start
   ▼
runner: claim a WARM VM from the pool (target: ≥ 5 warm per node)
   │      (cold path: boot in ~1.5 s + service start ~1.5 s)
   ├─ mount workspace files (sent as a patch set, not a tarball, when resuming)
   ├─ start postgres (if declared) + `pnpm dev`
   ├─ wait for the port to answer, then register the proxy route
   └─ return { sessionId, previewUrl: https://<sid>.preview.khiye.dev }

during the lesson
   ├─ file sync: editor patches stream over WS, applied atomically
   ├─ HMR/dev-server output streams back as log events
   ├─ terminal: pty over WS with the restricted shell
   └─ idle detector: no file change + no HTTP for 15 min → suspend (snapshot + free the VM)

submit (tier 3)
   ├─ runner runs the checks in the SAME VM (fast) unless the task declares `isolatedGrading: true`
   │  (checkpoints and anything security-sensitive get a FRESH VM seeded only with the student's
   │   files, so a student cannot pre-poison the runtime to make checks pass)
   └─ results → web app → transaction

close / logout / 4 h
   └─ destroy VM, wipe the overlay; workspace already persisted in Postgres/R2
```

### Preview proxying

`https://<sessionId>.preview.khiye.dev` → runner edge → VM:3000.
- Session id is a 128-bit unguessable token, bound to the owner's session cookie for private
  previews; public share links are a separate, explicitly created capability.
- The proxy strips hop-by-hop headers, sets `X-Frame-Options: ALLOWALL` only for our own workspace
  origin, forces `Content-Security-Policy` for public shares, and rate-limits per session.
- WebSocket upgrade is proxied for HMR.

### Postgres per student

- One Postgres process **inside the student's own VM** (not a shared cluster). Cost is a few hundred
  MB of RAM for the ~20% of time it is needed, and the isolation problem disappears entirely:
  the student is `postgres` superuser inside their own VM and it does not matter.
- Rejected alternative: shared cluster with a schema per student. Cheaper, but then `DROP DATABASE`,
  `pg_read_file`, `COPY … FROM PROGRAM`, and connection exhaustion all become real risks, and
  students cannot be superuser — which breaks half the lessons.

---

## 12.6 Restricted shell

The terminal runs `khiye-shell`, a wrapper that:
- Accepts an allowlist: `node, npm/pnpm (install|run|ci from the lockfile only), npx prisma …,
  git (local + our proxy remote), psql, ls, cd, cat, mkdir, mv, cp, rm (within /workspace),
  echo, clear, curl (localhost only)`.
- Rejects everything else with a Mongolian message + a suggestion.
- Logs every command (teacher visibility + abuse detection).
- Is **not** a security boundary (a student can always run arbitrary code via `node -e`). The VM is
  the boundary. The shell allowlist is UX and telemetry.

---

## 12.7 Validation execution

| Runtime | Where checks run |
|---|---|
| static | preview iframe (client) + happy-dom in a Node worker (server, authoritative) |
| vite-react | WebContainer vitest (client) + Node vitest in a worker or VM (server) |
| pglite | browser PGlite (client) + a scratch Postgres in a worker VM (server) |
| next / node / postgres | inside the student's VM, or a fresh isolated VM for checkpoints |

Server-side Tier-1 re-verification runs in a **Node worker pool** with `happy-dom`, 250 ms timeout,
no network, `vm` module isolation for any student JS that must execute. For anything that needs to
actually execute student JavaScript with side effects, the worker delegates to a short-lived VM
rather than running it in-process — Node's `vm` module is **not** a security boundary and must never
be treated as one.

---

## 12.8 Capacity planning

Assumptions: 1,000 active students, peak concurrency 12% (evenings 20:00–23:00 ULAT), 20% of active
sessions are Tier 3 → **~24 concurrent VMs at peak**, with headroom to 60.

- 1 VM ≈ 0.5 vCPU sustained, 512 MB–1 GB.
- A 16 vCPU / 64 GB node holds ~40 VMs comfortably (memory-bound).
- **2 nodes + 1 spare = 3 nodes** at 1,000 students. Linear from there; autoscale on
  `warm_pool_available < 5`.
- Warm pool: 5 per node, refilled asynchronously; target cold-start exposure < 3% of starts.

---

## 12.9 Abuse handling

| Signal | Response |
|---|---|
| Repeated OOM/CPU kills (> 10/h) | Soft rate-limit sandbox starts for that user; show a help card |
| Outbound connection attempts | Logged, blocked, counted. > 50/h → admin alert (curiosity is fine; scanning is not) |
| Crypto-miner signature (sustained 100% CPU + known pool DNS attempts) | Kill VM, flag account for human review |
| Sandbox-minute quota exhausted | Tier 3 lessons pause with an upgrade/next-month message; Tier 1/2 unaffected |
| Sharing an account (many IPs/devices) | Soft limit of 2 concurrent sessions, then a re-login prompt |

Nothing here auto-bans. Every enforcement action is reversible by an admin and visible in `AuditLog`.

---

## 12.10 Acceptance criteria

1. `while(true){}` in a Tier-1 task shows the Mongolian infinite-loop message within 4 s and leaves
   the platform tab responsive.
2. A Tier-3 VM cannot reach `example.com`, `169.254.169.254`, or another student's VM (proven by an
   automated escape-attempt test suite run in CI).
3. Fork bomb, 2 GB allocation, and `rm -rf /` inside a VM affect only that VM; the host is unaffected.
4. Cold sandbox boot ≤ 4 s p95; warm claim ≤ 800 ms p95.
5. Killing a VM mid-lesson loses no student code (workspace already persisted).
6. Checkpoint grading runs in a fresh VM and cannot be influenced by a pre-poisoned runtime.
7. 40 concurrent VMs on one 16 vCPU node sustain the p95 budgets under a k6 load test.

---

*Next: [13 — Security](13-security.md)*
