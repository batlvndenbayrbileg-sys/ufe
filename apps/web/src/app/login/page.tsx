import { Suspense } from "react";
import { AuthShell } from "@khiye/ui";
import { BrandLockup } from "../BrandMark";
import { AuthAside } from "../AuthAside";
import { LoginForm } from "./LoginForm";
import s from "../authForm.module.css";

export const metadata = { title: "Нэвтрэх · UFE ISMD" };

export default function LoginPage() {
  return (
    <AuthShell
      aside={<AuthAside />}
      brand={<BrandLockup size={26} />}
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
