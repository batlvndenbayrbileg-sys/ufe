/**
 * Seed: skills, achievements, one org+cohort, and 3 demo students at
 * different progress levels (docs/blueprint/18 T2.2). Idempotent (upserts).
 * Real course content is imported separately by the content pipeline (E3/E10);
 * a tiny placeholder course is seeded so the loop has something to target.
 *
 * Run: pnpm --filter @khiye/db db:seed  (requires DATABASE_URL)
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

const ACHIEVEMENTS: Array<{ id: string; mn: string; desc: string; icon: string; category: string }> =
  [
    { id: "first-website", mn: "Анхны вэб", desc: "Эхний вэб хуудсаа бүтээлээ.", icon: "🏆", category: "milestone" },
    { id: "js-starter", mn: "JavaScript эхлэл", desc: "Эхний JavaScript логикоо бичлээ.", icon: "⚡", category: "milestone" },
    { id: "ui-builder", mn: "UI бүтээгч", desc: "Загварлаг хэсэг хийлээ.", icon: "🎨", category: "milestone" },
    { id: "responsive-master", mn: "Responsive мастер", desc: "Бүх төхөөрөмжид тохирлоо.", icon: "📱", category: "milestone" },
    { id: "debugger", mn: "Дебаггер", desc: "5 удаа унасны дараа алдаагаа өөрөө зассан.", icon: "🔧", category: "behavioural" },
    { id: "independent", mn: "Бие даасан", desc: "10 даалгаврыг заавар аваагүй хийсэн.", icon: "📚", category: "behavioural" },
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

/** Minimal placeholder course so the workspace/loop has a target before E10 content lands. */
async function seedPlaceholderCourse() {
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
    create: { id: "s1", courseId: "ip-101", order: 1, title: { mn: "HTML + CSS" } },
    update: {},
  });
  await prisma.module.upsert({
    where: { id: "m1-html" },
    create: { id: "m1-html", stageId: "s1", order: 1, title: { mn: "HTML" }, description: { mn: "Shop.mn-ийн араг яс" }, estimatedHours: 6 },
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
      expected: { mn_description: "Shop.mn гарчиг харагдана." },
      xp: 10,
      skills: ["html"],
    },
    update: {},
  });
}

async function seedDemoStudents() {
  const password = await hashPassword("Test1234");
  const demos = [
    { username: "anuujin", name: "Ануужин", xp: 0, level: 1 },
    { username: "batsaikhan", name: "Батсайхан", xp: 1240, level: 5 },
    { username: "saraa", name: "Сараа", xp: 5400, level: 10 },
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
        profile: {
          create: { totalXp: d.xp, level: d.level, goal: "job", hoursPerWeek: 10, onboardedAt: new Date() },
        },
      },
      update: {},
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
  await seedPlaceholderCourse();
  await seedDemoStudents();
  await seedOrgAndCohort();
  console.log("✓ Seed complete: skills, achievements, placeholder course, 3 demo students, 1 cohort.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
