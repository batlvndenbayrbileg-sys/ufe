"use client";

import { lessonProgress, type Progress } from "@/lib/progress";
import type { MapLesson } from "@/app/app/course-types";

export interface CertificateRecord {
  serial: string;
  name: string;
  issuedAt: string; // ISO date
}

/** Course completion at a glance. */
export function courseCompletion(
  lessons: MapLesson[],
  progress: Progress,
): { done: number; total: number; complete: boolean } {
  const total = lessons.length;
  const done = lessons.filter((l) => lessonProgress(l.taskIds, progress).done).length;
  return { done, total, complete: total > 0 && done === total };
}

/** A short, stable serial from a seed (djb2 → base36), e.g. KH-IP101-7F3A9K. */
export function certificateSerial(courseId: string, seed: string): string {
  let h = 5381;
  const s = `${courseId}:${seed}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  const code = h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  const tag = courseId.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase() || "KH";
  return `KH-${tag}-${code}`;
}

const key = (courseId: string) => `khiye:cert:${courseId}`;

/** The stored certificate for a course, if one was issued. */
export function loadCertificate(courseId: string): CertificateRecord | null {
  try {
    const raw = localStorage.getItem(key(courseId));
    return raw ? (JSON.parse(raw) as CertificateRecord) : null;
  } catch {
    return null;
  }
}

/**
 * Issue (or fetch) the certificate for a completed course. Idempotent: the
 * serial and issue date are minted once and kept; the name can be updated later.
 */
export function issueCertificate(courseId: string, name: string): CertificateRecord {
  const existing = loadCertificate(courseId);
  const record: CertificateRecord = existing
    ? { ...existing, name: name || existing.name }
    : {
        serial: certificateSerial(courseId, name || "khiye"),
        name,
        issuedAt: new Date().toISOString(),
      };
  try {
    localStorage.setItem(key(courseId), JSON.stringify(record));
  } catch {
    /* private mode — return the in-memory record */
  }
  return record;
}
