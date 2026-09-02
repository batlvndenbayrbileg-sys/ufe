# 08 — Dashboards, Progression & Analytics

---

## 8.1 Student dashboard — `/app`

**Design intent:** a *launcher*, not a report card. 80% of visits should end in one click on
"Үргэлжлүүлэх". Everything else is secondary.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Сайн уу, Ануужин 👋                                     🔥 7 хоног  1,240 XP │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ҮРГЭЛЖЛҮҮЛЭХ                                                          │  │
│  │  Модуль 4 · Хичээл 12                                                  │  │
│  │  Сагсанд бүтээгдэхүүн нэмэх                                            │  │
│  │  ●●●●○○  4/6 даалгавар · ~12 минут үлдсэн                              │  │
│  │                                                    [ Үргэлжлүүлэх → ]  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ИНТЕРНЭТ ПРОГРАММЧЛАЛ                                                       │
│  ████████████░░░░░░░░  58%   ·  82/142 хичээл  ·  Дуусах огноо: 12-р сарын 4 │
│                                                                              │
│  ┌── УР ЧАДВАР ────────────────┐  ┌── ЭНЭ 7 ХОНОГ ──────────────────────┐   │
│  │ HTML          ████████ 100% │  │ Зорилго: 5 цаг     ███████░░ 3ц 40м │   │
│  │ CSS           ████████ 100% │  │ Даалгавар: 23      Дараалал: 7 хоног│   │
│  │ JavaScript    ██████░░  78% │  │ Даваа Мяг Лха Пүр Баа Бям Ням       │   │
│  │ React         ████░░░░  45% │  │  ✓   ✓   ✓   ✓   ✓   ✓   ○          │   │
│  │ Backend       ░░░░░░░░   0% │  └─────────────────────────────────────┘   │
│  └─────────────────────────────┘                                            │
│                                                                              │
│  ┌── МИНИЙ SHOP.MN ───────────────────────────┐  ┌── ТЭМДЭГ (5) ─────────┐  │
│  │  [live preview thumbnail of their build]   │  │ 🏆 ⚡ 🎨 ⚛ 🔌         │  │
│  │  Сүүлд шинэчилсэн: 2 цагийн өмнө           │  │ Дараагийнх: 🗄 (3 х.)  │  │
│  │  [ Харах ]  [ Хуваалцах ]                  │  └───────────────────────┘  │
│  └────────────────────────────────────────────┘                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

Rules:
- **The continue card is the biggest thing on the page**, always above the fold, on every device.
- "Дуусах огноо" is computed from actual velocity (last 14 days), not from the onboarding promise.
  If the student slows down, the date moves — honestly, with a gentle note, never with guilt copy.
- Skill bars link to the module that raises them.
- The project thumbnail is a **real screenshot** of their latest build, regenerated on each milestone
  (headless render job). Seeing their own site is the strongest return trigger we have.

### Empty / edge states
| State | Copy |
|---|---|
| Day 0, nothing started | Continue card becomes "Эхлэх" with the first lesson and a 90-second promise |
| Returning after 7+ days | "Тавтай морил. Хамгийн сүүлд `Сагсны логик` дээр зогссон. Богино давталтаас эхлэх үү?" → a 3-minute recap task |
| Streak broken | No shaming. "Дараалал шинээр эхэллээ." + streak-freeze offer if they have one |
| Course complete | Certificate card, capstone, next-track suggestions |

---

## 8.2 Progression system (XP, levels, streaks, badges, skills)

### XP

| Event | XP |
|---|---|
| Task passed (trivial / normal / hard) | 5 / 10 / 20 |
| Checkpoint task | 40 |
| Lesson completed (all tasks) | +15 bonus |
| Module completed | +100 |
| Stage checkpoint passed | +250 |
| Quiz question correct | 3 |
| First attempt pass (no hints, no solution) | ×1.25 multiplier |
| Hint 2 used | −1 · Hint 3 used | −3 |
| Solution revealed | XP × 0.4, task flagged `assisted` |
| Daily goal met | +20 |
| 7-day streak | +50 (once per streak week) |
| Helping another student (P2 forum, accepted answer) | +25 |

**No XP for time spent, video watched, or logging in.** XP tracks *verified production of working code*
only. This is a credibility decision: XP must mean something to an employer looking at a profile.

### Levels

`level = floor(sqrt(xp / 60)) + 1` → L2 at 60 XP (≈ day 1), L10 at ~5,400 XP (≈ week 7),
L15 ≈ course completion. Level titles are professional, not cute:

```
L1 Эхлэгч · L3 Суралцагч · L5 Кодлогч · L7 Frontend хөгжүүлэгч ·
L10 Full-stack дадлагажигч · L13 Junior developer · L15 Shop.mn бүтээгч
```

### Streaks

- A day counts if the student **passes ≥ 1 task** (not "opens the app").
- **Streak freeze:** 1 earned per 7-day streak, max 3 held. Auto-applied. This exists because
  Mongolian students have exam weeks and Tsagaan Sar; punishing them loses the account.
- **Pause mode:** explicit "Завсарлага" (up to 21 days) freezes the streak with no penalty and
  suppresses reminder emails. Offered proactively during known exam periods for cohort students.

### Badges (25 at launch)

Milestone: 🏆 First Website · ⚡ JavaScript Starter · 🎨 UI Builder · 📱 Responsive Master ·
⚛ React Developer · ▲ Next.js Builder · 🔌 API Builder · 🗄 Database Builder · 🔐 Auth Master ·
🛒 E-commerce Builder · 🧪 Test Writer · 🚀 Full Stack Developer · 🎓 Shop.mn Graduate

Behavioural: 🌅 Эрт босогч (10 tasks before 08:00) · 🌙 Шөнийн шувуу (10 after 23:00) ·
🎯 Алдаагүй (10 consecutive first-attempt passes) · 🔧 Дебаггер (fix 5 tasks after 3+ failures —
**we reward persistence, not only correctness**) · 📚 Бие даасан (10 tasks with zero hints) ·
🤝 Туслагч (5 accepted forum answers) · 🔥 30 хоног · 💯 100 даалгавар · 🏗 Capstone

Rules: no badge for paying, no badge for streak length alone beyond 30, badges are visible on the
public profile with the date earned.

### Skill mastery

```
mastery(skill) = Σ(xp of passed tasks tagged skill × assistWeight) / Σ(xp of all tasks tagged skill)
assistWeight = 1.0 unassisted · 0.4 assisted
```

Displayed as bars + a radar on `/app/progress`. Skills decay is **not** modelled (punitive and
inaccurate); instead, "Давтах" spaced-repetition micro-tasks resurface at 7/30 days for skills
whose recent usage is low.

### What we deliberately do not do

No leaderboards by XP (destroys motivation for the bottom 80%, encourages gaming), no lives/hearts,
no losing progress, no streak-loss guilt, no mascot, no confetti beyond the 3 milestone moments.
Optional **cohort leaderboard** exists only inside a teacher-created cohort, and ranks by
*tasks completed this week*, resetting weekly.

---

## 8.3 Teacher dashboard — `/teach`

Teacher's real job to be done: **"who is stuck, on what, right now — and can I grade this without
reading 60 repos."**

### Cohort heatmap (the flagship screen)

```
                 M1  M2  M3  M4  M5  M6  M7 …
  Ануужин Б.     ██  ██  ██  ██  ▓▓  ░░  ░░      58%   🟢 идэвхтэй
  Батсайхан Д.   ██  ██  ██  ▓▓  ░░  ░░  ░░      41%   🟡 3 хоног идэвхгүй
  Сараа Ч.       ██  ██  ▓▓  ░░  ░░  ░░  ░░      28%   🔴 m3-l4 дээр 5 удаа уналаа
  …
  ────────────────────────────────────────────
  Дундаж         98% 92% 74% 51% 22%  4%  0%
```

- Click a cell → that student's attempts on that lesson, with **code snapshot replay** (a scrubber
  over their edit history — this is how a teacher sees *how* they thought, not just the final answer).
- **At-risk list** with reasons: `>3 days inactive`, `>5 failed attempts on one task`,
  `solution-reveal rate > 40%`, `behind cohort median by > 2 modules`.
- One-click actions: send a message, extend a deadline, unlock a lesson, assign a review call.

### Analytics for teachers
- **Failure hotspots:** tasks where this cohort fails most, compared to the platform baseline
  ("Таны бүлэг `m4-l8`-д дунджаас 2.3 дахин их уналаа") → tells them what to re-teach in class.
- **Common mistakes:** clustered failing patterns per task with representative code excerpts.
- **Time distribution:** median/p90 minutes per lesson vs the estimate.
- **Integrity signals:** similarity clusters, paste bursts, solution-reveal rates. Advisory only,
  never automated punishment; always shows the evidence.

### Gradebook
Weighted score per student = `Σ(task weight × assistWeight)`, configurable per assignment.
Export CSV/XLSX with columns matching Mongolian university grading (A–F, 0–100).
LMS integration (Moodle/Canvas via LTI 1.3) is a Phase 3 item.

---

## 8.4 Admin dashboard — `/admin`

| Panel | Metrics |
|---|---|
| **Growth** | Signups, activation (task #1 in session 1), D1/D7/D30 retention cohorts, MAU/WAU/DAU |
| **Learning** | Tasks completed/day, median attempts/task, drop-off funnel by lesson, course completion rate |
| **Content health** | Tasks with fail rate > 50%, median time > 2× estimate, checks never failing, flaky checks |
| **Infra** | Sandbox concurrency, boot p95, submission latency p50/p95/p99, error rate, queue depth |
| **AI** | Tokens & ₮ per student, FAQ hit rate, policy rejections, flagged conversations |
| **Money** | MRR, ARPU, churn, trial→paid, payment failures by provider (QPay/bank) |
| **Ops** | Impersonate (audited), refunds, role changes, feature flags, content publish/rollback |

### The North Star metric

**Weekly Verified Tasks (WVT)** = number of tasks passed, server-verified, unassisted, per active
student per week. Target: **≥ 18**. It is the only metric that simultaneously measures engagement,
content quality, product speed and actual learning. Everything on the admin dashboard is arranged
around explaining WVT movements.

Supporting guardrail metrics: activation ≥ 70%, D7 ≥ 45%, D30 ≥ 25%, median task time ≤ 12 min,
p95 submit latency ≤ 6 s, tutor cost/student ≤ ₮2,500.

---

## 8.5 Event taxonomy (analytics contract)

All events are emitted server-side where possible; client events carry a session id and are
deduplicated. Stored in Postgres (`AnalyticsEvent`) and mirrored to a warehouse later.

```
auth.registered { method, referrer }
onboarding.completed { goal, hoursPerWeek, entryPoint }
lesson.opened { lessonId, tier, device }
task.started { taskId, attemptNo }
code.edited { taskId, charsDelta, pasteBurst: bool }     // sampled, debounced 10s
preview.ran { taskId, tier, durationMs }
task.submitted { taskId, attemptNo, passed, failedCheckIds[], durationMs, source: "client"|"server" }
task.passed { taskId, attemptNo, assisted, xp, minutesOnTask }
hint.viewed { taskId, level }
solution.revealed { taskId, attemptNo }
tutor.opened { taskId, trigger: "manual"|"proactive" }
tutor.message { taskId, resolvedBy: "faq"|"llm", tokensIn, tokensOut, filtered }
lesson.completed { lessonId, minutes }
module.completed / stage.completed / badge.earned / streak.updated
project.shared { channel } / project.deployed { url }
paywall.viewed / checkout.started / subscription.created { plan, provider }
sandbox.started / sandbox.failed { reason } / sandbox.killed { reason }
```

**Privacy:** no keystroke-level logging in analytics (snapshots serve that purpose and are covered by
the retention policy); no third-party analytics SDK that ships student code off-platform.

---

## 8.6 Notifications

| Channel | Trigger | Rule |
|---|---|---|
| Email | Weekly recap (Sunday 19:00 ULAT) | Always, opt-out |
| Email | Streak at risk (20:00, if 0 tasks today and streak ≥ 3) | Max 1/day, off after 2 ignored |
| Email | Cohort deadline in 24 h | Teacher-cohort students only |
| Push (PWA) | "Үргэлжлүүлэх" reminder at the student's own historical peak hour | Opt-in, max 1/day |
| In-app | Badge earned, module unlocked, teacher message, content update | Non-modal |

All notification copy is in Mongolian, references the *specific* next task, and never uses guilt
("Чи хоцорч байна") — only continuity ("Сагсны логик дээр 2 даалгавар үлдсэн").

---

*Next: [09 — Database Schema](09-database-schema.md)*
