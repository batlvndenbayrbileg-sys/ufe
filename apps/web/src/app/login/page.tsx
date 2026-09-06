import { Suspense } from "react";
import { AuthShell } from "@khiye/ui";
import { BrandMark } from "../BrandMark";
import { LoginForm } from "./LoginForm";
import s from "../authForm.module.css";

export const metadata = { title: "Нэвтрэх · Хийе" };

export default function LoginPage() {
  return (
    <AuthShell
      brand={
        <span className={s.brandLockup}>
          <BrandMark size={24} /> Хийе
        </span>
      }
      title="Тавтай морил"
      subtitle="Үргэлжлүүлэхийн тулд нэвтэрнэ үү."
      footer={
        <span className={s.footerText}>
          Шинэ хэрэглэгч үү? <a href="/signup">Бүртгүүлэх →</a>
        </span>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
