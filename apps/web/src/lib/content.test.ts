import { describe, expect, it } from "vitest";
import { getCourseList, getCourseMap, getLessonFull } from "@/lib/content";

/**
 * Guards the content-loading path. A production outage happened when new
 * lessons weren't reaching the serverless bundle and every course API 500'd;
 * these assertions fail loudly in CI if a course goes missing, loses lessons,
 * or a known lesson stops resolving — before it can reach a deploy. (The build
 * also guards the bundled copy in scripts/bundle-content.mjs.)
 */
describe("course content loads", () => {
  it("lists both courses", () => {
    const slugs = getCourseList().map((c) => c.slug);
    expect(slugs).toContain("internet-programming");
    expect(slugs).toContain("mobile-programming");
  });

  it.each([
    ["internet-programming", 100],
    ["mobile-programming", 120],
  ])("%s resolves with stages and >= %d lessons", (slug, min) => {
    const map = getCourseMap(slug);
    expect(map.stages.length).toBeGreaterThan(0);
    const lessons = map.stages.reduce(
      (n, st) => n + st.modules.reduce((m, mod) => m + mod.lessons.length, 0),
      0,
    );
    expect(lessons).toBeGreaterThanOrEqual(min);
  });

  it("resolves lessons across runtimes with gradable tasks", () => {
    for (const id of ["rn24-l1" /* sqlite */, "rn25-l1" /* server */, "rn27-l3" /* rn client */, "m1-l1" /* web */]) {
      const lesson = getLessonFull(id);
      expect(lesson, `lesson ${id} should resolve`).toBeTruthy();
      expect(lesson!.tasks.length, `lesson ${id} should have tasks`).toBeGreaterThan(0);
    }
  });
});
