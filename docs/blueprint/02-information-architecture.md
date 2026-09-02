# 02 — Information Architecture & Screen Inventory

---

## 2.1 Top-level structure

```
khiye.mn
│
├── PUBLIC
│   ├── /                       Landing (live editable hero)
│   ├── /course                 Curriculum overview (all 9 stages, public)
│   ├── /course/[slug]          Public syllabus of one module
│   ├── /pricing
│   ├── /u/[username]           Public student profile + shipped projects
│   ├── /u/[username]/shop-mn   Public preview of a student's build  ← the viral surface
│   ├── /verify/[certId]        Certificate verification
│   └── /auth/*                 login / register / forgot / callback
│
├── STUDENT  (role: STUDENT)
│   ├── /app                    Dashboard ("Өнөөдөр")
│   ├── /app/course/[courseId]  Course map (stage → module → lesson tree)
│   ├── /learn/[lessonId]       ★ THE LEARNING WORKSPACE (the product)
│   ├── /app/project            My Shop.mn — file browser, preview, deploy, share
│   ├── /app/progress           Skills, XP history, badges, streak calendar
│   ├── /app/playground         Free sandbox (no task, no validation)
│   ├── /app/notes              Auto-collected concept cards + personal notes
│   └── /app/settings           Profile, language, editor prefs, billing, GitHub link
│
├── TEACHER  (role: TEACHER)
│   ├── /teach                  Cohort overview
│   ├── /teach/cohort/[id]      Roster, progress heatmap, at-risk list
│   ├── /teach/cohort/[id]/student/[uid]   Individual: attempts, snapshots, replay
│   ├── /teach/assignments      Assign modules/lessons with deadlines
│   ├── /teach/analytics        Failure hotspots, time-per-task, common mistakes
│   └── /teach/gradebook        Export CSV / Excel
│
├── AUTHOR  (role: AUTHOR — content editor; may be same person as TEACHER)
│   ├── /author                 Content dashboard
│   ├── /author/course/[id]     Module & lesson tree editor (drag to reorder)
│   ├── /author/lesson/[id]     ★ LESSON AUTHORING STUDIO (split: form | live student preview)
│   ├── /author/lesson/[id]/tests   Checker builder + test-runner against reference solution
│   ├── /author/review          Pending content changes (PR-like diff review)
│   └── /author/health          Content health: tasks with >50% fail rate, flaky checks
│
└── ADMIN  (role: ADMIN)
    ├── /admin                  Platform KPIs
    ├── /admin/users            Search, impersonate, role, ban
    ├── /admin/billing          Subscriptions, invoices, refunds
    ├── /admin/sandboxes        Live sandbox sessions, kill, quotas
    ├── /admin/ai               Tutor usage, cost/student, flagged conversations
    ├── /admin/content          Publish/rollback content versions
    └── /admin/flags            Feature flags, A/B experiments
```

---

## 2.2 The learning workspace — `/learn/[lessonId]` (the one screen that matters)

### Desktop ≥ 1280px — three panes, resizable, persisted per user

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ ← Модуль 4  ·  Хичээл 12: Сагсны логик        ●●●●○○  4/6      🔥 7   1,240 XP    👤  │  56px
├──────────────────────┬──────────────────────────────────────┬─────────────────────────┤
│ ЗААВАР               │  cart.js  ×   ProductCard.jsx  ×  +  │  [📱][📲][🖥]  ⟳  ⧉    │
│ ──────────────────── │ ──────────────────────────────────── │ ─────────────────────── │
│ Даалгавар 4          │  1  export function addToCart(...)   │                         │
│                      │  2    // энд бич                     │      ┌───────────┐      │
│ Сагсанд бүтээгдэхүүн │  3  }                                │      │  Shop.mn  │      │
│ нэмэх функц бич.     │  4                                   │      │  [сагс 2] │      │
│                      │                                      │      │           │      │
│ ✓ Юу сурах вэ        │                                      │      │  [карт]   │      │
│ ✓ Яагаад             │                                      │      └───────────┘      │
│ ▸ Жишээ              │                                      │                         │
│ ▸ Заавар (3)         │                                      │                         │
│                      │                                      │                         │
│ ┌──────────────────┐ │                                      │                         │
│ │ 🤖 AI Туслах     │ │                                      │                         │
│ └──────────────────┘ │                                      ├─────────────────────────┤
│                      │                                      │ Console ▾  Terminal     │
│                      │                                      │ > cart: [1]             │
├──────────────────────┴──────────────────────────────────────┴─────────────────────────┤
│  ◀ Өмнөх            [ ▶ Ажиллуулах ]        [ ✓ Шалгах ]            Дараагийнх ▶      │  64px
└───────────────────────────────────────────────────────────────────────────────────────┘
   320–420px                    flexible                            360–560px
```

Pane rules:
- Instructions pane collapsible to a 48px rail (icon + task number).
- Preview pane can be **popped out** (⧉) into a second browser window — critical for dual-monitor students.
- Console/Terminal drawer is inside the preview column, 0/180/full height, `Ctrl+\``.
- The bottom action bar is **always visible and never scrolls away**. `Шалгах` is the primary
  colour; `Ажиллуулах` is secondary. On Tier-1 lessons `Ажиллуулах` is hidden (auto-preview).

### Laptop 1024–1279px
Preview collapses to a toggle: instructions + editor by default, `Ctrl+P` slides preview over the
editor as an overlay pane (60% width). Or tabs: `[Заавар][Код][Preview]` if the user prefers.

### Tablet 768–1023px — two panes + tab bar
```
┌───────────────────────────────┐
│ ← Хичээл 12          4/6  🔥7 │
├───────────────┬───────────────┤
│ ЗААВАР        │  КОД          │
│               │               │
│               │               │
├───────────────┴───────────────┤
│ [Заавар] [Код] [Preview] [AI] │
├───────────────────────────────┤
│  [ ▶ Ажиллуулах ] [ ✓ Шалгах ]│
└───────────────────────────────┘
```

### Mobile ≤ 767px — the "stacked with sticky preview" model

**Not** three squeezed panes and **not** three separate tabs. The failure mode of mobile coding is
losing sight of the result while typing. Solution:

```
┌───────────────────────┐        ┌───────────────────────┐
│ ← Хичээл 12    4/6  ⋮ │        │ ← Хичээл 12    4/6  ⋮ │
├───────────────────────┤        ├───────────────────────┤
│ ▼ ЗААВАР              │        │ PREVIEW (sticky, 38%) │
│ Сагсанд нэмэх функц   │        │   ┌───────────┐       │
│ бич.                  │        │   │  Shop.mn  │       │
│ [Заавар] [AI]         │  ───▶  │   └───────────┘       │
├───────────────────────┤ typing ├───────────────────────┤
│ КОД                   │ starts │ КОД  (keyboard open)  │
│ 1 export function...  │        │ 1 export function...  │
│ 2   |                 │        │ 2   |                 │
├───────────────────────┤        ├───────────────────────┤
│ PREVIEW               │        │ [Tab][{}][=>][ ' ][" ]│ ← code key strip
├───────────────────────┤        ├───────────────────────┤
│ [▶ Ажиллуулах][✓Шалгах]│        │        [✓ Шалгах]     │
└───────────────────────┘        └───────────────────────┘
   idle: full scroll               editing: preview pins to top
```

Mobile-specific requirements (all mandatory, see [07](07-editor-and-preview.md) §7.6):
- **Code key strip** above the keyboard: `Tab ⇥ { } ( ) < > / = ; " ' → _ $` and undo/redo.
- Preview **pins to the top** the moment the editor receives focus, so the student sees the effect
  of the line they are typing.
- Font size ≥ 14px, line height 1.6, no horizontal scroll — soft wrap on with an indent guide.
- Tasks flagged `mobileFriendly: false` (e.g. multi-file Next.js refactors) show a banner:
  *"Энэ даалгаврыг компьютер дээр хийвэл хялбар. Одоо үзэх үү?"* with a "Сануулах" (remind me) option
  that queues it for the next desktop session.

---

## 2.3 Navigation model

Three levels of "where am I", always answerable in ≤ 1 glance:

1. **Course map** (`/app/course/[id]`) — vertical stage spine, modules as nodes, lessons as dots.
   Locked / available / in-progress / complete / assisted (solution used) states.
2. **Lesson header** — module name + lesson name + task pips `●●●●○○`.
3. **Task stepper** — inside the instruction pane, tasks are steps; completing one advances in place
   (no page navigation between tasks in the same lesson → preserves editor state and momentum).

**Unlock rules**
- Task N+1 unlocks when task N passes.
- Lesson N+1 unlocks when lesson N is ≥ 80% complete (allows skipping one optional stretch task).
- Module unlocks on previous module complete **or** by placement test **or** teacher override.
- Stage boundaries also require passing a **Stage Checkpoint** (a multi-task integration lesson).
- Nothing is ever hard-locked for browsing: a locked lesson is *readable* (instructions visible) but
  its editor is disabled with "Өмнөх хичээлээ дуусгаад энд ирээрэй."

---

## 2.4 Full screen inventory

Legend: **M** = MVP, **1** = Phase 1, **2** = Phase 2+

### Public
| Screen | P | Key elements |
|---|---|---|
| Landing | M | Live hero editor, Shop.mn demo, curriculum preview, social proof, CTA |
| Curriculum overview | M | 9 stages, expandable module list, "энэ хичээл юу бүтээх вэ" per module |
| Pricing | M | 4 tiers, FAQ, MN payment methods (QPay, Golomt, Khan bank transfer) |
| Public profile `/u/[username]` | 1 | Avatar, XP, badges, shipped projects with live links, skills |
| Public project preview | M | Rendered student build, "Хийе дээр өөрөө хий" CTA |
| Certificate verify | 1 | Cert id, name, course, date, hash |

### Auth
| Screen | P | Notes |
|---|---|---|
| Register | M | Email+password, Google. Name in Cyrillic supported. |
| Login | M | + magic link fallback |
| Placement quiz | M | 5 questions, 60s, skippable, sets `entryPoint` |
| Onboarding wizard | M | Goal → hours/week → target date → straight into task 1 |

### Student
| Screen | P | Key elements |
|---|---|---|
| Dashboard `/app` | M | "Үргэлжлүүлэх" card (biggest element on screen), progress ring, streak, next 3 tasks, weekly goal, recent activity |
| Course map | M | Stage spine, module cards, lesson dots, % per skill |
| **Learning workspace** | M | See §2.2 |
| My Project | 1 | Full file tree of `shop-mn/`, preview, download ZIP, share link, deploy button, version timeline |
| Progress | 1 | Skill radar, XP graph, badges, streak calendar, time spent, tasks/day |
| Playground | 1 | Blank multi-file sandbox, same editor, no validation, savable snippets |
| Notes | 2 | Auto-generated concept cards from completed lessons + student's own notes, searchable |
| Settings | M | Profile, theme, editor (font size, tab width, vim mode), notifications, language, billing, GitHub |
| Billing/upgrade | M | Plan, payment method, invoices |

### Teacher
| Screen | P | Key elements |
|---|---|---|
| Cohort list | 1 | Cohorts, student counts, avg progress, join code |
| Cohort detail | 1 | **Progress heatmap** (students × lessons), at-risk list, deadline compliance |
| Student detail | 1 | Timeline of attempts, code snapshot replay, time-per-task, hints used, AI transcript |
| Assignments | 1 | Assign module/lesson, deadline, weight, auto-grade mapping |
| Analytics | 1 | Failure hotspots per task, median attempts, drop-off funnel, common wrong patterns |
| Gradebook | 1 | Weighted score per student, CSV/XLSX export |
| Plagiarism signals | 2 | Similarity clusters, paste-burst detection, solution-reveal rate |

### Author
| Screen | P | Key elements |
|---|---|---|
| Content dashboard | 1 | Courses, draft/published state, health warnings |
| Course tree editor | 1 | Drag-reorder stages/modules/lessons, dependencies |
| **Lesson studio** | 1 | Left: form (MDX blocks, tasks, hints, solution, starter files). Right: live student-eye preview. |
| Checker builder | 1 | Add checks visually (element exists, style equals, test file…), run against reference solution + against 5 known-bad solutions |
| Review queue | 2 | Diff view of proposed content changes, approve → publish version |
| Content health | 1 | Tasks with fail rate >50%, avg time > target, checks that never fail (useless), flaky checks |

### Admin
| Screen | P | Key elements |
|---|---|---|
| KPIs | 1 | DAU/WAU, activation, task completion, retention cohorts, MRR |
| Users | M | Search, role, impersonate (audited), suspend |
| Sandboxes | 1 | Live sessions, CPU/mem, kill, per-plan quotas |
| AI usage | 1 | Tokens & ₮ per student, top consumers, flagged conversations |
| Content versions | 1 | Publish/rollback, per-version student impact |
| Feature flags | 1 | Kill switches, experiment assignment |

---

## 2.5 Cross-cutting UI systems

| System | Behaviour |
|---|---|
| **Command palette** (`Ctrl/⌘+K`) | Jump to lesson, run, check, open AI, toggle preview device, format, reset task |
| **Toasts** | Bottom-centre on mobile, bottom-right desktop. Never block the action bar. |
| **Result panel** | Replaces the instruction pane content on submit, with per-check ✓/✗ rows. Dismissible back to instructions. |
| **AI tutor** | Right-side drawer on desktop (overlays preview), full-sheet on mobile. Persists per lesson. |
| **Offline banner** | Editor keeps working (local state + IndexedDB); submits queue and flush on reconnect. |
| **Keyboard shortcuts** | `Ctrl+Enter` run, `Ctrl+Shift+Enter` check, `Ctrl+B` toggle instructions, `Ctrl+\`` console, `Ctrl+J` AI, `Alt+←/→` prev/next task |
| **Language switch** | mn ⇄ en on any screen; code content is language-independent |

---

## 2.6 URL & state conventions

```
/learn/[lessonId]?task=3            # deep-link into a specific task
/learn/[lessonId]?task=3&solution=1 # only valid if solution already unlocked (server-checked)
/app/course/ip-101#stage-4          # anchored stage
/u/anuujin/shop-mn?v=42             # a specific snapshot version of a student build
```

- Editor buffer state lives in memory + IndexedDB, synced to `CodeSnapshot` every 2 s (debounced)
  and on every submit/blur/route change.
- Refreshing `/learn/...` must restore: open files, active file, cursor position, scroll, task index,
  console history, and AI conversation. Losing a student's buffer once destroys trust permanently.

---

*Next: [03 — Curriculum](03-curriculum.md)*
