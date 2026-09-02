# 04 — Content Schema & Authoring Pipeline

> **Principle D5/P10:** lessons, tasks, hints, starter code, solutions and tests are **data**.
> Adding a new course must never require a platform code change.

---

## 4.1 Content model

```
Course
 └── Stage            (visual grouping, gates progression)
      └── Module      (a coherent skill block, ~6–16 lessons)
           └── Lesson (one sitting, 20–50 min, 2–6 tasks)
                ├── content blocks (MDX)  ← the "read" half
                └── Task[]                ← the "do" half
                     ├── statement (MDX)
                     ├── filePatch (starter)
                     ├── checks[]         ← validation
                     ├── hints[]          ← 3-tier ladder
                     └── solution (patch + explanation)
```

---

## 4.2 File layout of the content repo

```
content/courses/internet-programming/
├── course.json                         # course metadata, stage list
├── skills.json                         # skill taxonomy
├── assets/                             # images, svg, mp4 used by lessons
├── project/                            # the canonical shop-mn workspace at every checkpoint
│   ├── _base/                          # empty starting workspace
│   └── _snapshots/m1-l5/               # reference workspace AFTER m1-l5 (used to repair drift)
└── modules/
    └── m1-html/
        ├── module.json
        └── lessons/
            ├── m1-l5-product-card/
            │   ├── lesson.mdx          # prose: intro, concept, visual, example
            │   ├── lesson.json         # metadata + task definitions
            │   ├── tasks/
            │   │   ├── t1/starter/     # files written into the workspace at task start
            │   │   ├── t1/solution/    # reference solution files
            │   │   └── t1/checks.json  # (or inline in lesson.json)
            │   └── i18n/
            │       └── en.mdx          # optional English translation
```

**Why files, not a database?** Diffable, reviewable in PRs, versioned by git tag, trivially rolled
back, editable by an author UI that commits through the GitHub API, and cacheable at the edge.
The DB stores only *published snapshots* (see §4.6) plus student progress.

---

## 4.3 `lesson.json` — the authoritative schema

Validated by `packages/content-sdk` with zod. Full TypeScript type:

```ts
type Lesson = {
  id: string;                       // "m1-l5"  (globally unique, kebab)
  moduleId: string;                 // "m1-html"
  slug: string;                     // "product-card"
  order: number;

  title: { mn: string; en?: string };
  subtitle?: { mn: string; en?: string };

  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;         // median completion time; validated against telemetry
  skills: SkillId[];                // ["html", "css"]
  concepts: string[];               // ["div", "article", "class"] — used for the notes/glossary
  prerequisites: string[];          // lesson ids

  // The "why" — rendered in the lesson header. NEVER optional. (Principle P4)
  why: { mn: string; en?: string };
  buildsInProject: string;          // "Нүүр хуудасны бүтээгдэхүүний карт"

  execution: {
    tier: 1 | 2 | 3;                // see 12-code-execution.md
    runtime: "static" | "vite-react" | "next" | "node" | "postgres" | "pglite";
    entry?: string;                 // "index.html" | "src/main.jsx"
    autoRun: boolean;               // tier 1 → true (no Run button)
    services?: ("postgres" | "mailhog")[];
  };

  workspace: {
    // Files ADDED/REPLACED into the student's persistent shop-mn workspace when the lesson opens.
    // Only used when the student's workspace lacks them (never clobbers student work
    // unless `force: true`, which requires an author confirmation + student warning).
    patch: FilePatch[];
    visibleFiles: string[];         // which files appear in the tree for this lesson
    openFiles: string[];            // tabs opened by default
    activeFile: string;
    readOnlyFiles?: string[];       // e.g. products.json given to them
  };

  content: {
    // MDX file references, rendered in the instruction pane above the task stepper
    intro: string;                  // "./lesson.mdx#intro"
    concept: string;
    visual?: VisualBlock;           // interactive diagram id + props
    example?: string;
  };

  tasks: Task[];

  quiz?: QuizQuestion[];            // 0–3 questions after the last task
  completion: {
    xp: number;                     // lesson bonus on top of task XP
    badge?: BadgeId;
    milestone?: boolean;            // triggers the share card
    celebration?: "small" | "large";
  };

  mobileFriendly: boolean;          // false → show "compute recommended" banner
  status: "draft" | "review" | "published" | "deprecated";
  version: number;
  authors: string[];
  updatedAt: string;
};
```

```ts
type Task = {
  id: string;                       // "m1-l5-t1"
  order: number;
  title: { mn: string; en?: string };

  // The instruction pane content, MDX. Must answer: what exactly do I type.
  statement: { mn: string; en?: string };

  // Optional short list rendered as a checklist above the editor
  requirements?: { mn: string; en?: string }[];

  // "Хүлээгдэж буй үр дүн" — described in words AND optionally an image
  expected: {
    description: { mn: string; en?: string };
    image?: string;                 // ./assets/expected-t1.png
    previewRef?: string;            // id of a reference preview rendered side-by-side
  };

  starter?: FilePatch[];            // applied when the task becomes active
  targetFile?: string;              // focus this file + scroll to marker
  marker?: string;                  // e.g. "// энд бич" — editor scrolls & places cursor here

  checks: Check[];                  // see 05-validation-engine.md
  checkMode: "all" | "weighted";
  passThreshold?: number;           // for weighted mode, default 1.0

  hints: Hint[];                    // exactly 3 by convention (see §4.5)
  solution: {
    patch: FilePatch[];
    explanation: { mn: string; en?: string };
    xpPenalty: number;              // default: task xp × 0.6 lost
  };

  xp: number;                       // 5 (trivial) / 10 (normal) / 20 (hard) / 40 (checkpoint)
  estimatedMinutes: number;
  skills: SkillId[];
  allowSkip: boolean;               // stretch tasks only
};

type FilePatch =
  | { op: "create"; path: string; content: string }
  | { op: "replace"; path: string; content: string }
  | { op: "append"; path: string; content: string }
  | { op: "delete"; path: string }
  | { op: "rename"; path: string; to: string }
  | { op: "insertAfter"; path: string; anchor: string; content: string };

type Hint = {
  level: 1 | 2 | 3;
  text: { mn: string; en?: string };
  code?: string;                    // level 3 may show a *fragment*, never the full answer
  xpCost: number;                   // 0 / 1 / 3
};
```

---

## 4.4 Worked example — `m1-l5` task 1 (abridged; full text in [17](17-example-content-mn.md))

```json
{
  "id": "m1-l5",
  "moduleId": "m1-html",
  "slug": "product-card",
  "order": 5,
  "title": { "mn": "Бүтээгдэхүүний карт хийцгээе" },
  "difficulty": "beginner",
  "estimatedMinutes": 28,
  "skills": ["html"],
  "concepts": ["div", "article", "img", "button", "class"],
  "why": {
    "mn": "Shop.mn дээр 100 бүтээгдэхүүн байлаа гэж бодъё. Тэдгээр нь бүгд ижилхэн хэлбэртэй жижиг \"карт\" дотор харагдана. Тиймээс эхлээд нэг картыг маш сайн хийж сурах хэрэгтэй."
  },
  "buildsInProject": "Нүүр хуудасны бүтээгдэхүүний карт",
  "execution": { "tier": 1, "runtime": "static", "entry": "index.html", "autoRun": true },
  "workspace": {
    "patch": [
      { "op": "create", "path": "images/deel.jpg", "content": "@asset:products/deel.jpg" }
    ],
    "visibleFiles": ["index.html", "styles/main.css", "images/"],
    "openFiles": ["index.html"],
    "activeFile": "index.html"
  },
  "tasks": [
    {
      "id": "m1-l5-t1",
      "order": 1,
      "title": { "mn": "Картын араг ясыг үүсгэ" },
      "statement": {
        "mn": "`index.html` дотор `<main>` дотор шинэ `<article>` элемент нэмнэ үү. Түүнд `product-card` гэсэн class өгнө. Энэ бол нэг бүтээгдэхүүний карт болно."
      },
      "requirements": [
        { "mn": "`<article>` элемент байх" },
        { "mn": "`class=\"product-card\"` байх" },
        { "mn": "`<main>` дотор байрлах" }
      ],
      "expected": {
        "mn_description": "Preview дээр одоохондоо юу ч харагдахгүй — энэ хэвийн. Дараагийн даалгавраас эхлээд агуулга нэмнэ.",
        "image": "./assets/m1-l5-t1.png"
      },
      "targetFile": "index.html",
      "marker": "<!-- энд бичнэ үү -->",
      "checks": [
        {
          "id": "c1", "type": "dom.exists",
          "args": { "selector": "main article.product-card", "min": 1 },
          "onFail": { "mn": "`product-card` class-тай `<article>` элемент `<main>` дотор олдсонгүй. Class-ийн бичлэгээ шалгаарай — зураас (-) байгаа эсэх." },
          "weight": 1
        }
      ],
      "checkMode": "all",
      "hints": [
        { "level": 1, "xpCost": 0, "text": { "mn": "`<article>` бол нэг бие даасан агуулгыг илэрхийлдэг элемент. Түүнийг `<main>`-ийн дотор бичнэ." } },
        { "level": 2, "xpCost": 1, "text": { "mn": "Элементэд class өгөхдөө нээлттэй tag дотор `class=\"...\"` гэж бичдэг. Жишээ нь `<div class=\"box\">`." } },
        { "level": 3, "xpCost": 3, "text": { "mn": "Ингэж эхэлнэ:" }, "code": "<article class=\"product-card\">\n  <!-- дараагийн даалгавраас агуулга нэмнэ -->\n</article>" }
      ],
      "solution": {
        "patch": [{ "op": "insertAfter", "path": "index.html", "anchor": "<!-- энд бичнэ үү -->",
                    "content": "<article class=\"product-card\"></article>" }],
        "explanation": { "mn": "`<article>` нь бие даан утга агуулах хэсгийг заана. Бүтээгдэхүүний карт нь бусад хэсгээс тусад нь ойлгогдох тул `<div>`-ээс илүү тохиромжтой." },
        "xpPenalty": 6
      },
      "xp": 10,
      "estimatedMinutes": 4,
      "skills": ["html"],
      "allowSkip": false
    }
  ]
}
```

---

## 4.5 Authoring rules (enforced by the content linter, `khiye content lint`)

| Rule | Enforcement |
|---|---|
| Every task has ≥ 1 check | error |
| Every check has a hand-written `onFail.mn` | error |
| Exactly 3 hints, escalating, hint 3 may contain code but not the full solution | error (heuristic: hint 3 code ⊄ solution patch by ≥ 30% of tokens) |
| `why.mn` non-empty and mentions Shop.mn | warning |
| No English sentences in `mn` fields (except code/terms in backticks) | warning |
| `estimatedMinutes` within 2× of telemetry median | warning after 100 attempts |
| Reference solution passes all checks | **error, blocking** |
| Each of ≥ 3 "known-bad" fixtures fails with a *distinct, useful* message | error |
| Task statement ≤ 400 characters | warning |
| Every `@asset:` reference resolves | error |
| Lesson prerequisites form a DAG | error |
| Tier-3 lessons declare their `services` | error |

`khiye content lint` runs in CI on every content PR and blocks merge.

---

## 4.6 Publishing pipeline

```
Author edits in /author/lesson/[id]        ┐
     or edits MDX/JSON in the repo         ├──▶  branch  ──▶  PR
                                            ┘
                    │
                    ▼
        CI:  khiye content lint
             khiye content test   (runs every task's checks against its reference solution
                                   AND against the known-bad fixtures, in a real sandbox)
                    │  all green
                    ▼
             Reviewer approves  (/author/review)
                    │
                    ▼
             Merge to main → build a ContentVersion
                    │
                    ▼
        Publish:  content bundle (JSON) → S3/R2 + edge cache
                  ContentVersion row in Postgres (id, gitSha, publishedAt, changelog)
                    │
                    ▼
        Students on lesson X are pinned to the version they started with,
        and are offered "Шинэчлэгдсэн хувилбар байна" if the change is non-breaking.
```

**Version pinning matters:** if we change a check while a student is mid-task, their passing solution
must not suddenly fail. `Enrollment.contentVersionId` pins a student; migrations to a new version
happen at lesson boundaries only.

**Rollback:** flip `ContentVersion.active`; the edge cache key includes the version id, so rollback is
one row update + cache purge.

---

## 4.7 The Author Studio (`/author/lesson/[id]`)

Two-pane: form on the left, **the real student workspace** on the right — the author sees exactly
what a student sees, including running the checks.

```
┌── LESSON FORM ──────────────────┬── STUDENT VIEW (live) ────────────────┐
│ Гарчиг      [Бүтээгдэхүүний...] │ ┌────────┬───────────┬──────────────┐ │
│ Яагаад?     [textarea MDX]      │ │ Заавар │ Код       │ Preview      │ │
│ Skills      [html ×] [+]        │ │        │           │              │ │
│ Tier        [1 ▾] static        │ └────────┴───────────┴──────────────┘ │
│                                  │                                       │
│ ▼ Даалгавар 1                   │  [▶ Reference solution-оор ажиллуулах] │
│   Statement  [MDX editor]        │  ✓ c1  dom.exists  main article...    │
│   Starter    [file editor]       │  ✓ c2  dom.text                       │
│   Checks     [+ шалгалт нэмэх]   │                                       │
│     ● dom.exists  selector=...   │  [Bad fixture 1 ▾]                    │
│       onFail: "..."              │  ✗ c1 → "class-ийн бичлэгээ шалгаарай"│
│   Hints 1/2/3                    │  ✓ distinct message                   │
│   Solution   [file editor]       │                                       │
└─────────────────────────────────┴───────────────────────────────────────┘
```

Checker builder UX: a dropdown of check types, each with a typed argument form and an inline
"Try it" that runs against the current reference solution. Authors never write raw JSON unless they
open the "Advanced" toggle.

---

## 4.8 Reusability beyond this course

The schema has nothing e-commerce-specific in it. A second course
(`python-101`, `mobile-rn`, `data-101`) needs only:

1. a new `content/courses/<id>/` folder,
2. possibly a new `execution.runtime` value + a matching sandbox image,
3. possibly new `Check` types registered in `packages/checkers`.

Both extension points are plugin registries, not `if` statements:

```ts
// packages/checkers/src/registry.ts
registerChecker("dom.exists", domExistsChecker);
registerChecker("sql.resultEquals", sqlResultEqualsChecker);
// a course-specific checker can be registered by a content package
```

---

*Next: [05 — Validation Engine](05-validation-engine.md)*
