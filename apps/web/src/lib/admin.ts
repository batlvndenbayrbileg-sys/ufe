"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const DEMO_ADMIN_KEY = "khiye:role";

/** The local "preview all lessons" flag — a demo affordance, see useIsAdmin. */
export function readDemoAdmin(): boolean {
  try {
    return localStorage.getItem(DEMO_ADMIN_KEY) === "admin";
  } catch {
    return false;
  }
}

export function setDemoAdmin(on: boolean): void {
  try {
    if (on) localStorage.setItem(DEMO_ADMIN_KEY, "admin");
    else localStorage.removeItem(DEMO_ADMIN_KEY);
  } catch {
    /* private mode — ignore */
  }
}

/**
 * True for a signed-in ADMIN, or when the local demo-admin flag is set. The
 * flag exists because a real login needs the database, which isn't available in
 * demo mode; it only unlocks the course-map UI, and every lesson is already
 * reachable by URL, so it exposes nothing a visitor couldn't already open.
 */
export function useIsAdmin(): boolean {
  const { data } = useSession();
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(readDemoAdmin()), []);
  return data?.user?.role === "ADMIN" || demo;
}
