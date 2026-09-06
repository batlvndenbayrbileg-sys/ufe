import "server-only";
import { auth } from "@/auth";

/**
 * The current user's id from the Auth.js session, or null when signed out.
 * Signed-out visitors still get the full learning loop — the client tracks
 * progress locally — but nothing is persisted server-side for them.
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
