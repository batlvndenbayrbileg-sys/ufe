import { AuthShell } from "@khiye/ui";
import { BrandMark } from "../BrandMark";
import { SignupForm } from "./SignupForm";
import s from "../authForm.module.css";

export const metadata = { title: "Бүртгүүлэх · Хийе" };

export default function SignupPage() {
  return (
    <AuthShell
      brand={
        <span className={s.brandLockup}>
          <BrandMark size={24} /> Хийе
        </span>
      }
      title="Бүртгэл үүсгэх"
      subtitle="Shop.mn-ийг өөрөө бүтээж эхэл."
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
