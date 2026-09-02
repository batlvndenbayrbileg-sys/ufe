import { notFound } from "next/navigation";
import { getLessonPublic } from "@/lib/content";
import { LearnWorkspace } from "./LearnWorkspace";

export const runtime = "nodejs";

export default async function LearnPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLessonPublic(lessonId);
  if (!lesson) notFound();
  return <LearnWorkspace lesson={lesson} />;
}
