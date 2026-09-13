import { CourseIntro } from "./CourseIntro";

export default async function CourseIntroPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CourseIntro courseId={courseId} />;
}
