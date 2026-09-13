"use client";

import { useSession } from "next-auth/react";

/**
 * True only for a signed-in ADMIN user (role from the JWT session). Students see
 * the normal, progress-gated course. There is no demo/localStorage admin bypass.
 */
export function useIsAdmin(): boolean {
  const { data } = useSession();
  return data?.user?.role === "ADMIN";
}
