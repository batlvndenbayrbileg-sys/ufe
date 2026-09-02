import { getTranslations } from "next-intl/server";
import { AppShell, Badge, Card, ProgressRing, ThemeToggle } from "@khiye/ui";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");

  return (
    <AppShell
      header={
        <>
          <strong style={{ fontSize: 18, letterSpacing: "-0.01em" }}>{tApp("name")}</strong>
          <Badge tone="accent">E1</Badge>
          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle />
          </div>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: "68ch" }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
            margin: 0,
          }}
        >
          {t("eyebrow")}
        </p>

        <h1 style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0 }}>
          {t("title")}
        </h1>

        <p style={{ fontSize: 18, color: "var(--text-muted)", margin: 0 }}>{t("lede")}</p>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ProgressRing value={22} />
            <div>
              <div style={{ fontWeight: 600 }}>✅ {t("status")}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                {t("next")}
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="/api/health">{t("healthLink")} →</a>
          <a href="/dev/ui">Design system (/dev/ui) →</a>
        </div>

        <p style={{ marginTop: 24, color: "var(--text-subtle)", fontSize: 13 }}>{tApp("tagline")}</p>
      </div>
    </AppShell>
  );
}
