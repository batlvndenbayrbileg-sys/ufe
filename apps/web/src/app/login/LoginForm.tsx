"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@khiye/ui";
import s from "../authForm.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (!res || res.error) {
      setError("Имэйл эсвэл нууц үг буруу байна.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      {error ? <div className={s.error}>{error}</div> : null}
      <label className={s.field}>
        <span className={s.label}>Имэйл</span>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label className={s.field}>
        <span className={s.label}>Нууц үг</span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <div className={s.forgotRow}>
        <a href="/forgot" className={s.forgotLink}>
          Нууц үгээ мартсан уу?
        </a>
      </div>
      <Button type="submit" className={s.submit} loading={busy} disabled={busy}>
        Нэвтрэх
      </Button>
    </form>
  );
}
