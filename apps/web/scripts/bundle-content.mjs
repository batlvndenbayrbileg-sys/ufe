// Bundle all course content into a single JSON that the web app imports
// STATICALLY (see src/lib/content.ts). The app reads content from disk at
// runtime, but Next's serverless file tracer can't infer the dynamic
// `modules/${id}.json` / `lessons/${id}.json` paths, so some Vercel
// deployments ship without the files and every course API 500s. Importing a
// generated bundle puts the content in the JS graph, so it is present in every
// function instance deterministically. This mirrors loadCourse()'s resolution
// exactly (stages → modules → lessons, same sort) but with plain fs at build
// time. Run in the web `dev` and `build` scripts; output is gitignored.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(appDir, "..", "..", "content", "courses");
const SLUGS = ["internet-programming", "mobile-programming"];

const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));

const bundle = {};
for (const slug of SLUGS) {
  const dir = join(contentRoot, slug);
  if (!existsSync(join(dir, "course.json"))) continue;
  const course = readJson(join(dir, "course.json"));
  const skills = existsSync(join(dir, "skills.json")) ? readJson(join(dir, "skills.json")) : [];
  const stages = course.stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const moduleObjects = stage.moduleIds.map((moduleId) => {
        const mod = readJson(join(dir, "modules", `${moduleId}.json`));
        const lessonObjects = mod.lessons
          .map((lessonId) => readJson(join(dir, "lessons", `${lessonId}.json`)))
          .sort((a, b) => a.order - b.order);
        return { ...mod, lessonObjects };
      });
      return { ...stage, moduleObjects };
    });
  bundle[slug] = { ...course, stages, skills };
}

// GUARD: a missing or short course must FAIL the build — never ship a bundle
// that would 500 at runtime. This turns "content not bundled" from a silent
// production outage into a loud build error.
const EXPECT_MIN_LESSONS = { "internet-programming": 100, "mobile-programming": 120 };
for (const [slug, min] of Object.entries(EXPECT_MIN_LESSONS)) {
  const c = bundle[slug];
  if (!c) throw new Error(`bundle-content: required course "${slug}" is missing from the bundle`);
  let lessons = 0;
  for (const st of c.stages)
    for (const mo of st.moduleObjects)
      for (const l of mo.lessonObjects) {
        lessons += 1;
        if (!Array.isArray(l.tasks) || l.tasks.length === 0)
          throw new Error(`bundle-content: lesson "${l.id}" has no gradable tasks`);
      }
  if (lessons < min)
    throw new Error(`bundle-content: course "${slug}" bundled only ${lessons} lessons (< ${min}) — content is incomplete`);
}

const out = join(appDir, "src", "content.bundle.generated.json");
writeFileSync(out, JSON.stringify(bundle));
const counts = Object.entries(bundle).map(
  ([s, c]) => `${s}: ${c.stages.length} stages, ${c.stages.reduce((n, st) => n + st.moduleObjects.reduce((m, mo) => m + mo.lessonObjects.length, 0), 0)} lessons`,
);
console.log("bundled content →", out, "\n ", counts.join("\n  "));
