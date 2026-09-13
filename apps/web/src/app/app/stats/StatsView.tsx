"use client";

import { useEffect, useState } from "react";
import { AppShell, Spinner, ThemeToggle } from "@khiye/ui";
import { loadProgress } from "@/lib/progress";
import { computeLocalStats, type ResolvedStats } from "@/lib/stats";
import type { CourseMapData } from "../course-types";
import { BrandLockup } from "../../BrandMark";
import { StatPanels } from "./StatPanels";
import s from "./stats.module.css";

const COURSES = ["internet-programming", "mobile-programming"];

export function StatsView() {
  const [stats, setStats] = useState<ResolvedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function localStats(): Promise<ResolvedStats> {
      const maps = await Promise.all(
        COURSES.map((slug) =>
          fetch(`/api/courses/${slug}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => (res?.data as CourseMapData | undefined) ?? null)
            .catch(() => null),
        ),
      );
      return computeLocalStats(loadProgress(), maps.filter(Boolean) as CourseMapData[]);
    }

    (async () => {
      // Prefer the server (spans devices, counts every attempt); fall back to
      // the browser's own progress when signed out or the server has no rows.
      try {
        const res = await fetch("/api/me/stats").then((r) => r.json());
        const server = res?.data?.stats as ResolvedStats | null | undefined;
        if (server && server.tasksPassed > 0) {
          if (alive) setStats(server);
          return;
        }
      } catch {
        /* fall through to local */
      }
      const local = await localStats();
      if (alive) setStats(local);
    })().finally(() => {
      if (alive) setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  const header = (
    <>
      <BrandLockup />
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <a href="/app" className={s.backLink}>
          ← Хянах самбар
        </a>
        <ThemeToggle />
      </div>
    </>
  );

  if (loading || !stats) {
    return (
      <AppShell header={header}>
        <div className={s.loading}>
          <Spinner size={24} label="Ачааллаж байна" />
          <span>Статистик ачааллаж байна…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell header={header}>
      <div className={s.pageWrap}>
        <div className={s.head}>
          <h1 className={s.title}>Миний статистик</h1>
          <p className={s.sub}>
            Онооны задаргаа, амжилтууд, даалгавар тус бүрд зарцуулсан хугацаа.
          </p>
        </div>
        <StatPanels stats={stats} />
        <p className={s.sourceNote}>
          {stats.source === "server"
            ? "Дансанд хадгалагдсан бүртгэлээс."
            : "Энэ төхөөрөмж дээрх бүртгэлээс (нэвтэрвэл бүх төхөөрөмж дээр хадгална)."}
        </p>
      </div>
    </AppShell>
  );
}
