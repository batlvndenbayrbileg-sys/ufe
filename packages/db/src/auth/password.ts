import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing with argon2id (docs/blueprint/13-security.md §13.2).
 * Parameters: m=19 MiB, t=2, p=1. argon2id is @node-rs/argon2's default
 * algorithm; it ships prebuilt binaries, so there is no native compile step.
 */
const OPTIONS = {
  memoryCost: 19456, // KiB ≈ 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(hashString: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashString, plain, OPTIONS);
  } catch {
    return false;
  }
}

/** Minimum policy: ≥ 8 chars. Breach check (HIBP) is wired at the API layer. */
export function isPasswordAcceptable(plain: string): boolean {
  return typeof plain === "string" && plain.length >= 8;
}
