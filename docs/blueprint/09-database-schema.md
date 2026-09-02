# 09 — Database Schema

Two distinct schemas live in this product and must never be confused:

1. **Platform DB** — the Хийе product itself (users, lessons, submissions, progress). Owned by us.
2. **Shop.mn teaching DB** — the schema the *student* designs and builds during Stage 6–8, running
   in their sandbox. Owned by the student; we only ship the reference version for grading fixtures.

---

# Part A — Platform database (PostgreSQL 16, Prisma)

## 9.1 ERD (text)

```
User ─1─1─ StudentProfile
 │
 ├─1─N─ Enrollment ─N─1─ Course ─1─N─ Stage ─1─N─ Module ─1─N─ Lesson ─1─N─ Task
 │           │                                                    │          │
 │           └─1─N─ CourseProgress                                 │          ├─1─N─ Check
 │                                                                 │          ├─1─N─ Hint
 ├─1─N─ LessonProgress ───────────────────────────────────────────┘          └─1─1─ Solution
 ├─1─N─ TaskAttempt ─N─1─ Task
 ├─1─N─ Submission  ─1─N─ CheckResult
 ├─1─N─ CodeSnapshot
 ├─1─1─ Workspace (shop-mn file tree, current state)
 ├─1─N─ HintUnlock
 ├─1─N─ UserAchievement ─N─1─ Achievement
 ├─1─N─ SkillMastery ─N─1─ Skill
 ├─1─N─ XpLedger
 ├─1─N─ TutorConversation ─1─N─ TutorMessage
 ├─1─N─ QuizAttempt ─N─1─ QuizQuestion ─N─1─ Lesson
 ├─1─N─ SandboxSession
 ├─1─N─ Deployment
 ├─1─N─ CohortMembership ─N─1─ Cohort ─N─1─ Organization
 ├─1─N─ Subscription ─1─N─ Payment
 ├─1─N─ Session / Account (auth)
 └─1─N─ AnalyticsEvent

Cohort ─1─N─ Assignment ─N─1─ Module|Lesson
ContentVersion ─1─N─ (Course…Task snapshots)
Certificate ─N─1─ User, Course
```

## 9.2 Prisma schema (authoritative excerpt)

```prisma
// ─────────────────────────── Identity ───────────────────────────
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified DateTime?
  passwordHash  String?
  name          String
  username      String   @unique          // public profile slug
  avatarUrl     String?
  locale        String   @default("mn")
  role          Role     @default(STUDENT)
  status        UserStatus @default(ACTIVE)
  githubLogin   String?
  createdAt     DateTime @default(now())
  lastActiveAt  DateTime?

  profile       StudentProfile?
  enrollments   Enrollment[]
  attempts      TaskAttempt[]
  submissions   Submission[]
  snapshots     CodeSnapshot[]
  workspaces    Workspace[]
  achievements  UserAchievement[]
  mastery       SkillMastery[]
  xp            XpLedger[]
  conversations TutorConversation[]
  sandboxes     SandboxSession[]
  memberships   CohortMembership[]
  subscriptions Subscription[]
  certificates  Certificate[]
  @@index([lastActiveAt])
}

enum Role { STUDENT TEACHER AUTHOR ADMIN }
enum UserStatus { ACTIVE SUSPENDED DELETED }

model StudentProfile {
  userId          String  @id
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal            String?      // "job" | "university" | "business" | "hobby"
  hoursPerWeek    Int     @default(5)
  targetDate      DateTime?
  entryPoint      String  @default("m0")   // from placement quiz
  totalXp         Int     @default(0)
  level           Int     @default(1)
  streakDays      Int     @default(0)
  streakFreezes   Int     @default(0)
  lastStreakDate  DateTime?
  pausedUntil     DateTime?
  editorPrefs     Json    @default("{}")   // fontSize, theme, vim, tabWidth
  onboardedAt     DateTime?
}

// ─────────────────────────── Content ───────────────────────────
// Mirrors the git content repo; refreshed on publish. Read-mostly.
model Course {
  id          String  @id                 // "ip-101"
  slug        String  @unique
  title       Json                        // { mn, en }
  description Json
  level       String                      // beginner
  published   Boolean @default(false)
  stages      Stage[]
  enrollments Enrollment[]
  versionId   String
  version     ContentVersion @relation(fields: [versionId], references: [id])
}

model Stage  { id String @id  courseId String  order Int  title Json  badgeId String?
                 course Course @relation(fields:[courseId],references:[id])  modules Module[] }

model Module { id String @id  stageId String  order Int  title Json  description Json
                 estimatedHours Float
                 stage Stage @relation(fields:[stageId],references:[id])  lessons Lesson[] }

model Lesson {
  id              String @id                 // "m1-l5"
  moduleId        String
  order           Int
  slug            String
  title           Json
  why             Json
  buildsInProject String
  difficulty      String
  estimatedMinutes Int
  skills          String[]
  concepts        String[]
  prerequisites   String[]
  executionTier   Int
  runtime         String
  mobileFriendly  Boolean @default(true)
  contentRef      String                      // path/sha into the content bundle
  completionXp    Int     @default(15)
  badgeId         String?
  isCheckpoint    Boolean @default(false)
  module          Module  @relation(fields: [moduleId], references: [id])
  tasks           Task[]
  quiz            QuizQuestion[]
  progress        LessonProgress[]
  @@unique([moduleId, order])
}

model Task {
  id            String @id                   // "m1-l5-t1"
  lessonId      String
  order         Int
  title         Json
  statement     Json
  requirements  Json?
  expected      Json
  starterPatch  Json                          // FilePatch[]
  targetFile    String?
  marker        String?
  checkMode     String  @default("all")
  passThreshold Float   @default(1.0)
  xp            Int     @default(10)
  estimatedMinutes Int  @default(5)
  skills        String[]
  allowSkip     Boolean @default(false)
  lesson        Lesson  @relation(fields: [lessonId], references: [id])
  checks        Check[]
  hints         Hint[]
  solution      Solution?
  attempts      TaskAttempt[]
  @@unique([lessonId, order])
}

model Check {
  id       String @id @default(cuid())
  taskId   String
  key      String                              // "c1" — stable id used in results
  type     String                              // "dom.exists"
  args     Json
  onFail   Json
  onPass   Json?
  weight   Float   @default(1)
  hidden   Boolean @default(false)
  order    Int
  flakyRate Float  @default(0)                 // maintained by the flake detector
  task     Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  @@unique([taskId, key])
}

model Hint     { id String @id @default(cuid())  taskId String  level Int  text Json  code String?
                 xpCost Int @default(0)
                 task Task @relation(fields:[taskId],references:[id], onDelete: Cascade)
                 @@unique([taskId, level]) }

model Solution { taskId String @id  patch Json  explanation Json  xpPenalty Int
                 task Task @relation(fields:[taskId],references:[id], onDelete: Cascade) }

model ContentVersion {
  id          String   @id @default(cuid())
  gitSha      String   @unique
  changelog   String
  publishedAt DateTime @default(now())
  active      Boolean  @default(false)
  courses     Course[]
  enrollments Enrollment[]
}

// ─────────────────────────── Progress ───────────────────────────
model Enrollment {
  id               String @id @default(cuid())
  userId           String
  courseId         String
  contentVersionId String                    // pinned; migrated at lesson boundaries
  startedAt        DateTime @default(now())
  completedAt      DateTime?
  currentLessonId  String?
  percentComplete  Float @default(0)
  user             User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course           Course @relation(fields: [courseId], references: [id])
  version          ContentVersion @relation(fields: [contentVersionId], references: [id])
  @@unique([userId, courseId])
}

model LessonProgress {
  id          String @id @default(cuid())
  userId      String
  lessonId    String
  status      ProgressStatus @default(LOCKED)
  tasksTotal  Int
  tasksPassed Int  @default(0)
  startedAt   DateTime?
  completedAt DateTime?
  minutesSpent Int @default(0)
  lesson      Lesson @relation(fields: [lessonId], references: [id])
  @@unique([userId, lessonId])
  @@index([userId, status])
}
enum ProgressStatus { LOCKED AVAILABLE IN_PROGRESS COMPLETED }

model TaskAttempt {
  id            String @id @default(cuid())
  userId        String
  taskId        String
  attemptNo     Int
  passed        Boolean
  assisted      Boolean @default(false)     // solution revealed before passing
  hintsUsed     Int     @default(0)
  durationMs    Int                          // time on task for this attempt
  submissionId  String?
  createdAt     DateTime @default(now())
  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)
  task          Task @relation(fields: [taskId], references: [id])
  @@index([userId, taskId])
  @@index([taskId, passed])                 // powers failure hotspots
}

model Submission {
  id            String  @id @default(cuid())
  userId        String
  taskId        String
  snapshotId    String                       // files at submit time
  passed        Boolean
  verifiedBy    String                       // "server" | "runner"
  clientAgreed  Boolean                      // client verdict == server verdict
  suspicious    Boolean @default(false)
  durationMs    Int
  createdAt     DateTime @default(now())
  results       CheckResult[]
  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
}

model CheckResult {
  id           String @id @default(cuid())
  submissionId String
  checkKey     String
  passed       Boolean
  actual       String?
  expected     String?
  errorKind    String?
  durationMs   Int
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  @@index([submissionId])
}

model Workspace {
  id         String @id @default(cuid())
  userId     String
  courseId   String
  files      Json                            // FileSet (text only, ≤ 512 KB)
  sizeBytes  Int
  updatedAt  DateTime @updatedAt
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, courseId])
}

model CodeSnapshot {
  id         String @id @default(cuid())
  userId     String
  taskId     String?
  kind       String                          // "autosave" | "submit" | "solution" | "reset"
  files      Json?                           // full set (submit) …
  patch      Json?                           // … or a diff from the previous snapshot
  storageKey String?                         // R2 key when > 64 KB
  createdAt  DateTime @default(now())
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, taskId, createdAt])
}

model HintUnlock { id String @id @default(cuid())  userId String  taskId String  level Int
                   xpSpent Int  createdAt DateTime @default(now())
                   @@unique([userId, taskId, level]) }

// ─────────────────────────── Gamification ───────────────────────────
model Skill        { id String @id  title Json  icon String?  order Int  mastery SkillMastery[] }
model SkillMastery { id String @id @default(cuid())  userId String  skillId String
                     percent Float @default(0)  xp Int @default(0)  updatedAt DateTime @updatedAt
                     user User @relation(fields:[userId],references:[id], onDelete: Cascade)
                     skill Skill @relation(fields:[skillId],references:[id])
                     @@unique([userId, skillId]) }

model Achievement     { id String @id  title Json  description Json  icon String  category String
                        criteria Json  users UserAchievement[] }
model UserAchievement { id String @id @default(cuid())  userId String  achievementId String
                        earnedAt DateTime @default(now())
                        user User @relation(fields:[userId],references:[id], onDelete: Cascade)
                        achievement Achievement @relation(fields:[achievementId],references:[id])
                        @@unique([userId, achievementId]) }

model XpLedger { id String @id @default(cuid())  userId String  amount Int  reason String
                 refType String?  refId String?  createdAt DateTime @default(now())
                 user User @relation(fields:[userId],references:[id], onDelete: Cascade)
                 @@index([userId, createdAt]) }
// XpLedger is append-only; StudentProfile.totalXp is a denormalised sum kept in the same transaction.

// ─────────────────────────── AI ───────────────────────────
model TutorConversation { id String @id @default(cuid())  userId String  lessonId String  taskId String?
                          createdAt DateTime @default(now())  messages TutorMessage[]
                          user User @relation(fields:[userId],references:[id], onDelete: Cascade)
                          @@index([userId, lessonId]) }
model TutorMessage      { id String @id @default(cuid())  conversationId String
                          role String                     // "user" | "assistant"
                          content String
                          resolvedBy String?              // "faq" | "llm"
                          model String?  tokensIn Int?  tokensOut Int?  costMnt Float?
                          policy Json?  filtered Boolean @default(false)
                          createdAt DateTime @default(now())
                          conversation TutorConversation @relation(fields:[conversationId],references:[id], onDelete: Cascade) }
model TaskFaq           { id String @id @default(cuid())  taskId String  question String
                          answer Json  embedding Unsupported("vector(1536)")  hits Int @default(0)
                          approvedBy String?  @@index([taskId]) }

// ─────────────────────────── Quiz ───────────────────────────
model QuizQuestion { id String @id @default(cuid())  lessonId String  order Int  kind String
                     prompt Json  options Json  correct Json  explanation Json
                     lesson Lesson @relation(fields:[lessonId],references:[id], onDelete: Cascade) }
model QuizAttempt  { id String @id @default(cuid())  userId String  questionId String
                     answer Json  correct Boolean  createdAt DateTime @default(now())
                     @@index([userId, questionId]) }

// ─────────────────────────── Sandbox & deploy ───────────────────────────
model SandboxSession {
  id         String @id @default(cuid())
  userId     String
  lessonId   String?
  tier       Int
  runtime    String
  status     String                       // "booting" | "ready" | "idle" | "killed" | "failed"
  vmId       String?
  previewUrl String?
  cpuSeconds Float  @default(0)
  memPeakMb  Int    @default(0)
  startedAt  DateTime @default(now())
  endedAt    DateTime?
  killReason String?
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, status])
}

model Deployment { id String @id @default(cuid())  userId String  provider String  url String
                   repoUrl String?  status String  verifiedAt DateTime?
                   createdAt DateTime @default(now())
                   user User @relation(fields:[userId],references:[id], onDelete: Cascade) }

model Certificate { id String @id @default(cuid())  userId String  courseId String
                    serial String @unique  unassistedRatio Float  issuedAt DateTime @default(now())
                    revokedAt DateTime?
                    user User @relation(fields:[userId],references:[id]) }

// ─────────────────────────── Institutions ───────────────────────────
model Organization    { id String @id @default(cuid())  name String  kind String  seats Int
                        cohorts Cohort[] }
model Cohort          { id String @id @default(cuid())  orgId String  name String  courseId String
                        joinCode String @unique  startsAt DateTime  endsAt DateTime?
                        teacherIds String[]
                        org Organization @relation(fields:[orgId],references:[id])
                        members CohortMembership[]  assignments Assignment[] }
model CohortMembership{ id String @id @default(cuid())  cohortId String  userId String
                        role String @default("student")  joinedAt DateTime @default(now())
                        cohort Cohort @relation(fields:[cohortId],references:[id], onDelete: Cascade)
                        user User @relation(fields:[userId],references:[id], onDelete: Cascade)
                        @@unique([cohortId, userId]) }
model Assignment      { id String @id @default(cuid())  cohortId String  targetType String
                        targetId String  dueAt DateTime  weight Float @default(1)
                        cohort Cohort @relation(fields:[cohortId],references:[id], onDelete: Cascade) }

// ─────────────────────────── Billing & telemetry ───────────────────────────
model Subscription { id String @id @default(cuid())  userId String  plan String  status String
                     provider String                  // "qpay" | "bank" | "card"
                     currentPeriodEnd DateTime  cancelAt DateTime?
                     user User @relation(fields:[userId],references:[id], onDelete: Cascade)
                     payments Payment[] }
model Payment      { id String @id @default(cuid())  subscriptionId String  amountMnt Int
                     status String  externalId String?  idempotencyKey String @unique
                     createdAt DateTime @default(now())
                     subscription Subscription @relation(fields:[subscriptionId],references:[id]) }

model AnalyticsEvent { id BigInt @id @default(autoincrement())  userId String?  name String
                       props Json  sessionId String?  createdAt DateTime @default(now())
                       @@index([name, createdAt])  @@index([userId, createdAt]) }

model AuditLog { id BigInt @id @default(autoincrement())  actorId String  action String
                 targetType String  targetId String  meta Json  createdAt DateTime @default(now())
                 @@index([actorId, createdAt]) }
```

## 9.3 Key relationships & invariants

| Invariant | Enforcement |
|---|---|
| A task is complete for a user iff a `TaskAttempt(passed=true)` exists | unique partial index `(userId, taskId) where passed` |
| `StudentProfile.totalXp == Σ XpLedger.amount` | written in the same transaction; nightly reconciliation job |
| A lesson unlocks only when prerequisites are complete | computed in the progression service, cached in `LessonProgress.status` |
| Certificates only count server-verified attempts | `Submission.verifiedBy != 'client'` filter in the issuing query |
| Workspace size ≤ 512 KB, ≤ 200 files | check constraint + application guard |
| Payments are idempotent | `Payment.idempotencyKey` unique |
| A student's data is fully deletable | every user-owned table has `onDelete: Cascade` |

## 9.4 Indexing & performance notes

- Hot query: *"what is my next task"* → `LessonProgress(userId, status)` + `Task(lessonId, order)`.
  Denormalise `Enrollment.currentLessonId` to make the dashboard a single row read.
- Hot query: *"cohort heatmap"* → materialised view `mv_cohort_progress(cohortId, userId, moduleId,
  percent)` refreshed every 60 s. Do **not** compute it live for 60 students × 15 modules.
- `AnalyticsEvent` is partitioned monthly; `CheckResult` partitioned monthly; both pruned per
  retention policy.
- `CodeSnapshot.files` > 64 KB spills to R2; the row keeps `storageKey`.
- pgvector extension for `TaskFaq.embedding` (ivfflat, lists=100).

## 9.5 Migration & seeding

- Prisma Migrate; migrations run in CI against a shadow DB and are applied on deploy.
- `packages/db/seed.ts` seeds: skills, achievements, one org/cohort, 3 demo students at different
  progress levels, and imports the content bundle for `ip-101`.
- **Content sync job** (`khiye content sync`) reads the published bundle and upserts
  Course→Task→Check/Hint/Solution rows inside one transaction per lesson, keyed by content id.

---

# Part B — Shop.mn teaching schema (what the student builds)

Introduced incrementally, never dumped at once. This is the reference the grading fixtures use.

```
users ────────────< addresses
  │                    │
  │                    └──< orders >── order_items >── products >── categories
  │                          │                            │
  │                          └──< payments                └──< product_images
  │
  └──< carts ──< cart_items >── products
```

| Stage | Tables introduced | Why then |
|---|---|---|
| M9-l1..l4 | `products` | You cannot query what does not exist |
| M9-l5..l7 | `categories` (+FK), first JOINs | Filtering already exists in the UI; now it is real |
| M9-l8 | `users`, `orders`, `order_items`, `addresses` | Schema design lesson: model the business |
| M10 | `users.password_hash`, `users.role` | Auth |
| M11 | `carts`, `cart_items`, `payments`, `coupons` | Purchase flow |

```sql
-- Reference (final) schema, Stage 8
create table categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  parent_id int references categories(id)
);

create table products (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  price_mnt integer not null check (price_mnt >= 0),
  stock integer not null default 0 check (stock >= 0),
  category_id int not null references categories(id),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on products (category_id);
create index on products using gin (to_tsvector('simple', name));

create table users (
  id serial primary key,
  email citext not null unique,
  password_hash text not null,
  name text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table addresses (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  label text,                       -- "Гэр", "Ажил"
  city text not null,               -- "Улаанбаатар"
  district text not null,           -- "Сүхбаатар дүүрэг"
  khoroo text,                      -- "1-р хороо"
  detail text not null,             -- байр, тоот
  phone text not null,
  is_default boolean not null default false
);

create table carts (
  id serial primary key,
  user_id int unique references users(id) on delete cascade,
  session_token text unique,        -- guest carts
  created_at timestamptz not null default now(),
  check (user_id is not null or session_token is not null)
);
create table cart_items (
  id serial primary key,
  cart_id int not null references carts(id) on delete cascade,
  product_id int not null references products(id),
  quantity int not null check (quantity > 0),
  unique (cart_id, product_id)      -- the invariant that teaches "update, don't append"
);

create table orders (
  id serial primary key,
  user_id int not null references users(id),
  address_id int not null references addresses(id),
  status text not null default 'pending'
      check (status in ('pending','paid','shipped','delivered','cancelled')),
  subtotal_mnt integer not null,
  shipping_mnt integer not null default 0,
  discount_mnt integer not null default 0,
  total_mnt integer not null,
  created_at timestamptz not null default now()
);
create table order_items (
  id serial primary key,
  order_id int not null references orders(id) on delete cascade,
  product_id int not null references products(id),
  quantity int not null check (quantity > 0),
  unit_price_mnt integer not null   -- price AT PURCHASE TIME — a deliberate teaching moment
);

create table payments (
  id serial primary key,
  order_id int not null references orders(id),
  provider text not null,           -- 'qpay' | 'bank' | 'cash'
  amount_mnt integer not null,
  status text not null default 'pending'
      check (status in ('pending','success','failed','refunded')),
  external_id text,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
```

**Teaching moments deliberately encoded in this schema** (each is a lesson):
`unit_price_mnt` (why you snapshot the price) · `cart_items UNIQUE(cart_id, product_id)` (update vs
insert) · `check (stock >= 0)` (server-side invariants) · `payments.idempotency_key` (webhooks fire
twice) · `orders.status` check constraint (state machines) · guest-cart `session_token` (merge on login).

Money is stored as **integer MNT** (no decimals; the tögrög has no subunit in practice) — this is
also the lesson on why floats must never hold money.

---

*Next: [10 — API Specification](10-api-spec.md)*
