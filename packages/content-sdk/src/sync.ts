import { prisma, type Prisma } from "@khiye/db";
import type { CourseBundle } from "./build";
import type { Lesson } from "./schema";

/**
 * Upsert a course bundle into Postgres. Course/stage/module metadata first,
 * then each lesson (with its tasks, checks, hints, solution) in its OWN
 * transaction — idempotent, so re-running is safe (§4.6). Child rows
 * (checks/hints/solution) are replaced to keep them in sync with content.
 */
export async function syncBundle(bundle: CourseBundle): Promise<{ lessons: number }> {
  await prisma.course.upsert({
    where: { id: bundle.course.id },
    create: {
      id: bundle.course.id,
      slug: bundle.course.slug,
      title: bundle.course.title,
      description: bundle.course.description,
      level: bundle.course.level,
      published: true,
    },
    update: {
      slug: bundle.course.slug,
      title: bundle.course.title,
      description: bundle.course.description,
      level: bundle.course.level,
    },
  });

  for (const stage of bundle.stages) {
    await prisma.stage.upsert({
      where: { id: stage.id },
      create: { id: stage.id, courseId: bundle.course.id, order: stage.order, title: stage.title, badgeId: stage.badgeId },
      update: { order: stage.order, title: stage.title, badgeId: stage.badgeId },
    });
    for (const mod of stage.modules) {
      await prisma.module.upsert({
        where: { id: mod.id },
        create: {
          id: mod.id,
          stageId: stage.id,
          order: mod.order,
          title: mod.title,
          description: mod.description,
          estimatedHours: mod.estimatedHours,
        },
        update: { stageId: stage.id, order: mod.order, title: mod.title, description: mod.description, estimatedHours: mod.estimatedHours },
      });
    }
  }

  for (const lesson of bundle.lessons) {
    await syncLesson(lesson);
  }

  return { lessons: bundle.lessons.length };
}

async function syncLesson(lesson: Lesson): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.lesson.upsert({
      where: { id: lesson.id },
      create: lessonData(lesson),
      update: lessonData(lesson),
    });

    for (const task of lesson.tasks) {
      await tx.task.upsert({
        where: { id: task.id },
        create: {
          id: task.id,
          lessonId: lesson.id,
          order: task.order,
          title: task.title,
          statement: task.statement,
          requirements: task.requirements ?? undefined,
          expected: task.expected,
          starterPatch: task.starter ?? [],
          targetFile: task.targetFile,
          marker: task.marker,
          checkMode: task.checkMode,
          passThreshold: task.passThreshold,
          xp: task.xp,
          estimatedMinutes: task.estimatedMinutes,
          skills: task.skills,
          allowSkip: task.allowSkip,
        },
        update: {
          order: task.order,
          title: task.title,
          statement: task.statement,
          requirements: task.requirements ?? undefined,
          expected: task.expected,
          starterPatch: task.starter ?? [],
          targetFile: task.targetFile,
          marker: task.marker,
          checkMode: task.checkMode,
          passThreshold: task.passThreshold,
          xp: task.xp,
          estimatedMinutes: task.estimatedMinutes,
          skills: task.skills,
          allowSkip: task.allowSkip,
        },
      });

      // Replace children to stay in sync with content.
      await tx.check.deleteMany({ where: { taskId: task.id } });
      await tx.check.createMany({
        data: task.checks.map((c, i) => ({
          taskId: task.id,
          key: c.id,
          type: c.type,
          args: c.args as Prisma.InputJsonValue,
          onFail: c.onFail as Prisma.InputJsonValue,
          onPass: (c.onPass ?? undefined) as Prisma.InputJsonValue | undefined,
          weight: c.weight,
          hidden: c.hidden,
          order: i,
        })),
      });

      await tx.hint.deleteMany({ where: { taskId: task.id } });
      await tx.hint.createMany({
        data: task.hints.map((h) => ({
          taskId: task.id,
          level: h.level,
          text: h.text,
          code: h.code,
          xpCost: h.xpCost,
        })),
      });

      await tx.solution.upsert({
        where: { taskId: task.id },
        create: { taskId: task.id, patch: task.solution.patch, explanation: task.solution.explanation, xpPenalty: task.solution.xpPenalty },
        update: { patch: task.solution.patch, explanation: task.solution.explanation, xpPenalty: task.solution.xpPenalty },
      });
    }
  });
}

function lessonData(lesson: Lesson) {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    order: lesson.order,
    slug: lesson.slug,
    title: lesson.title,
    why: lesson.why,
    buildsInProject: lesson.buildsInProject,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    skills: lesson.skills,
    concepts: lesson.concepts,
    prerequisites: lesson.prerequisites,
    executionTier: lesson.execution.tier,
    runtime: lesson.execution.runtime,
    mobileFriendly: lesson.mobileFriendly,
    completionXp: lesson.completion.xp,
    badgeId: lesson.completion.badge,
    isCheckpoint: /checkpoint/i.test(lesson.slug),
  };
}
