# 03 — Curriculum: "Интернэт программчлал" (Internet Programming)

**Course id:** `ip-101`
**Shape:** 9 stages → 15 modules → **142 lessons** → **~520 tasks**
**Duration:** 12 weeks @ 10–12 h/week (≈ 130 hours) · self-paced, no deadlines unless a cohort sets them
**Outcome:** a deployed, database-backed e-commerce application (`shop.mn` clone) built entirely by the student.

---

## 3.1 The spine rule

> **Every task mutates the same workspace: `shop-mn/`.**

There are no throwaway exercises. When we need to teach `Array.map`, we teach it by rendering the
product grid. When we need to teach `JOIN`, we teach it by fetching an order with its customer name
and product names. A student can, at any moment, open `/app/project` and see the current state of the
one thing they are building.

Consequence for engineering: the workspace is a **persistent, versioned file tree per student**, and
lessons declare *file patches*, not fresh starter files. See [04](04-content-schema.md) §4.3.

### The workspace's evolution

| After stage | `shop-mn/` looks like |
|---|---|
| 1 | `index.html`, `product.html`, `styles/main.css`, `images/` |
| 2 | `+ js/products.js`, `js/cart.js`, `js/render.js` |
| 3 | Vite + React: `src/components/*`, `src/pages/*`, `src/hooks/*` |
| 4 | Next.js: `app/`, `app/products/[id]/page.tsx`, `components/`, TypeScript |
| 5 | `app/api/**/route.ts`, `lib/validation.ts` |
| 6 | `prisma/schema.prisma`, `lib/db.ts`, `prisma/seed.ts` |
| 7 | `lib/auth.ts`, `middleware.ts`, `app/(auth)/**` |
| 8 | `app/cart`, `app/checkout`, `app/orders`, `lib/payment.ts` |
| 9 | `app/admin/**`, `__tests__/**`, `.env.example`, deployed |

---

## 3.2 Stage map

```
STAGE 0  Вэб хэрхэн ажилладаг вэ?      M0                    6 хичээл   ~3 ц    Week 0
STAGE 1  HTML + CSS                     M1 M2 M3            28 хичээл  ~18 ц    Week 1–2
STAGE 2  JavaScript                     M4 M5               22 хичээл  ~20 ц    Week 3–4
STAGE 3  React                          M6                  16 хичээл  ~16 ц    Week 5
STAGE 4  Next.js + TypeScript           M7                  12 хичээл  ~12 ц    Week 6
STAGE 5  Backend / REST API             M8                  14 хичээл  ~14 ц    Week 7
STAGE 6  PostgreSQL                     M9                  14 хичээл  ~14 ц    Week 8
STAGE 7  Authentication                 M10                 10 хичээл  ~10 ц    Week 9
STAGE 8  Сагс · Захиалга · Төлбөр       M11                 12 хичээл  ~12 ц    Week 10
STAGE 9  Admin · Чанар · Deploy         M12 M13 M14         14 хичээл  ~14 ц    Week 11–12
                                        (+ M15 Capstone)     6 хичээл   ~8 ц    Week 12
```

Each stage ends with a **Stage Checkpoint** (`checkpoint-s{n}`): one integration lesson with 4–8
tasks and no hints available for the first 15 minutes. Passing it awards the stage badge and unlocks
the next stage.

---

## 3.3 Module-by-module

Notation per lesson: `id` · **Title (MN)** · tasks · what it adds to Shop.mn · concepts.

---

### STAGE 0 — Вэб хэрхэн ажилладаг вэ?

#### **M0 — Үндэс** (6 lessons, ~18 tasks, mostly interactive diagrams + micro-tasks)

No code editor for lessons 1–3; instead **interactive visual explainers** ([14](14-design-system.md) §14.5).

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m0-l1` | Интернэт гэж юу вэ? | 2 | — | Client, server, IP, DNS. Interactive: type `shop.mn` → animate DNS → server → response |
| `m0-l2` | Browser хэрхэн ажилладаг вэ? | 3 | — | HTML → DOM → render. Interactive DOM tree builder |
| `m0-l3` | Frontend vs Backend | 2 | — | Split diagram of Shop.mn: what runs where. Drag-and-drop quiz |
| `m0-l4` | HTTP: Request ба Response | 4 | — | Method, URL, headers, body, status. Interactive request builder against a fake Shop.mn API |
| `m0-l5` | API гэж юу вэ? | 3 | — | JSON, endpoint. Student *sends* a real `GET /api/products` from a button and reads the JSON |
| `m0-l6` | Database гэж юу вэ? | 4 | — | Table, row, column, id. Visual table of Shop.mn products; student writes their first `SELECT` in PGlite |

> **Design note:** M0 must be *fun and short*. It is the highest-bounce module. Cap at 3 hours.
> A student who skips M0 loses nothing structurally — it is skippable via placement.

---

### STAGE 1 — HTML + CSS

#### **M1 — HTML: Shop.mn-ийн араг яс** (10 lessons, ~38 tasks)

| id | Title | T | Adds to Shop.mn | Concepts |
|---|---|---|---|---|
| `m1-l1` | Анхны хуудас | 3 | `index.html` with title + h1 | doctype, html/head/body, h1, title |
| `m1-l2` | Текст ба гарчиг | 4 | Hero heading + slogan | h1–h6, p, strong, em, semantics |
| `m1-l3` | Холбоос ба зураг | 4 | Logo image, nav links | a, href, img, src, alt, relative paths |
| `m1-l4` | Жагсаалт ба Navigation | 4 | Header nav (Нүүр, Ангилал, Сагс) | ul, li, nav, header |
| `m1-l5` | Бүтээгдэхүүний карт | 5 | First product card (img, name, price, button) | div, article, button, class attr |
| `m1-l6` | Бүтээгдэхүүний жагсаалт | 4 | 6 cards in a section | repetition, section, structure discipline |
| `m1-l7` | Footer ба semantic tags | 4 | Footer with contact + copyright | footer, address, semantic HTML, a11y basics |
| `m1-l8` | Дэлгэрэнгүй хуудас | 5 | `product.html` | multi-page, linking pages, page structure reuse |
| `m1-l9` | Форм: Хайлт ба бүртгэл | 5 | Search box + register form markup | form, input, label, type, placeholder, required |
| `m1-l10` | **Checkpoint S1a: Бүтэн бүтэц** | 4 | Full static skeleton, valid HTML | integration + HTML validation |

#### **M2 — CSS: Shop.mn-ийг үзэсгэлэнтэй болгох** (12 lessons, ~46 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m2-l1` | CSS холбох, өнгө | 3 | `styles/main.css`, brand colours | link rel, selectors, color, background |
| `m2-l2` | Фонт ба текстийн загвар | 4 | Typography scale (Cyrillic-safe fonts) | font-family, size, weight, line-height, letter-spacing |
| `m2-l3` | Box model | 4 | Card padding/margins | margin, padding, border, box-sizing |
| `m2-l4` | Селектор ба class | 4 | `.product-card`, `.btn` | class, id, descendant, grouping, specificity |
| `m2-l5` | Товчны загвар ба hover | 4 | Styled "Сагсанд хийх" button | :hover, :active, transition, cursor |
| `m2-l6` | Flexbox: Header | 5 | Aligned header/nav | display:flex, justify-content, align-items, gap |
| `m2-l7` | Grid: Бүтээгдэхүүний сүлжээ | 5 | Responsive product grid | display:grid, template-columns, minmax, auto-fill |
| `m2-l8` | Зураг ба aspect ratio | 3 | Consistent product images | object-fit, aspect-ratio, overflow |
| `m2-l9` | Position ба сагсны тэмдэг | 4 | Cart badge on the icon | position relative/absolute, z-index |
| `m2-l10` | Хувьсагч ба дахин ашиглалт | 4 | `:root` design tokens | CSS custom properties, reuse, naming |
| `m2-l11` | Сүүдэр, булан, animation | 4 | Card polish | box-shadow, border-radius, @keyframes, transform |
| `m2-l12` | **Checkpoint S1b: Дизайн** | 4 | Styled home page | integration, visual regression check |

#### **M3 — Responsive: Утсан дээр** (6 lessons, ~22 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m3-l1` | Viewport ба mobile-first | 3 | meta viewport, base mobile styles | viewport, mobile-first thinking |
| `m3-l2` | Media query | 4 | Tablet/desktop breakpoints | @media, breakpoints, min-width |
| `m3-l3` | Уян хатан grid | 4 | 1→2→4 column product grid | responsive grid, fr, clamp() |
| `m3-l4` | Mobile navigation | 5 | Hamburger menu (CSS-only) | checkbox hack / details, overlay, transition |
| `m3-l5` | Зураг ба гүйцэтгэл | 3 | srcset, lazy loading | performance, srcset, loading="lazy" |
| `m3-l6` | **Checkpoint S1c: Бүх төхөөрөмж** | 3 | Fully responsive static Shop.mn | multi-viewport validation |

> 🏆 **Milestone 1 — "Static Shop.mn shipped."** Share URL + ZIP + badge 🏆 First Website.

---

### STAGE 2 — JavaScript

#### **M4 — JavaScript-ийн үндэс** (14 lessons, ~52 tasks)

Every example uses Shop.mn data. Never `foo`/`bar`.

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m4-l1` | Эхний script | 3 | `js/main.js`, console | script tag, console.log, execution order |
| `m4-l2` | Хувьсагч ба төрөл | 4 | `productName`, `price` | let/const, string, number, boolean |
| `m4-l3` | Object: нэг бүтээгдэхүүн | 4 | `product` object | object literal, properties, dot/bracket access |
| `m4-l4` | Array: бүтээгдэхүүний жагсаалт | 4 | `products[]` with 8 items | array, index, length, push |
| `m4-l5` | Функц | 4 | `formatPrice()` → "₮ 129,000" | function, params, return, arrow functions |
| `m4-l6` | Нөхцөл | 4 | Stock badge (Дууссан / Үлдсэн) | if/else, comparison, &&, \|\|, ternary |
| `m4-l7` | Давталт | 4 | Loop over products | for, for...of, while |
| `m4-l8` | map, filter, find | 5 | Category filtering, product lookup | array methods, callbacks, immutability |
| `m4-l9` | reduce: нийт үнэ | 4 | Cart total | reduce, accumulator |
| `m4-l10` | DOM сонгох ба өөрчлөх | 4 | Change cart count in DOM | querySelector, textContent, classList |
| `m4-l11` | DOM үүсгэх | 5 | Render product grid from JS | createElement, append, template literals |
| `m4-l12` | Event | 5 | Click "Сагсанд хийх" | addEventListener, event object, preventDefault |
| `m4-l13` | Алдаа хайх (Debugging) | 3 | — | console, breakpoints, reading errors, try/catch |
| `m4-l14` | **Checkpoint S2a** | 4 | JS-rendered product grid | integration |

#### **M5 — Динамик Shop.mn** (8 lessons, ~34 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m5-l1` | Сагсны төлөв | 4 | `cart[]` state module | state, module pattern, single source of truth |
| `m5-l2` | Сагсанд нэмэх | 5 | `addToCart()` + badge updates | state mutation → re-render, finding existing item |
| `m5-l3` | Тоо ширхэг өөрчлөх | 5 | +/- quantity, remove | update/delete in array, guard against 0 |
| `m5-l4` | Сагсны хуудас | 5 | `cart.html` rendering + total | rendering lists, computed values |
| `m5-l5` | localStorage | 4 | Cart survives refresh | JSON.stringify/parse, localStorage, hydration |
| `m5-l6` | Хайлт ба шүүлтүүр | 5 | Live search + category filter | input events, filter, debounce, case-insensitive MN text |
| `m5-l7` | fetch ба JSON | 5 | Load products from `products.json` | fetch, promise, async/await, error handling |
| `m5-l8` | **Checkpoint S2b: Ажиллаж буй дэлгүүр** | 4 | Fully interactive vanilla-JS store | integration |

> ⚡ **Milestone 2 — "It works."** Badge ⚡ JavaScript Starter. Highest-emotion moment before deployment.

---

### STAGE 3 — React

#### **M6 — React: Дахин ашиглагдах бүрэлдэхүүн** (16 lessons, ~58 tasks)

Opens with a **bridge lesson** that refactors the student's *own* HTML into JSX side-by-side.

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m6-l1` | Яагаад React? (Bridge) | 2 | — | Problem framing: repeated DOM code; before/after diff of their own code |
| `m6-l2` | Vite + анхны component | 4 | `src/App.jsx`, project scaffold | npm, dev server, JSX, component function |
| `m6-l3` | JSX: HTML-ээс ялгаа | 4 | `Header.jsx` | className, self-closing, expressions, fragments |
| `m6-l4` | Props | 5 | `ProductCard` with props | props, destructuring, prop types by convention |
| `m6-l5` | Жагсаалт render (map + key) | 4 | `ProductGrid` | .map in JSX, key, why key matters (demo of the bug) |
| `m6-l6` | Нөхцөлт render | 4 | Out-of-stock, empty cart states | &&, ternary, early return |
| `m6-l7` | useState | 5 | Quantity selector | state, re-render model, immutable updates |
| `m6-l8` | Event ба handler | 4 | onClick add-to-cart | synthetic events, passing handlers as props |
| `m6-l9` | Форм ба controlled input | 5 | Search box as controlled input | value/onChange, controlled vs uncontrolled |
| `m6-l10` | State-ийг дээш өргөх | 5 | Cart state lifted to App | lifting state, prop drilling (felt as pain) |
| `m6-l11` | Context: Сагсны Provider | 5 | `CartContext` | createContext, Provider, useContext |
| `m6-l12` | useEffect ба fetch | 5 | Load products on mount | effects, dependency array, cleanup, loading/error states |
| `m6-l13` | Custom hook | 4 | `useCart()`, `useProducts()` | extracting logic, rules of hooks |
| `m6-l14` | React Router | 5 | `/`, `/product/:id`, `/cart` | routes, params, Link, navigation |
| `m6-l15` | Component зохион байгуулалт | 3 | Folder structure, file naming | composition, single responsibility |
| `m6-l16` | **Checkpoint S3** | 4 | React Shop.mn with cart + routing | integration |

> ⚛ Badge: React Developer.

---

### STAGE 4 — Next.js + TypeScript

#### **M7 — Next.js: Бодит фреймворк** (12 lessons, ~44 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m7-l1` | Яагаад Next.js? (Bridge) | 2 | — | SSR vs CSR, SEO, why a Mongolian shop needs server rendering |
| `m7-l2` | App Router ба хуудас | 4 | `app/page.tsx`, `app/cart/page.tsx` | file-based routing, layout.tsx, metadata |
| `m7-l3` | TypeScript: Эхний төрөл | 4 | `types/product.ts` | type, interface, annotations, why types catch bugs |
| `m7-l4` | Component-ийг type-лах | 4 | Typed props everywhere | props typing, union types, optional props |
| `m7-l5` | Server vs Client Component | 5 | Split the tree correctly | "use client", where state can live, common errors |
| `m7-l6` | Динамик route | 4 | `app/products/[id]/page.tsx` | params, generateStaticParams, notFound() |
| `m7-l7` | Server дээр өгөгдөл татах | 4 | Server-side product fetch | async components, caching, revalidate |
| `m7-l8` | Layout, loading, error | 4 | Shared layout + skeletons + error boundary | nested layouts, loading.tsx, error.tsx |
| `m7-l9` | Image ба Font оптимизац | 3 | next/image, next/font with Cyrillic | performance, CLS, subsetting |
| `m7-l10` | Хайлт ба URL төлөв | 4 | `?category=&q=` driven filtering | searchParams, URL as state |
| `m7-l11` | Хувьсагч ба орчин | 3 | `.env.local` | env vars, secrets vs public, NEXT_PUBLIC_ |
| `m7-l12` | **Checkpoint S4** | 3 | Typed Next.js Shop.mn | integration + `tsc --noEmit` must pass |

---

### STAGE 5 — Backend / REST API

#### **M8 — REST API бичих** (14 lessons, ~52 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m8-l1` | Backend гэж юу вэ? (visual) | 2 | — | Request lifecycle animation, why the browser cannot hold the truth |
| `m8-l2` | Эхний endpoint | 4 | `GET /api/products` (in-memory) | Route Handlers, Request/Response, JSON |
| `m8-l3` | Status code ба алдаа | 4 | 200/201/400/404/500 | HTTP semantics, error shape convention |
| `m8-l4` | Нэг бүтээгдэхүүн авах | 4 | `GET /api/products/:id` | dynamic params, 404 handling |
| `m8-l5` | POST ба body | 5 | `POST /api/products` | request body, parsing, 201 + Location |
| `m8-l6` | Validation | 5 | Zod schemas | input validation, error messages in MN, never trust the client |
| `m8-l7` | PUT ба DELETE | 4 | Full product CRUD | idempotency, PATCH vs PUT |
| `m8-l8` | Query params: хайлт, эрэмбэ, хуудаслалт | 5 | `?q=&sort=&page=` | filtering, pagination contract, limits |
| `m8-l9` | Frontend-ийг холбох | 5 | React talks to own API | fetch from client, loading/error, optimistic UI |
| `m8-l10` | Алдааны нэгдсэн зохион байгуулалт | 4 | `lib/errors.ts` | error middleware, typed errors, logging |
| `m8-l11` | CORS, headers, security үндэс | 3 | — | CORS, headers, why not to expose secrets |
| `m8-l12` | REST дизайн зарчим | 3 | API cleanup refactor | resource naming, nesting, versioning |
| `m8-l13` | API-г гараар тест хийх | 3 | `.http` requests / Thunder | manual testing discipline |
| `m8-l14` | **Checkpoint S5** | 4 | Complete product & category API | HTTP test suite must pass |

> 🔌 Badge: API Builder.

---

### STAGE 6 — PostgreSQL

#### **M9 — Өгөгдлийн сан** (14 lessons, ~52 tasks)

Lessons 1–7 run in **PGlite in the browser** (instant, no server). Lesson 8 onward moves to a real
Postgres instance in the sandbox.

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m9-l1` | Хүснэгт ба мөр | 4 | `products` table | CREATE TABLE, types, PK |
| `m9-l2` | INSERT ба SELECT | 4 | Seed 20 products | INSERT, SELECT, column selection |
| `m9-l3` | WHERE, ORDER BY, LIMIT | 5 | Product queries | filtering, sorting, pagination in SQL |
| `m9-l4` | UPDATE ба DELETE | 4 | Stock updates | UPDATE ... WHERE, DELETE safety |
| `m9-l5` | Холбоос: categories | 5 | `categories` + FK | FK, referential integrity, 1-N |
| `m9-l6` | JOIN | 5 | Product with category name | INNER/LEFT JOIN |
| `m9-l7` | Aggregate: борлуулалтын тоо | 5 | COUNT/SUM/AVG/GROUP BY | aggregates, HAVING |
| `m9-l8` | Бүтэн схем зохиох | 4 | orders, order_items, users, addresses | normalisation, N-N via join table |
| `m9-l9` | Prisma танилцуулга | 4 | `schema.prisma`, first migration | ORM, migrations, generate |
| `m9-l10` | Prisma query | 5 | Replace in-memory API with DB | findMany, where, select, include |
| `m9-l11` | Relation query | 5 | Orders with items and products | nested include, relation filters |
| `m9-l12` | Транзакц | 4 | Order creation atomically | `$transaction`, why partial writes are fatal |
| `m9-l13` | Index ба гүйцэтгэл | 3 | Index on `products.category_id` | EXPLAIN, index tradeoffs, N+1 problem |
| `m9-l14` | **Checkpoint S6** | 4 | DB-backed Shop.mn API | SQL + API tests |

> 🗄 Badge: Database Builder.

---

### STAGE 7 — Authentication

#### **M10 — Нэвтрэх систем** (10 lessons, ~38 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m10-l1` | Authentication vs Authorization (visual) | 2 | — | who you are vs what you may do |
| `m10-l2` | Нууц үгийг hash хийх | 4 | `users` table + bcrypt | hashing, salt, never store plaintext, timing |
| `m10-l3` | Бүртгүүлэх endpoint | 5 | `POST /api/auth/register` | validation, uniqueness, error messages |
| `m10-l4` | Нэвтрэх ба session | 5 | `POST /api/auth/login` | session vs JWT (explained), cookie flags |
| `m10-l5` | Cookie ба хамгаалалт | 4 | httpOnly secure cookie | XSS/CSRF basics, SameSite |
| `m10-l6` | Хамгаалагдсан route | 5 | `middleware.ts`, `/orders` protected | middleware, redirect, server-side session read |
| `m10-l7` | Нэвтэрсэн хэрэглэгчийн UI | 4 | Header shows name, logout | client session state, conditional UI |
| `m10-l8` | Эрх (Role): admin | 4 | `role` column + guard | RBAC, authorization checks on the server |
| `m10-l9` | Профайл ба хаяг | 5 | Profile page + addresses CRUD | user-scoped data, ownership checks |
| `m10-l10` | **Checkpoint S7** | 4 | Working auth + protected admin | auth test suite (incl. a "can user A read user B's orders?" test) |

> 🔐 Badge: Auth Master.

---

### STAGE 8 — Сагс · Захиалга · Төлбөр

#### **M11 — Худалдан авалтын урсгал** (12 lessons, ~46 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m11-l1` | Сагсыг сервер рүү | 5 | `cart`, `cart_items` tables + API | persistence, guest vs user cart merge |
| `m11-l2` | Сагсны UI-г холбох | 4 | Cart page from API | optimistic updates, rollback on error |
| `m11-l3` | Нөөц шалгах | 4 | Stock validation | server-side invariants, race conditions explained |
| `m11-l4` | Checkout форм | 5 | Address + delivery selection | multi-step forms, validation, MN address format |
| `m11-l5` | Захиалга үүсгэх | 5 | `POST /api/orders` in a transaction | order + items + stock decrement atomically |
| `m11-l6` | Захиалгын түүх | 4 | `/orders`, `/orders/[id]` | ownership, listing, empty states |
| `m11-l7` | Захиалгын төлөв | 4 | pending→paid→shipped→delivered | state machines, allowed transitions |
| `m11-l8` | Төлбөрийн сан (mock) | 5 | `lib/payment.ts` + QPay-style mock | payment flow, invoice, callback/webhook concept |
| `m11-l9` | Webhook боловсруулах | 4 | `POST /api/payments/webhook` | idempotency keys, signature verification, replay |
| `m11-l10` | Имэйл мэдэгдэл (mock) | 3 | Order confirmation | side effects, queues (conceptual) |
| `m11-l11` | Хөнгөлөлтийн код | 4 | Coupon support | business rules, edge cases, server-side price truth |
| `m11-l12` | **Checkpoint S8** | 4 | Complete purchase flow end-to-end | E2E test: browse → cart → checkout → order |

> 🛒 Badge: E-commerce Builder.

---

### STAGE 9 — Admin · Чанар · Deploy

#### **M12 — Админ самбар** (8 lessons, ~30 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m12-l1` | Админ layout ба хамгаалалт | 4 | `/admin` shell, role guard | layout groups, guarded routes |
| `m12-l2` | Бүтээгдэхүүний удирдлага | 5 | Admin product list + search | data tables, pagination, sorting |
| `m12-l3` | Бүтээгдэхүүн нэмэх/засах | 5 | Product form + image upload | forms, file upload, optimistic list update |
| `m12-l4` | Ангилал ба нөөц | 4 | Category CRUD + stock edits | nested resources |
| `m12-l5` | Захиалгын удирдлага | 5 | Order list + status change | admin actions, audit trail |
| `m12-l6` | Хэрэглэгчийн удирдлага | 3 | User list, role change | privilege escalation risks |
| `m12-l7` | Статистик самбар | 5 | Sales chart, top products, revenue | aggregate SQL, charts, date ranges |
| `m12-l8` | **Checkpoint S9a** | 3 | Working admin | integration |

#### **M13 — Чанар: Тест ба алдаа** (6 lessons, ~22 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m13-l1` | Яагаад тест бичих вэ? | 2 | — | Show a bug their own code has; then a test that catches it |
| `m13-l2` | Unit test (Vitest) | 5 | `formatPrice`, `calcTotal` tests | test/expect, arrange-act-assert |
| `m13-l3` | Component test | 5 | ProductCard, CartItem tests | Testing Library, queries, user events |
| `m13-l4` | API test | 5 | Route handler tests | integration testing, test DB |
| `m13-l5` | Алдаа хянах ба log | 3 | Error boundary + logging | observability basics |
| `m13-l6` | Гүйцэтгэл ба хүртээмж | 4 | Lighthouse pass, a11y fixes | perf budget, alt/labels/contrast/keyboard |

#### **M14 — Git ба Deploy** (6 lessons, ~24 tasks)

| id | Title | T | Adds | Concepts |
|---|---|---|---|---|
| `m14-l1` | Git үндэс | 5 | Local repo, commits | init/add/commit/log/diff, good commit messages in MN or EN |
| `m14-l2` | Branch ба merge | 4 | Feature branch workflow | branch, merge, conflict resolution (deliberate conflict) |
| `m14-l3` | GitHub | 4 | Push to their own GitHub | remote, push/pull, README with screenshots |
| `m14-l4` | Орчин ба нууц түлхүүр | 3 | `.env.example`, secrets hygiene | never commit secrets, env per environment |
| `m14-l5` | Deploy: Vercel + Neon | 5 | **Live public URL** | build, env vars, managed Postgres, migrations in CI |
| `m14-l6` | **Checkpoint S9b: Ажиллаж буй бүтээгдэхүүн** | 3 | Verified live deployment | automated check hits the student's public URL |

> 🚀 Badge: Full Stack Developer. Certificate issued.

#### **M15 — Capstone: Өөрийн онцлог** (6 lessons / ~8 h, ungraded by tests)

Prose-only specification, no starter code, no per-line hints. Student picks one:
Wishlist · Product reviews & ratings · Coupons/discount engine · Multi-vendor sellers · Delivery tracking map.

Deliverables: working feature on the live site, a short MN README section, and a 3-minute Loom-style
screen recording explaining the design. Reviewed against a rubric by AI (draft) + human (final).

---

## 3.4 Skill taxonomy (drives the progress radar)

Each task tags 1–3 skills. Skill mastery % = weighted completed tasks / total tasks for that skill.

```
html · css · responsive · javascript · dom · react · typescript · nextjs ·
api · validation · database · sql · orm · auth · security · state ·
testing · git · deployment · debugging · performance · accessibility
```

---

## 3.5 Estimated content production effort

| Artefact | Count | Effort each | Total |
|---|---|---|---|
| Lesson (MN prose + example + visual) | 142 | 3.5 h | ~500 h |
| Task (statement, starter, solution, hints ×3, checks) | 520 | 1.2 h | ~625 h |
| Interactive visual explainer | 18 | 6 h | ~110 h |
| Checkpoint test suites | 12 | 4 h | ~50 h |
| QA pass (run every task as a beginner) | — | — | ~150 h |
| **Total** | | | **≈ 1,435 h ≈ 2 authors × 5 months** |

MVP subset (Stage 0 + M1 + M2-l1..l6, 25 lessons / 95 tasks) ≈ **240 h ≈ 1 author × 6–7 weeks.**

---

*Next: [04 — Content Schema](04-content-schema.md)*
