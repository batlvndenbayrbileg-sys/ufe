"use client";

import { useEffect, useState } from "react";
import { LockOpen } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { readDemoAdmin, setDemoAdmin } from "@/lib/admin";
import s from "./account.module.css";

/**
 * Header account affordance. Signed in → name + sign out; the local demo-admin
 * mode → an "Админ (демо)" tag + exit; otherwise a link to log in. Renders a
 * blank slot while the session loads so it never flashes the wrong state.
 */
export function AccountControl() {
  const { data: session, status } = useSession();
  const [demoAdmin, setDemo] = useState(false);
  useEffect(() => setDemo(readDemoAdmin()), []);

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

  if (demoAdmin) {
    return (
      <span className={s.account}>
        <span className={s.name}>
          <LockOpen size={13} strokeWidth={2.4} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          Админ (демо)
        </span>
        <button
          type="button"
          className={s.signout}
          onClick={() => {
            setDemoAdmin(false);
            window.location.href = "/";
          }}
        >
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
