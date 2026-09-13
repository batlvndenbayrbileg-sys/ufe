"use client";

import { signOut, useSession } from "next-auth/react";
import s from "./account.module.css";

/**
 * Header account affordance. Signed in → name + sign out; otherwise a link to
 * log in. Renders a blank slot while the session loads so it never flashes the
 * wrong state.
 */
export function AccountControl() {
  const { data: session, status } = useSession();

  if (status === "loading") return <span className={s.slot} aria-hidden />;

  if (session?.user) {
    const name = session.user.name || session.user.email || "Хэрэглэгч";
    return (
      <span className={s.account}>
        <span className={s.name} title={name}>
          {name}
        </span>
        <button type="button" className={s.signout} onClick={() => signOut({ callbackUrl: "/" })}>
          Гарах
        </button>
      </span>
    );
  }

  return (
    <a href="/login" className={s.loginLink}>
      Нэвтрэх
    </a>
  );
}
