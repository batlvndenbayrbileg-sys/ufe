import "server-only";
import { errors } from "@khiye/shared";
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

/** The signed-in user's id and role, or null when signed out. */
export async function getSessionUser(): Promise<{ id: string; role: string } | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { id: user.id, role: user.role ?? "STUDENT" };
}

/**
 * Require a staff session (ADMIN or TEACHER) for a route. Throws the standard
 * error envelope (401 signed-out, 403 not-staff) so students can never read
 * another learner's data. Returns the staff user on success.
 */
export async function requireStaff(): Promise<{ id: string; role: string }> {
  const user = await getSessionUser();
  if (!user) throw errors.unauthenticated("Нэвтэрнэ үү.");
  if (user.role !== "ADMIN" && user.role !== "TEACHER") {
    throw errors.forbidden("Зөвхөн багш эсвэл админ.");
  }
  return user;
}
