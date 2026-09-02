import "server-only";

/**
 * Resolve the current user id from the session. Returns null in the MVP demo
 * (no auth wired yet). Full Auth.js/NextAuth wiring is the E7 auth follow-up —
 * once present, submit/hint/solution persist through the E2 transaction.
 */
export async function getSessionUserId(): Promise<string | null> {
  return null;
}
