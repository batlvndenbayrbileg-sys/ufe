import { getTranslations } from "next-intl/server";
import { Hammer, Zap, ShieldCheck, BookOpen, PenLine, Languages, ArrowRight } from "lucide-react";
import { AppShell, ThemeToggle } from "@khiye/ui";
import { getCourseMap } from "@/lib/content";
import { BrandLockup } from "./BrandMark";
import { AccountControl } from "./AccountControl";
import { HandwritingText } from "./HandwritingText";
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
    { Icon: Hammer, title: t("f1Title"), body: t("f1Body") },
    { Icon: Zap, title: t("f2Title"), body: t("f2Body") },
    { Icon: ShieldCheck, title: t("f3Title"), body: t("f3Body") },
    { Icon: BookOpen, title: t("f4Title"), body: t("f4Body") },
    { Icon: PenLine, title: t("f5Title"), body: t("f5Body") },
    { Icon: Languages, title: t("f6Title"), body: t("f6Body") },
  ];

  const products = [
    { name: "Монгол дээл", price: "₮129,000" },
    { name: "Малгай", price: "₮45,000" },
    { name: "Гутал", price: "₮89,000" },
    { name: "Цамц", price: "₮39,000" },
  ];

  return (
    <AppShell
      header={
        <>
          <BrandLockup />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <AccountControl />
            <ThemeToggle />
          </div>
        </>
      }
    >
      <div className={s.page}>
        <section className={s.hero}>
          <div className={s.heroText}>
            <p className={s.eyebrow}>{t("eyebrow")}</p>
            <h1 className={s.title}>{t("title")}</h1>
            {/* A hand-signed accent — the store you build. The bundled font is
                Latin-only, so this stays "Shop.mn". */}
            <HandwritingText
              text="Shop.mn"
              className={s.heroInk}
              height="1.5em"
              duration={1.9}
              strokeWidth={2}
            />
            <p className={s.lede}>{t("lede")}</p>
            <div className={s.ctaRow}>
              <a href="/app" className={s.ctaPrimary}>
                {t("cta")} <ArrowRight size={18} strokeWidth={2.4} />
              </a>
              <a href={`/app/course/${course.slug}`} className={s.ctaSecondary}>
                {t("ctaSecondary")}
              </a>
            </div>
          </div>

          {/* What you build: a mock of the Shop.mn store the course produces. */}
          <div className={s.heroMockWrap} aria-hidden>
            <span className={s.buildBadge}>{t("buildLabel")}</span>
            <div className={s.mock}>
              <div className={s.mockBar}>
                <span className={s.mockDot} data-c="r" />
                <span className={s.mockDot} data-c="y" />
                <span className={s.mockDot} data-c="g" />
                <span className={s.mockUrl}>shop.mn</span>
              </div>
              <div className={s.mockBody}>
                <div className={s.mockBrand}>Shop.mn</div>
                <div className={s.mockGrid}>
                  {products.map((p) => (
                    <div key={p.name} className={s.mockCard}>
                      <span className={s.mockThumb} />
                      <span className={s.mockName}>{p.name}</span>
                      <span className={s.mockPrice}>{p.price}</span>
                      <span className={s.mockBtn}>Сагслах</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

        {/* The journey: every stage from the first tag to the finished app. */}
        <section className={s.journey}>
          <p className={s.eyebrow}>{t("journeyEyebrow")}</p>
          <h2 className={s.sectionTitle}>{t("journeyTitle")}</h2>
          <p className={s.sectionLede}>{t("journeyLede")}</p>
          <ol className={s.roadmap}>
            {course.stages.map((st) => (
              <li key={st.order} className={s.step}>
                <span className={s.stepNum}>{st.order}</span>
                <span className={s.stepTitle}>{st.title.mn}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className={s.features}>
          {features.map((f) => (
            <div key={f.title} className={s.feature}>
              <span className={s.featureIcon} aria-hidden>
                <f.Icon size={22} strokeWidth={2} />
              </span>
              <h2 className={s.featureTitle}>{f.title}</h2>
              <p className={s.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>

        <section className={s.closeBand}>
          <h2 className={s.closeTitle}>{t("closeTitle")}</h2>
          <p className={s.closeBody}>{t("closeBody")}</p>
          <a href="/app" className={s.ctaPrimary}>
            {t("cta")} <ArrowRight size={18} strokeWidth={2.4} />
          </a>
        </section>

        <p className={s.tagline}>{tApp("tagline")}</p>
      </div>
    </AppShell>
  );
}
