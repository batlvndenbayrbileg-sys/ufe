import { AuthShell } from "@khiye/ui";
import { BrandLockup } from "../BrandMark";
import { AuthAside } from "../AuthAside";
import { ForgotForm } from "./ForgotForm";
import s from "../authForm.module.css";

export const metadata = { title: "Нууц үг сэргээх · UFE ISMD" };

export default function ForgotPage() {
  return (
    <AuthShell
      aside={<AuthAside />}
      brand={<BrandLockup size={26} />}
      title="Нууц үг сэргээх"
      subtitle="Имэйл болон шинэ нууц үгээ оруулна уу."
      footer={
        <span className={s.footerText}>
          Санасан уу? <a href="/login">Нэвтрэх →</a>
        </span>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
