"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Kbd,
  ProgressBar,
  ProgressRing,
  Separator,
  Skeleton,
  Spinner,
  Switch,
  ThemeToggle,
  useTheme,
} from "@khiye/ui";
import dev from "../dev.module.css";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={dev.section}>
      <h2 className={dev.sectionTitle}>{title}</h2>
      <div className={dev.sectionRow}>{children}</div>
    </section>
  );
}

export default function DevUiPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [on, setOn] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <div className={dev.shell}>
      <div className={dev.bar}>
        <span className={dev.barTitle}>
          UI <span className={dev.barTag}>E1 · Design system</span>
        </span>
        <div className={dev.barSpacer} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          {theme} → {resolvedTheme}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setTheme("light")}>
          Light
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setTheme("dark")}>
          Dark
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setTheme("system")}>
          System
        </Button>
        <ThemeToggle />
      </div>

      <div className={dev.gallery}>
        <div className={dev.galleryInner}>
      <Section title="Товч (Button)">
        <Button variant="primary">Шалгах</Button>
        <Button variant="secondary">Ажиллуулах</Button>
        <Button variant="ghost">Заавар</Button>
        <Button variant="danger">Устгах</Button>
        <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1200); }}>
          {loading ? "Ачааллаж байна" : "Дарж үзээрэй"}
        </Button>
        <Button disabled>Идэвхгүй</Button>
        <Button size="sm">sm</Button>
        <Button size="lg">lg</Button>
      </Section>

      <Section title="IconButton · Switch · Kbd">
        <IconButton aria-label="Тохиргоо">⚙</IconButton>
        <IconButton aria-label="Дахин ачаалах" variant="secondary">⟳</IconButton>
        <Switch checked={on} onCheckedChange={setOn} aria-label="Идэвхжүүлэх" />
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{on ? "асаалттай" : "унтраалттай"}</span>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 13 }}>
          <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
        </span>
      </Section>

      <Section title="Badge">
        <Badge tone="neutral">neutral</Badge>
        <Badge tone="accent">accent</Badge>
        <Badge tone="success">✓ амжилттай</Badge>
        <Badge tone="warning">анхаар</Badge>
        <Badge tone="danger">алдаа</Badge>
        <Badge tone="info">мэдээ</Badge>
      </Section>

      <Section title="Input">
        <Input placeholder="Имэйл хаяг" style={{ maxWidth: 240 }} />
        <Input placeholder="Буруу утга" invalid style={{ maxWidth: 240 }} />
        <Input placeholder="Идэвхгүй" disabled style={{ maxWidth: 160 }} />
      </Section>

      <Section title="Alert">
        <div style={{ display: "grid", gap: 10, width: "100%" }}>
          <Alert tone="info" title="Мэдээлэл" icon="ℹ">Preview автоматаар шинэчлэгдэнэ.</Alert>
          <Alert tone="success" title="Болсон" icon="✓">Бүх шалгалт амжилттай давлаа.</Alert>
          <Alert tone="warning" title="Анхаар" icon="⚠">Энэ даалгаврыг компьютер дээр хийвэл хялбар.</Alert>
          <Alert tone="danger" title="Алдаа" icon="✕">`products` хувьсагч `undefined` байна.</Alert>
        </div>
      </Section>

      <Section title="Progress">
        <ProgressRing value={22} />
        <ProgressRing value={72} size={72} />
        <div style={{ flex: 1, minWidth: 220, display: "grid", gap: 8 }}>
          <ProgressBar value={58} />
          <ProgressBar value={100} tone="success" />
          <ProgressBar value={40} tone="xp" />
        </div>
      </Section>

      <Section title="Card · Separator · Skeleton · Spinner">
        <Card style={{ width: 260 }}>
          <div style={{ fontWeight: 600 }}>Бүтээгдэхүүний карт</div>
          <Separator />
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <Skeleton height={80} radius={8} />
            <Skeleton width="70%" />
            <Skeleton width="40%" />
          </div>
        </Card>
        <Card interactive style={{ width: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Spinner size={18} label="Ачааллаж байна" />
            <span style={{ fontSize: 14 }}>Interactive card</span>
          </div>
        </Card>
      </Section>
        </div>
      </div>
    </div>
  );
}
