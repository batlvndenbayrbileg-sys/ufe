import type { PrismaClient, User } from "@prisma/client";
import { AppError, errors } from "@khiye/shared";
import { prisma as defaultPrisma } from "../client";
import { hashPassword, isPasswordAcceptable, verifyPassword } from "./password";

/** ASCII slug for a username/URL, derived from a (possibly Cyrillic) name. */
export function slugifyUsername(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
    и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
    ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return (
    input
      .toLowerCase()
      .split("")
      .map((c) => map[c] ?? c)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user"
  );
}

async function uniqueUsername(base: string, client: PrismaClient): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 100; i++) {
    const exists = await client.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!exists) return candidate;
    candidate = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  username?: string;
  locale?: string;
}

/** Create a STUDENT account with a hashed password and an empty profile. */
export async function registerUser(
  input: RegisterInput,
  client: PrismaClient = defaultPrisma,
): Promise<User> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw errors.validation({ email: "invalid" }, "Имэйл хаяг буруу байна.");
  }
  if (!isPasswordAcceptable(input.password)) {
    throw errors.validation({ password: "too_short" }, "Нууц үг дор хаяж 8 тэмдэгт байх ёстой.");
  }
  const existing = await client.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new AppError("CONFLICT", "Email already registered", {
      mn: "Энэ имэйл аль хэдийн бүртгэлтэй байна.",
      details: { field: "email" },
    });
  }
  const username = await uniqueUsername(
    input.username ? slugifyUsername(input.username) : slugifyUsername(input.name),
    client,
  );
  const passwordHash = await hashPassword(input.password);
  return client.user.create({
    data: {
      email,
      name: input.name.trim(),
      username,
      passwordHash,
      locale: input.locale ?? "mn",
      profile: { create: {} },
    },
  });
}

/**
 * Set a new password for the account with this email. Returns true if an active
 * account was updated, false if no such account exists.
 *
 * NOTE: there is no e-mail-link verification step (no mail provider is wired),
 * so this trusts the requester. That is acceptable for a small, trusted cohort;
 * when a mail provider is added, gate this behind a one-time token sent to the
 * address instead.
 */
export async function resetPassword(
  email: string,
  newPassword: string,
  client: PrismaClient = defaultPrisma,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!isPasswordAcceptable(newPassword)) {
    throw errors.validation({ password: "too_short" }, "Нууц үг дор хаяж 8 тэмдэгт байх ёстой.");
  }
  const user = await client.user.findUnique({
    where: { email: normalized },
    select: { id: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return false;
  await client.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  return true;
}

/** Verify email+password. Returns the user on success, null otherwise. */
export async function authenticateUser(
  email: string,
  password: string,
  client: PrismaClient = defaultPrisma,
): Promise<User | null> {
  const user = await client.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user?.passwordHash) return null;
  if (user.status !== "ACTIVE") return null;
  const ok = await verifyPassword(user.passwordHash, password);
  return ok ? user : null;
}
