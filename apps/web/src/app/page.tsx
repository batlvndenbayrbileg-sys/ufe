import { getTranslations } from "next-intl/server";
import { AppShell, ThemeToggle } from "@khiye/ui";
import { getCourseMap } from "@/lib/content";
import { BrandLockup } from "./BrandMark";
import s from "./home.module.css";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");

  const course = getCourseMap();
  const modules = course.stages.reduce((n, st) => n + st.modules.length, 0);
  const lessons = course.stages.reduce(
    (n, st) => n + st.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  );
  const stages = course.stages.length;

  const features = [
    { icon: "🛠️", title: t("f1Title"), body: t("f1Body") },
    { icon: "⚡", title: t("f2Title"), body: t("f2Body") },
    { icon: "✓", title: t("f3Title"), body: t("f3Body") },
  ];

  return (
    <AppShell
      header={
        <>
          <BrandLockup />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/app" className={s.ctaSecondary} style={{ padding: "7px 16px", fontSize: "var(--text-sm)" }}>
              {t("cta")} →
            </a>
            <ThemeToggle />
          </div>
        </>
      }
    >
      <div className={s.page}>
        <section className={s.hero}>
          <p className={s.eyebrow}>{t("eyebrow")}</p>
          <h1 className={s.title}>{t("title")}</h1>
          <p className={s.lede}>{t("lede")}</p>
          <div className={s.ctaRow}>
            <a href="/app" className={s.ctaPrimary}>
              {t("cta")} →
            </a>
            <a href={`/app/course/${course.slug}`} className={s.ctaSecondary}>
              {t("ctaSecondary")}
            </a>
          </div>
        </section>

        <div className={s.stats}>
          <div className={s.stat}>
            <span className={s.statNum}>{lessons}</span>
            <span className={s.statLabel}>{t("statLessons")}</span>
          </div>
          <span className={s.statDivider} aria-hidden />
          <div className={s.stat}>
            <span className={s.statNum}>{modules}</span>
            <span className={s.statLabel}>{t("statModules")}</span>
          </div>
          <span className={s.statDivider} aria-hidden />
          <div className={s.stat}>
            <span className={s.statNum}>{stages}</span>
            <span className={s.statLabel}>{t("statStages")}</span>
          </div>
        </div>

        <div className={s.features}>
          {features.map((f) => (
            <div key={f.title} className={s.feature}>
              <span className={s.featureIcon} aria-hidden>
                {f.icon}
              </span>
              <h2 className={s.featureTitle}>{f.title}</h2>
              <p className={s.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>

        <p className={s.tagline}>{tApp("tagline")}</p>
      </div>
    </AppShell>
  );
}
