/**
 * Integration test for the atomic submit transaction. Runs only when
 * DATABASE_URL is set (CI provides a Postgres service; locally, start
 * `docker compose up -d postgres` and export DATABASE_URL). It self-provisions
 * its fixtures and cleans them up.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../client";
import { awardTaskCompletion } from "./progress";

const RUN = !!process.env.DATABASE_URL;
const sfx = Math.random().toString(36).slice(2, 8);
const id = (s: string) => `it_${s}_${sfx}`;

const userId = id("user");
const skillId = id("skill");
const courseId = id("course");
const lessonId = id("lesson");
const task1 = id("t1");
const task2 = id("t2");

describe.runIf(RUN)("awardTaskCompletion (integration)", () => {
  beforeAll(async () => {
    await prisma.skill.create({ data: { id: skillId, title: { mn: "Тест" }, order: 999 } });
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@test.mn`,
        name: "Тест",
        username: userId,
        profile: { create: {} },
      },
    });
    await prisma.course.create({
      data: {
        id: courseId,
        slug: courseId,
        title: { mn: "c" },
        description: { mn: "d" },
        level: "beginner",
        stages: {
          create: {
            id: id("stage"),
            order: 1,
            title: { mn: "s" },
            modules: {
              create: {
                id: id("mod"),
                order: 1,
                title: { mn: "m" },
                description: { mn: "d" },
                lessons: {
                  create: {
                    id: lessonId,
                    order: 1,
                    slug: "l",
                    title: { mn: "l" },
                    why: { mn: "w" },
                    tasks: {
                      create: [
                        { id: task1, order: 1, title: { mn: "t1" }, statement: { mn: "s" }, expected: {}, xp: 10, skills: [skillId] },
                        { id: task2, order: 2, title: { mn: "t2" }, statement: { mn: "s" }, expected: {}, xp: 10, skills: [skillId] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.skill.delete({ where: { id: skillId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("first pass awards first-try XP, advances progress, unlocks the next task", async () => {
    const r = await awardTaskCompletion({ userId, taskId: task1, passed: true });
    expect(r.attemptNo).toBe(1);
    expect(r.alreadyPassed).toBe(false);
    expect(r.xpAwarded).toBe(13); // 10 * 1.25 first-try
    expect(r.newTotalXp).toBe(13);
    expect(r.lessonProgress).toEqual({ tasksPassed: 1, tasksTotal: 2, completed: false });
    expect(r.unlockedNextTaskId).toBe(task2);
  });

  it("is idempotent — a second pass of the same task awards no XP", async () => {
    const r = await awardTaskCompletion({ userId, taskId: task1, passed: true });
    expect(r.alreadyPassed).toBe(true);
    expect(r.xpAwarded).toBe(0);
    const profile = await prisma.studentProfile.findUniqueOrThrow({ where: { userId } });
    expect(profile.totalXp).toBe(13);
    const ledgerForTask1 = await prisma.xpLedger.count({ where: { userId, refId: task1 } });
    expect(ledgerForTask1).toBe(1);
  });

  it("awards XP exactly once under 20 concurrent passing submits", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => awardTaskCompletion({ userId, taskId: task2, passed: true })),
    );
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBe(20); // all resolve (winners + retried-as-alreadyPassed)

    const ledgerForTask2 = await prisma.xpLedger.count({ where: { userId, refId: task2 } });
    expect(ledgerForTask2).toBe(1);

    const profile = await prisma.studentProfile.findUniqueOrThrow({ where: { userId } });
    expect(profile.totalXp).toBe(26); // 13 (task1) + 13 (task2), awarded once each
  });

  it("completing the last task marks the lesson complete", async () => {
    const lp = await prisma.lessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId, lessonId } },
    });
    expect(lp.tasksPassed).toBe(2);
    expect(lp.status).toBe("COMPLETED");
  });
});
