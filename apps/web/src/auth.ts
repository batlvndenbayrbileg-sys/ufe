import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateUser } from "@khiye/db";

/**
 * Auth.js (NextAuth v5) — email + password against the real user table, with a
 * JWT session (no Session-table round-trip; credentials require JWT anyway).
 *
 * SERVER ONLY: `authorize` pulls in @khiye/db (Prisma + native argon2), so this
 * module must be imported only from route handlers, server components and
 * server-only libs — never a client component. The login/signup forms talk to
 * it through `next-auth/react`'s `signIn`, which is client-safe.
 */
// Explicit types from the public NextAuthResult avoid TS2742 (pnpm can't name
// next-auth's internal inferred types across the workspace).
const result: NextAuthResult = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = typeof creds?.email === "string" ? creds.email : "";
        const password = typeof creds?.password === "string" ? creds.password : "";
        if (!email || !password) return null;
        const user = await authenticateUser(email, password);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.uid === "string") session.user.id = token.uid;
        if (typeof token.role === "string") session.user.role = token.role;
      }
      return session;
    },
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
