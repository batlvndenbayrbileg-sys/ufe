# 13 — Security, Privacy & Compliance

---

## 13.1 Threat model

| # | Actor | Goal | Impact | Primary control |
|---|---|---|---|---|
| T1 | Curious student | Escape the sandbox, read host files, reach the internal network | Critical | Firecracker microVM + deny-all egress ([12](12-code-execution.md) §12.5) |
| T2 | Student | Fake task completion / certificate | High (product credibility) | Server-side authoritative validation ([05](05-validation-engine.md) §5.6) |
| T3 | Student | Extract solutions for locked tasks | Medium | Solutions never sent to the client until unlocked; AI policy engine ([06](06-ai-tutor.md) §6.4) |
| T4 | Student | XSS into the platform via preview code | Critical | Opaque-origin iframe on a separate registrable domain |
| T5 | Attacker | Steal sessions / accounts | Critical | httpOnly+Secure+SameSite cookies, argon2id, rate limits, DB sessions with instant revoke |
| T6 | Attacker | Abuse compute (mining) via free accounts | High (cost) | Free tier has no server execution; quotas; miner detection |
| T7 | Attacker | Scrape all course content | Medium (IP) | Content behind auth for paid stages, per-account rate limits, watermarked solutions |
| T8 | Teacher/Admin | Over-reach into student data | Medium (privacy/legal) | Cohort-scoped authz + audit log on every read of a student's code |
| T9 | Prompt injection via student code | Leak solutions / misuse AI | Medium | Delimited untrusted blocks + deterministic post-filter |
| T10 | Insider | Exfiltrate the user database | Critical | Least privilege, no prod DB access from laptops, audited break-glass, encrypted backups |
| T11 | Supply chain | Malicious npm dep in our app or in a student dependency snapshot | High | Lockfiles, pinned deps, Dependabot + review, pre-resolved student dependency snapshots built in CI |
| T12 | Attacker | Abuse public share pages to host phishing | Medium | Share pages are sandboxed, labelled, scanned, and takedown-able |

---

## 13.2 Authentication

- Passwords: **argon2id** (m=19 MiB, t=2, p=1), minimum 8 characters with a breached-password check
  (k-anonymity range query against HIBP), no forced rotation, no composition rules beyond length.
- Sessions: opaque 256-bit token in an `httpOnly; Secure; SameSite=Lax; Path=/` cookie, stored
  server-side, 30-day rolling expiry, revocable individually and in bulk.
- OAuth: Google (all users), GitHub (linked later, for the deployment lessons; requests only
  `public_repo` scope, and only at the moment the student chooses to push).
- MFA (TOTP) required for **ADMIN** and **AUTHOR** roles at launch; optional for everyone else.
- Email verification required before Tier-3 sandbox access (blunts throwaway-account compute abuse).
- Password reset tokens: single-use, 30 min, hashed at rest, invalidate all sessions on use.
- Impersonation (admin support): time-boxed 15 min, requires a reason string, writes `AuditLog`,
  shows a permanent banner in the impersonated UI, and is blocked for other ADMIN accounts.

## 13.3 Authorization

Role-based with resource ownership checks, enforced in a **single policy module** (`packages/shared/authz`),
never scattered in route handlers.

```ts
can(user, "task:submit",  { taskId })      // enrolled + prerequisite passed + plan allows tier
can(user, "solution:read",{ taskId })      // gate conditions met
can(user, "student:read", { userId })      // self OR teacher-of-a-cohort-containing-user OR admin
can(user, "content:write",{ lessonId })    // AUTHOR/ADMIN
can(user, "sandbox:start",{ tier })        // plan + quota
```

Rules:
- Every handler calls `can()` **before** touching data; a lint rule fails the build on handlers that
  read user-scoped models without an authz call.
- **404, not 403**, when revealing existence is itself a leak (another student's order, snapshot,
  workspace). We also teach this to students in M10.
- Teacher reads of student code write an audit row and are visible to the student in
  *"Миний өгөгдөлд хэн хандсан бэ"* (Settings → Privacy). This is unusual and deliberate — it keeps
  institutional trust.

## 13.4 Application security baseline

| Control | Implementation |
|---|---|
| CSRF | Double-submit token on all mutating requests + `SameSite=Lax` |
| XSS | React escaping; **no `dangerouslySetInnerHTML`** except for author MDX, which is compiled at build time from trusted content and sanitised (rehype-sanitize) |
| CSP (app) | `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; frame-src https://*.preview.khiye.dev; connect-src 'self' https://api.anthropic.com` (server-side only) — no inline scripts, nonce-based where unavoidable |
| Clickjacking | `X-Frame-Options: DENY` on app pages; preview frames are the only embedded content |
| SQL injection | Prisma parameterised queries; `$queryRaw` only with tagged templates; a lint rule forbids string concatenation into `$queryRawUnsafe` |
| SSRF | The only server-side fetch of a user-supplied URL is `deploy.live` verification: it resolves DNS first, rejects private/link-local ranges, disallows redirects to them, times out at 5 s |
| Mass assignment | Zod schemas per endpoint; never `...body` into Prisma |
| Rate limiting | Sliding window in Redis per IP+user per route class; stricter on auth, submit, AI, sandbox |
| Secrets | Never in the repo; per-environment secret store; rotation runbook; a pre-commit secret scanner |
| Dependencies | Lockfile-only installs, Dependabot, weekly `npm audit` triage, no `postinstall` scripts allowed in the student dependency snapshots |
| File uploads | Only avatars and (admin) lesson assets: type sniffing, size cap, re-encode images, served from R2 on a separate domain |
| Headers | HSTS (1 y, preload), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geo |

## 13.5 Origin separation (the most important structural control)

```
khiye.mn               → app, session cookie lives here
cdn.khiye.mn           → static assets, no cookies
preview.khiye.dev      → student code renders here.  DIFFERENT REGISTRABLE DOMAIN.
<sid>.preview.khiye.dev→ tier-3 dev servers
runner.khiye.dev       → internal only, mTLS/service token
```

A separate registrable domain (`.dev`, not a subdomain of `khiye.mn`) means student code cannot:
set cookies readable by the app, exploit a `document.domain`-style relaxation, or benefit from any
same-site cookie behaviour. This costs one domain registration and removes an entire class of
critical bugs.

## 13.6 Untrusted code containment

Fully specified in [12](12-code-execution.md). Summary of the guarantees we commit to:

1. Student code never executes in the platform's origin.
2. Student code never executes on the host kernel (microVM boundary).
3. Student code has **zero** internet egress by default.
4. Student code cannot reach another student's sandbox, the platform DB, or cloud metadata.
5. Resource exhaustion is bounded and always kills only that student's VM.
6. Grading for checkpoints runs in a fresh VM seeded only from the submitted files.

These are verified by an **escape-attempt test suite** in CI (`infra/security/escape-tests/`) that
runs ~30 hostile programs (network scan, metadata fetch, fork bomb, `/proc` snooping, setuid hunt,
mount attempts, DNS exfiltration, `COPY FROM PROGRAM`) and asserts each is contained.

## 13.7 AI-specific security

- Student code and student messages are wrapped in a labelled untrusted block; the system prompt
  states that its contents are data.
- **Defence does not rely on the prompt.** The deterministic post-filter ([06](06-ai-tutor.md) §6.4)
  is what actually prevents solution leakage, and it works regardless of what the model was persuaded
  to do.
- Reference solutions for locked tasks are never placed in the model context.
- No tool/function is exposed to the tutor that can read arbitrary database rows.
- AI conversations are stored (teachers and support need them) and are excluded from any
  model-training use by contract; this is stated plainly in the privacy notice.

## 13.8 Privacy & data protection

**Applicable law:** Mongolia's *Law on Personal Data Protection* (2021, in force 2022) — consent,
purpose limitation, data-subject access/correction/deletion, breach notification, and restrictions on
cross-border transfer. Because we host in Tokyo, cross-border transfer is deliberate and must be
disclosed and consented to at signup. We additionally align with GDPR practices for diaspora users.

| Data | Purpose | Retention |
|---|---|---|
| Account (email, name, username) | Identity | Life of account + 30 days |
| Progress, attempts, XP | Core service, certificates | Life of account (certificates are permanent records) |
| **Code snapshots** | Feedback, teacher review, replay | Submit snapshots: life of account. Intermediate autosaves: **90 days** |
| AI conversations | Support, quality, teacher review | 12 months |
| Analytics events | Product improvement | 24 months, then aggregated |
| Payment records | Legal/accounting | 7 years (Mongolian accounting law) |
| Server logs | Ops/security | 30 days (90 for security events) |
| Sandbox contents | Ephemeral | Destroyed on session end |

Rights implementation:
- **Access/export:** `/app/settings/privacy` → self-service ZIP (profile, progress, all code, AI
  transcripts) generated by a worker, delivered as a signed URL, within minutes.
- **Deletion:** self-service. Hard-deletes user rows via cascade; anonymises analytics
  (`userId → NULL`, keeps counts); retains payment records as legally required, with a clear notice.
  Certificates are revoked/anonymised on request.
- **Minors:** students under 18 exist (Persona C). We collect a birth year, require guardian consent
  for under-16 accounts, disable public profiles by default for minors, and never show their full
  name publicly.
- **Data minimisation:** no phone number unless SMS is enabled; no address; no ID documents; no
  camera/mic access anywhere in the product.

## 13.9 Operational security

- Least-privilege IAM; no human has standing production DB write access. Break-glass access requires
  a second approver and writes an audit record.
- Backups: Postgres PITR (7 days) + nightly logical dump to R2, encrypted, **restore tested monthly**
  (an untested backup is not a backup).
- Encryption: TLS 1.3 everywhere, HSTS preload; at rest via provider-managed encryption; secrets
  encrypted with a KMS key.
- Runner nodes: no inbound SSH from the internet (bastion/Tailscale only), automatic security
  updates, hardened kernel config, immutable VM images rebuilt weekly.
- Incident response: severity ladder, on-call rotation, 72-hour breach-notification runbook aligned
  to the Mongolian PDP law, a public status page, and post-incident reviews published internally.
- Pen test before the first B2B institutional contract; annually thereafter.
- `security.txt` and a simple vulnerability-disclosure policy — our users are exactly the people who
  will find bugs, and we want them reporting rather than posting.

## 13.10 Content & IP protection

- Free-tier content is public; paid stages require auth and are rate-limited per account.
- Solutions are served only after the gate conditions and carry an invisible per-account watermark
  (whitespace/identifier fingerprint) so a leaked solution dump can be traced.
- Student code belongs to the student. Terms grant us only the licence needed to operate the service
  (store, execute, display to their teacher, and — only with explicit opt-in — feature publicly).
- We do not claim ownership of capstone projects.

## 13.11 Security acceptance criteria

1. Escape-test suite: 100% contained, run in CI on every runner image build.
2. No endpoint reads a user-scoped model without an `authz.can()` call (enforced by lint + a review
   checklist).
3. OWASP Top 10 review completed and documented before public launch.
4. Password reset, session revocation, and impersonation each covered by integration tests.
5. Data export and deletion both complete end-to-end in staging within 10 minutes.
6. Backup restore drill passes monthly.
7. No third-party script on the app origin can read student source code (verified by CSP report-only
   in staging, then enforced).

---

*Next: [14 — Design System](14-design-system.md)*
