"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

/** Client providers that must wrap the whole app (Auth.js session context). */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
