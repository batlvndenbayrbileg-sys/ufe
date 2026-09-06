/**
 * Seed: skills, achievements, one org+cohort, and 3 demo students at different
 * progress levels (docs/blueprint/18 T2.2). Idempotent (upserts).
 *
 * The REAL course content — all 84 lessons with their tasks, checks, hints and
 * solutions — is loaded from content/ by `content sync`, which lives in
 * @khiye/content-sdk (the package that may depend on @khiye/db; the reverse
 * would be a cycle). This seed only lays down a bootstrap course row so the demo
 * enrollments below have a foreign-key target; `content sync` then fills it in.
 *
 * Full local setup:
 *   pnpm --filter @khiye/db db:seed
 *   pnpm --filter @khiye/content-sdk content sync ../../content/courses/internet-programming
 * (both need DATABASE_URL)
 */
import { prisma } from "./client";
import { hashPassword } from "./auth/password";

const SKILLS: Array<{ id: string; mn: string; order: number }> = [
  { id: "html", mn: "HTML", order: 1 },
  { id: "css", mn: "CSS", order: 2 },
  { id: "responsive", mn: "Responsive", order: 3 },
  { id: "javascript", mn: "JavaScript", order: 4 },
  { id: "dom", mn: "DOM", order: 5 },
  { id: "react", mn: "React", order: 6 },
  { id: "typescript", mn: "TypeScript", order: 7 },
  { id: "nextjs", mn: "Next.js", order: 8 },
  { id: "api", mn: "API", order: 9 },
  { id: "database", mn: "Өгөгдлийн сан", order: 10 },
  { id: "sql", mn: "SQL", order: 11 },
  { id: "auth", mn: "Authentication", order: 12 },
  { id: "testing", mn: "Тест", order: 13 },
  { id: "git", mn: "Git", order: 14 },
  { id: "deployment", mn: "Deploy", order: 15 },
];

// One achievement per stage, keyed by the stage's badgeId — the same ids the
// lessons award and @khiye/web's badge labels use. Kept in stage order.
const ACHIEVEMENTS: Array<{ id: string; mn: string; desc: string; icon: string; category: string }> =
  [
    { id: "first-website", mn: "Анхны вэб", desc: "HTML + CSS шатыг дуусгаж, Shop.mn-ийн нүүрийг бүтээлээ.", icon: "🏆", category: "stage" },
    { id: "js-starter", mn: "JavaScript эхлэл", desc: "JavaScript шатыг дуусгаж, дэлгүүрээ амьд болголоо.", icon: "⚡", category: "stage" },
    { id: "react-dev", mn: "React хөгжүүлэгч", desc: "React шатыг дуусгаж, компонентоор дэлгүүр угсарлаа.", icon: "⚛️", category: "stage" },
    { id: "router-builder", mn: "Router эзэн", desc: "Олон хуудасны router-оо гараар бичлээ.", icon: "🧭", category: "stage" },
    { id: "api-caller", mn: "API холбогч", desc: "fetch-ээр API-аас өгөгдөл татаж сурлаа.", icon: "🔌", category: "stage" },
    { id: "sql-reader", mn: "SQL уншигч", desc: "Өгөгдлийн сан, SQL-ийн шатыг дуусгалаа.", icon: "🗄️", category: "stage" },
    { id: "backend-builder", mn: "Backend бүтээгч", desc: "Серверийн талыг Request → Response-оор бичлээ.", icon: "🖥️", category: "stage" },
    { id: "auth-builder", mn: "Нэвтрэлтийн эзэн", desc: "Нэвтрэлт, аюулгүй байдлын шатыг дуусгалаа.", icon: "🔐", category: "stage" },
    { id: "shipper", mn: "Deploy хийгч", desc: "Shop.mn-ийг production-д гаргахад бэлэн болголоо.", icon: "🚀", category: "stage" },
    { id: "test-writer", mn: "Тест бичигч", desc: "Өөрийн тестүүдээ бичиж, чанарыг баталгаажууллаа.", icon: "🧪", category: "stage" },
    { id: "a11y-advocate", mn: "Хүртээмжийн төлөө", desc: "Хүртээмжийн шатыг дуусгалаа.", icon: "♿", category: "stage" },
    { id: "type-safe", mn: "Type-safe", desc: "TypeScript-ээр төрлийн аюулгүй код бичлээ.", icon: "🛡️", category: "stage" },
    { id: "shop-mn-builder", mn: "Shop.mn бүтээгч", desc: "Төгсгөлийн төслийг дуусгаж, бүтэн Shop.mn-ийг бүтээлээ.", icon: "👑", category: "stage" },
  ];

async function seedSkillsAndAchievements() {
  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { id: s.id },
      create: { id: s.id, title: { mn: s.mn }, order: s.order },
      update: { title: { mn: s.mn }, order: s.order },
    });
  }
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        title: { mn: a.mn },
        description: { mn: a.desc },
        icon: a.icon,
        category: a.category,
        criteria: {},
      },
      update: { title: { mn: a.mn }, description: { mn: a.desc }, icon: a.icon },
    });
  }
}

/**
 * A bootstrap course row (id/slug/level + stage 1's first lesson and task) so
 * the demo enrollments have a foreign-key target. `content sync` (see the file
 * header) upserts the real 84-lesson content over this, keyed by the same ids.
 */
async function seedBootstrapCourse() {
  await prisma.course.upsert({
    where: { id: "ip-101" },
    create: {
      id: "ip-101",
      slug: "internet-programming",
      title: { mn: "Интернэт программчлал" },
      description: { mn: "Shop.mn-ийг эхнээс нь бүтээх." },
      level: "beginner",
      published: true,
    },
    update: {},
  });
  await prisma.stage.upsert({
    where: { id: "s1" },
    create: { id: "s1", courseId: "ip-101", order: 1, title: { mn: "HTML + CSS" }, badgeId: "first-website" },
    update: {},
  });
  await prisma.module.upsert({
    where: { id: "m1-html" },
    create: { id: "m1-html", stageId: "s1", order: 1, title: { mn: "HTML" }, description: { mn: "Shop.mn-ийн араг яс" }, estimatedHours: 3 },
    update: {},
  });
  await prisma.lesson.upsert({
    where: { id: "m1-l1" },
    create: {
      id: "m1-l1",
      moduleId: "m1-html",
      order: 1,
      slug: "first-page",
      title: { mn: "Анхны хуудас" },
      why: { mn: "Shop.mn-ийн эхний мөр." },
      skills: ["html"],
      concepts: ["doctype", "h1"],
    },
    update: {},
  });
  await prisma.task.upsert({
    where: { id: "m1-l1-t1" },
    create: {
      id: "m1-l1-t1",
      lessonId: "m1-l1",
      order: 1,
      title: { mn: "Гарчиг нэм" },
      statement: { mn: "`<h1>` дотор Shop.mn гэж бич." },
      expected: { description: { mn: "Shop.mn гарчиг харагдана." } },
      xp: 10,
      skills: ["html"],
    },
    update: {},
  });
}

async function seedDemoStudents() {
  const password = await hashPassword("Test1234");
  const demos: Array<{ username: string; name: string; xp: number; level: number; role?: "ADMIN" }> = [
    { username: "anuujin", name: "Ануужин", xp: 0, level: 1 },
    { username: "batsaikhan", name: "Батсайхан", xp: 1240, level: 5 },
    { username: "saraa", name: "Сараа", xp: 5400, level: 10 },
    // A demo admin (password: Test1234) — sees every lesson, unlocked.
    { username: "admin", name: "Админ", xp: 0, level: 1, role: "ADMIN" },
  ];
  for (const d of demos) {
    const user = await prisma.user.upsert({
      where: { email: `${d.username}@shop.mn` },
      create: {
        email: `${d.username}@shop.mn`,
        name: d.name,
        username: d.username,
        passwordHash: password,
        emailVerified: new Date(),
        ...(d.role ? { role: d.role } : {}),
        profile: {
          create: { totalXp: d.xp, level: d.level, goal: "job", hoursPerWeek: 10, onboardedAt: new Date() },
        },
      },
      update: d.role ? { role: d.role } : {},
      select: { id: true },
    });
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: "ip-101" } },
      create: { userId: user.id, courseId: "ip-101", currentLessonId: "m1-l1" },
      update: {},
    });
  }
}

async function seedOrgAndCohort() {
  const org = await prisma.organization.upsert({
    where: { id: "org-demo" },
    create: { id: "org-demo", name: "Демо их сургууль", kind: "university", seats: 60 },
    update: {},
  });
  await prisma.cohort.upsert({
    where: { joinCode: "DEMO2026" },
    create: {
      id: "cohort-demo",
      orgId: org.id,
      name: "2026 намар — IP",
      courseId: "ip-101",
      joinCode: "DEMO2026",
      startsAt: new Date(),
    },
    update: {},
  });
}

async function main() {
  await seedSkillsAndAchievements();
  await seedBootstrapCourse();
  await seedDemoStudents();
  await seedOrgAndCohort();
  console.log("✓ Seed: skills, achievements, bootstrap course, 3 demo students, 1 cohort.");
  console.log("  → run `content sync ../../content/courses/internet-programming` to load all 84 lessons.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
