"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@khiye/ui";
import s from "../authForm.module.css";

export function ForgotForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Нууц үг дор хаяж 8 тэмдэгт байх ёстой.");
      return;
    }
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1600);
  }

  if (done) {
    return (
      <div className={s.form}>
        <div className={s.success}>
          Нууц үг шинэчлэгдлээ. Шинэ нууц үгээрээ нэвтэрнэ үү…
        </div>
        <a href="/login" className={s.forgotLink} style={{ textAlign: "center" }}>
          Нэвтрэх хуудас руу →
        </a>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      {error ? <div className={s.error}>{error}</div> : null}
      <label className={s.field}>
        <span className={s.label}>Имэйл</span>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label className={s.field}>
        <span className={s.label}>Шинэ нууц үг</span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <span className={s.hint}>Дор хаяж 8 тэмдэгт.</span>
      </label>
      <label className={s.field}>
        <span className={s.label}>Нууц үг давтах</span>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <Button type="submit" className={s.submit} loading={busy} disabled={busy}>
        Нууц үг шинэчлэх
      </Button>
    </form>
  );
}
