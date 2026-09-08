import { Suspense } from "react";
import { AuthShell } from "@khiye/ui";
import { BrandMark } from "../BrandMark";
import { LoginForm } from "./LoginForm";
import { DemoAdminButton } from "./DemoAdminButton";
import s from "../authForm.module.css";

export const metadata = { title: "Нэвтрэх · Botxon" };

export default function LoginPage() {
  return (
    <AuthShell
      brand={
        <span className={s.brandLockup}>
          <BrandMark size={24} /> Botxon
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
      <div className={s.demoRow}>
        <span className={s.orDivider}>эсвэл</span>
        <DemoAdminButton />
        <span className={s.hint}>Өгөгдлийн сан холбогдоогүй демо орчинд бүх хичээлийг үзэх.</span>
      </div>
    </AuthShell>
  );
}
