import { AuthShell } from "@khiye/ui";
import { BrandLockup } from "../BrandMark";
import { AuthAside } from "../AuthAside";
import { SignupForm } from "./SignupForm";
import s from "../authForm.module.css";

export const metadata = { title: "Бүртгүүлэх · UFE ISMD" };

export default function SignupPage() {
  return (
    <AuthShell
      aside={<AuthAside />}
      brand={<BrandLockup size={26} />}
      title="Бүртгэл үүсгэх"
      subtitle="Хэдхэн секундэд бүртгүүлээд эхэл."
      footer={
        <span className={s.footerText}>
          Бүртгэлтэй юу? <a href="/login">Нэвтрэх →</a>
        </span>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
