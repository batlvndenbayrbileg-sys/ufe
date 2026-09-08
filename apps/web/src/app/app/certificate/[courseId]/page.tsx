import { CertificateView } from "./CertificateView";

export const metadata = { title: "Гэрчилгээ · Botxon" };

export default async function CertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CertificateView courseId={courseId} />;
}
