import type { PrismaClient } from "@prisma/client";
import { AppError } from "@khiye/shared";
import { prisma as defaultPrisma } from "../client";

export type FileSet = Record<string, { content: string; readonly?: boolean; binary?: boolean }>;

export const WORKSPACE_MAX_BYTES = 512 * 1024;
export const WORKSPACE_MAX_FILES = 200;

export function workspaceSize(files: FileSet): number {
  let bytes = 0;
  for (const f of Object.values(files)) bytes += Buffer.byteLength(f.content ?? "", "utf8");
  return bytes;
}

export function assertWorkspaceWithinLimits(files: FileSet): number {
  const count = Object.keys(files).length;
  if (count > WORKSPACE_MAX_FILES) {
    throw new AppError("PAYLOAD_TOO_LARGE", "Too many files", {
      mn: `Файлын тоо хэтэрлээ (дээд тал нь ${WORKSPACE_MAX_FILES}).`,
      details: { count, max: WORKSPACE_MAX_FILES },
    });
  }
  const bytes = workspaceSize(files);
  if (bytes > WORKSPACE_MAX_BYTES) {
    throw new AppError("PAYLOAD_TOO_LARGE", "Workspace too large", {
      mn: "Ажлын талбар хэт том байна.",
      details: { bytes, max: WORKSPACE_MAX_BYTES },
    });
  }
  return bytes;
}

export async function getWorkspace(
  userId: string,
  courseId: string,
  client: PrismaClient = defaultPrisma,
): Promise<{ files: FileSet; updatedAt: Date } | null> {
  const ws = await client.workspace.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!ws) return null;
  return { files: ws.files as FileSet, updatedAt: ws.updatedAt };
}

export async function saveWorkspace(
  userId: string,
  courseId: string,
  files: FileSet,
  client: PrismaClient = defaultPrisma,
): Promise<{ sizeBytes: number }> {
  const sizeBytes = assertWorkspaceWithinLimits(files);
  await client.workspace.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, files, sizeBytes },
    update: { files, sizeBytes },
  });
  return { sizeBytes };
}
