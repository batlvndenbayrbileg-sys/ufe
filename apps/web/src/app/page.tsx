import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "72px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          margin: 0,
        }}
      >
        {tApp("name")} · {t("eyebrow")}
      </p>

      <h1 style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0 }}>
        {t("title")}
      </h1>

      <p style={{ fontSize: 18, color: "var(--ink-2)", margin: 0, maxWidth: "60ch" }}>
        {t("lede")}
      </p>

      <div
        style={{
          marginTop: 8,
          padding: "14px 18px",
          background: "var(--blue-soft)",
          borderRadius: 8,
          border: "1px solid var(--rule)",
          fontSize: 15,
        }}
      >
        ✅ {t("status")}
        <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 6 }}>{t("next")}</div>
      </div>

      <p style={{ margin: 0 }}>
        <a href="/api/health">{t("healthLink")} →</a>
      </p>

      <p style={{ marginTop: 24, color: "var(--ink-3)", fontSize: 13 }}>{tApp("tagline")}</p>
    </main>
  );
}
