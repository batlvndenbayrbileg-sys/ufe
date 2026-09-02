# 01 — Product Vision, Principles, Personas, User Journey

---

## 1.1 Product vision

**Хийе is the place a Mongolian beginner goes with zero skills and leaves with a deployed,
working e-commerce product they built line by line — and the ability to build the next one alone.**

The product is not a course library. It is a **single, verified, 12-week build** of one realistic
application, delivered as ~450 small tasks. The student's screen is a development environment,
not a video player. The platform's job is to always answer, within one screen:

1. **Юу хийх вэ?** — what exactly do I type now
2. **Яагаад?** — why this exists in Shop.mn
3. **Болсон уу?** — did it work, verified, not guessed

### Why this is different from what exists

| Alternative | What it gives | What it fails to give |
|---|---|---|
| YouTube / free tutorials (EN) | Explanation | Language, sequence, verification, accountability, a finished product |
| Udemy / Coursera (EN, translated) | Structure, video | Interactivity, MN-native explanation, real code verification, tutor |
| freeCodeCamp / Codecademy | Verification, browser coding | English-only, toy exercises, no coherent product, no full-stack continuity |
| Local bootcamps (UB, offline) | Mentors, cohort | Cost (₮2–5M), location-locked, fixed schedule, small capacity |
| University IT courses | Credential | Slides, theory-heavy, outdated stacks, almost no shipped artefact |
| v0 / Cursor / Copilot | Instant result | Student learns nothing; AI writes the code |

**Хийе's position:** *bootcamp rigor + browser convenience + Mongolian language + a portfolio artefact,
at 5–10% of bootcamp price.*

### The five differentiators (defend these; everything else is commodity)

1. **Ганц төсөл (One project).** Not 300 disconnected katas. Week 1's `<header>` is still in the app at week 12.
2. **Бодит шалгалт (Real verification).** Not "did you click next" — DOM assertions, unit tests, HTTP tests, SQL result-set comparison.
3. **Монгол тайлбар (Native Mongolian).** Written by Mongolian developers, not machine-translated. Terms stay English; explanations are natural Mongolian.
4. **Хурд (Speed).** Sub-second feedback. The loop must feel like a game, not like submitting homework.
5. **Багш биш, зөвлөгч AI (Tutor, not autocomplete).** The AI narrows the search space and refuses to hand over answers.

---

## 1.2 Product principles

These are the tie-breakers for every design and engineering argument.

> **P1 — Оюутан бичнэ. (The student types.)**
> No task is completed by clicking. No AI writes into the editor. If we ever autocomplete a whole
> solution, we have destroyed the product.

> **P2 — Үр дүн шууд харагдана. (The result is visible immediately.)**
> Every task in stages 1–3 produces a visible change on screen. Invisible progress kills beginners.

> **P3 — Жижиг алхам. (Small steps.)**
> Median task = 3–10 minutes, 5–25 lines of code. If a task takes >20 minutes for the median
> student, it is two tasks.

> **P4 — Яагаад гэдэг нь үргэлж байна. (The "why" is always present.)**
> Every lesson header states which Shop.mn feature this unlocks. Concepts are never taught in a vacuum.

> **P5 — Алдаа бол хичээл. (An error is a lesson.)**
> Failure output is designed content, not a stack trace dump. Every failing check has a hand-written
> Mongolian message.

> **P6 — Хариултыг өгөхгүй, замыг заана. (Show the path, not the answer.)**
> Hints escalate. Solutions cost. Copying is possible but recorded and never rewarded with full XP.

> **P7 — Утсан дээр ажиллана. (It works on a phone.)**
> ~45% of Mongolian students' primary device is a phone. The mobile layout is a first-class design,
> not a squeezed desktop.

> **P8 — Ачаалал багатай. (Low bandwidth.)**
> Ulaanbaatar 4G is fine; aimag centres are not. Target ≤ 400 KB JS for the lesson shell, offline-tolerant
> editor state, no autoplay video.

> **P9 — Насанд хүрсэн хүний бүтээгдэхүүн. (An adult's product.)**
> Gamification is a progress system, not a cartoon. No mascots, no confetti storms, no baby-talk.

> **P10 — Багш платформын кодыг хөндөхгүй. (Instructors never touch platform code.)**
> All content — lessons, tasks, tests, hints — is data.

---

## 1.3 Target users & personas

### Segment sizing (Mongolia, working assumptions to be validated)

| Segment | Approx. size / yr | Willingness to pay | Priority |
|---|---|---|---|
| University IT/CS students (NUM, MUST, SEAS, Otgontenger, Ikh Zasag…) | ~6,000–9,000 | Low personally / **high via institution** | **P0** |
| Career-switchers 20–30 (self-funded) | ~10,000 addressable | Medium (₮50–120k/mo) | **P0** |
| High-school 10–12 grade, STEM-inclined | ~15,000 | Low / parent-funded | P1 |
| Bootcamp students (as supplementary tooling) | ~800 | B2B license | P1 |
| Corporate junior upskilling (banks, telcos, fintech) | ~500 | High (B2B) | P2 |
| Mongolian diaspora (Korea, Japan, US) | ~3,000 | Medium-high, USD | P2 |

---

### Persona A — **Ануужин, 19, 2-р курс, МУИС, Computer Science**  *(primary)*

- **Device:** MacBook Air (borrowed) at home; Redmi Note phone in transit. Wi-Fi at school, 4G elsewhere.
- **Reality:** Has passed "Web programming" but cannot build anything. Copied group projects. Knows what
  HTML is; has never deployed anything; has never seen a real API.
- **Fear:** "Би сурсан юмаа ажил дээр хэрэглэж чадахгүй байх." (I won't be able to use what I learned at work.)
- **Goal:** An internship at a bank/fintech in 2 semesters, with something to show.
- **Trigger to sign up:** A friend shows a link to *their deployed Shop.mn*.
- **Success = ** deployed URL + GitHub repo she can paste into an application.
- **Churn risk:** exam weeks. → Streak freeze, "хичээлийн завсарлага" pause mode.

### Persona B — **Батсайхан, 26, банкны оператор, шилжилт хийхийг хүсэж байна**  *(primary, pays)*

- **Device:** Windows laptop, evenings 21:00–00:00 only. Sometimes only his phone in bed.
- **Reality:** Non-IT degree. Tried a Udemy course in English, quit at 18%. Has ₮80–150k/month to spend.
- **Fear:** "Оройтсон болов уу?" (Is it too late for me?) and "Хугацаа алдах вий."
- **Goal:** Junior frontend/full-stack job in 8–12 months, +₮800k salary.
- **Needs:** Evidence of progress, a realistic time estimate per task, no dead ends at 23:40 with no help.
- **Success =** first paid freelance job or a junior offer.
- **Churn risk:** stuck >40 min on one task at night. → AI tutor + hint ladder + "энэ таскийг маргааш үзье" defer.

### Persona C — **Сараа, 17, 11-р анги, Улаанбаатар**  *(secondary)*

- Phone-first (85% of sessions). 20–35 minute sessions on the bus.
- Motivated by making something visible and shareable, not by employment.
- Needs: mobile layout that genuinely works, short tasks, visible aesthetics early (CSS in week 1, not week 4).

### Persona D — **Ганбат, 34, багш, Ховд их сургууль**  *(teacher persona)*

- Teaches "Internet Programming" to 60 students, 16 weeks. Grading is his bottleneck.
- Wants: assign modules as homework, see who is stuck and on which task, export grades, catch copy-paste.
- **This persona is how we sell B2B.** Teacher value = automatic grading + visibility, not content.

### Persona E — **Дэлгэрмаа, платформын контент редактор**  *(internal/authoring persona)*

- Writes lessons in Mongolian, defines tests. Not a platform engineer.
- Needs an authoring UI + local preview + a CLI that validates content before publish.

### Anti-persona (explicitly not our user)

- The senior developer wanting a reference/docs site.
- The learner who wants passive video lectures with no coding.
- The student who wants an AI to write the assignment for them. (We degrade this experience on purpose.)

---

## 1.4 Complete user journey

### Stage 0 — Discovery → Registration (Day 0, 0–4 min)

```
Landing page (khiye.mn)
  ├─ Hero: live, editable HTML in an embedded mini-editor, right on the marketing page
  │   "Энэ кодыг өөрчлөөд үзээрэй →"  [instant preview updates]
  ├─ "Та 12 долоо хоногт юу бүтээх вэ?" → interactive Shop.mn demo (real deployed sample)
  └─ CTA: "Үнэгүй эхлэх" (no card)
       ↓
Registration  ── email + password  |  Google  |  (P2: phone OTP)
       ↓
Placement (60 seconds, 5 questions, skippable)
  "HTML бичиж үзсэн үү?"  "React гэж юу вэ гэдгийг мэдэх үү?" ...
       ↓  → sets entry point: Level 0 / skip to Stage 2 / skip to Stage 4
```

**Design rule:** the student writes their first line of code **before** creating an account.
The landing hero editor state is carried into the account on signup ("Таны бичсэн код хадгалагдлаа").

### Stage 1 — Onboarding (Day 0, 4–12 min) — *the make-or-break*

1. **Зорилго сонгох.** "Юуны төлөө сурах вэ?" → Ажилд орох / Их сургуулийн хичээл / Өөрийн бизнес /
   Сонирхол. Drives copy tone and weekly time target.
2. **Цаг тохируулах.** "7 хоногт хэдэн цаг?" → 3 / 5 / 10 / 15 ц. Produces a personal finish date:
   *"Энэ хурдаар 2026 оны 12-р сарын 4-нд Shop.mn-ээ дуусгана."*
3. **Хүрэх үр дүн.** Show the actual finished Shop.mn they will build, scrollable, real.
4. **Эхний таск шууд.** Not a tour — the first real task. Level 0 is skipped for onboarding;
   they go straight into `html-01-first-page`, which takes 90 seconds and turns their name into a heading.

**Onboarding success metric:** ≥ 70% of registrations complete task #1 in the same session.

### Stage 2 — First lesson & first code (Day 0, 12–25 min)

```
┌── ЗААВАР ──────────┬── КОД ─────────────┬── PREVIEW ─────────┐
│ Даалгавар 1/4      │ index.html         │  [Mobile▾]         │
│ "Shop.mn-ийн эхний │  1 <!DOCTYPE html> │                    │
│  хуудсыг үүсгэе."  │  2 <html>          │   Shop.mn          │
│                    │  3 ...             │                    │
│ Юу сурах вэ:       │                    │                    │
│  • HTML бүтэц      │                    │                    │
│  • <h1> гэж юу вэ  │                    │                    │
│                    │                    │                    │
│ [Заавар] [AI туслах]│  [▶ Ажиллуулах]   │  [Шалгах]          │
└────────────────────┴────────────────────┴────────────────────┘
```

First **PASS** moment is deliberately over-produced (once, and only once, at this scale):

> ✅ **Чи анхны вэб хуудсаа бичлээ.**
> Энэ бол Shop.mn-ийн эхний мөр. 12 долоо хоногийн дараа энэ хуудас бүрэн ажиллах дэлгүүр болно.
> **+10 XP** · Дараагийн даалгавар нээгдлээ →

### Stage 3 — First mini-milestone (Day 1–3, ~2 hours cumulative)

End of Module 1: a static Shop.mn home page with header, hero, 6 product cards, footer.
**Ship moment #1:** "Хуваалцах" generates a public preview URL `khiye.mn/u/anuujin/shop-mn` and a
downloadable ZIP. This is the first thing a student sends to a friend. Design it to be sendable.

### Stage 4 — Habit formation (Week 1–3)

- Daily target = 1 lesson (≈4–6 tasks, 25–40 min).
- Streak, weekly recap email ("Энэ 7 хоногт чи 23 даалгавар хийж, Shop.mn-д сагс нэмлээ").
- **Stuck-detection:** >3 failed submits or >12 min idle on one task → the AI tutor proactively offers
  ("Тусалъя уу?"), never auto-opens.
- **First quit-risk window is day 3–5.** Counter-measure: Module 3 (CSS Flexbox/Grid) makes the site
  suddenly look *good*. Front-load the aesthetic payoff.

### Stage 5 — First interactivity (Week 2) → the "programmer" moment

Task: cart counter increments on click. This is where a student first feels they wrote *logic*.
Mark it as a **Milestone** with a badge (⚡ JavaScript Starter) and a shareable card.

### Stage 6 — The hard middle (Week 4–7): React → API → Database

Highest churn risk in the whole course. Counter-measures:
- Stage transitions get a **"Юу өөрчлөгдөх вэ"** bridge lesson explaining what breaks and why
  (e.g. "Өмнөх HTML маань одоо component болно. Яагаад гэвэл…") with a side-by-side before/after.
- The migration to React is done **as a guided refactor of their own code**, not a rewrite from scratch.
- Weekly checkpoint project + a public "shipped" post.

### Stage 7 — Full-stack (Week 8–11)

Auth, cart persistence, orders, admin dashboard, payment mock (QPay/Golomt-style sandbox, mocked).
Now the student runs a real Node server + Postgres in a remote sandbox and hits their own API.

### Stage 8 — Deployment & graduation (Week 12)

- Push to their **own GitHub** (OAuth), deploy to Vercel + Neon, custom subdomain `anuujin.shop.mn`.
- **Capstone:** add one feature not covered by any lesson (wishlist / reviews / coupon), specified only
  in prose. Reviewed by rubric + peer + instructor.
- **Graduation artefacts:** live URL, GitHub repo, certificate (verifiable at `khiye.mn/verify/<id>`),
  auto-generated CV project description in MN and EN, skill profile.

### Stage 9 — After graduation (retention loop)

Advanced tracks (TypeScript deep-dive, testing, Docker, React Native), "Build your own idea" mode
with the same tooling and AI review, hiring board with partner companies, and a mentor path where
graduates answer other students' stuck-questions for XP/₮.

---

## 1.5 Emotional journey map (design against this, not against features)

| Time | Student feels | Risk | Product counter-measure |
|---|---|---|---|
| Min 0–2 | Skeptical | Bounce | Editable code in the hero; no signup wall |
| Min 12 | "Би хийлээ!" | — | Over-celebrate first PASS |
| Day 3 | "Энэ муухай харагдаж байна" | Quit | CSS module lands early; instant visual upgrade |
| Day 5 | "Ойлгохгүй байна" | Quit | Hint ladder + AI tutor + "тайлбарыг дахин үзэх" |
| Week 2 | "Би программ бичиж чадаж байна" | — | Milestone badge + share card |
| Week 4 | "React хэцүү юм" | **Peak churn** | Bridge lesson, refactor-your-own-code, smaller tasks |
| Week 6 | "Backend ойлгомжгүй" | **Peak churn** | Visual request/response animation before any code |
| Week 9 | "Их том болчихлоо" | Overwhelm | Progress replay: show week-1 screenshot vs today |
| Week 12 | "Би үүнийг хийсэн" | — | Deploy + certificate + share |

---

## 1.6 Business model (context for scope decisions)

| Tier | Price | Contains |
|---|---|---|
| Үнэгүй (Free) | ₮0 | Level 0 + Stage 1 (HTML/CSS) fully, ~25 lessons, no AI tutor, no server sandbox |
| Суралцагч (Learner) | ₮69,000/сар | Everything, AI tutor (fair-use), sandbox, deployment, certificate |
| Жилийн (Annual) | ₮590,000/жил | Same, 2 months free, career review |
| Сургууль (Institution) | ₮25,000/оюутан/семестр | Teacher panel, cohorts, grade export, plagiarism signals, min 30 seats |

Free tier is deliberately generous through the first *visible* achievement (a good-looking static site),
because the paywall must land **after** the student has felt capable, not before.
Gate = the moment JavaScript logic + AI tutor + server execution begin.

---

*Next: [02 — Information Architecture](02-information-architecture.md)*
