"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@khiye/ui";
import s from "../authForm.module.css";

type ApiError = { error?: { message?: string; mn?: string } };

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ApiError;
      setBusy(false);
      setError(body.error?.mn || body.error?.message || "Бүртгэхэд алдаа гарлаа.");
      return;
    }

    // Registered — sign straight in with the same credentials.
    const signed = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (!signed || signed.error) {
      router.push("/login");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      {error ? <div className={s.error}>{error}</div> : null}
      <label className={s.field}>
        <span className={s.label}>Нэр</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </label>
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
          autoComplete="new-password"
          required
        />
        <span className={s.hint}>Дор хаяж 8 тэмдэгт.</span>
      </label>
      <Button type="submit" className={s.submit} loading={busy} disabled={busy}>
        Бүртгүүлэх
      </Button>
    </form>
  );
}
