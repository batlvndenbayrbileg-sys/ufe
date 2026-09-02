import { describe, expect, it } from "vitest";
import { hashPassword, isPasswordAcceptable, verifyPassword } from "./password";

describe("password hashing (argon2id)", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("Test1234!");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, "Test1234!")).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("Test1234!");
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("never stores plaintext (hash differs from input, salted)", async () => {
    const a = await hashPassword("samePassword1");
    const b = await hashPassword("samePassword1");
    expect(a).not.toContain("samePassword1");
    expect(a).not.toBe(b); // random salt → different hashes
  });

  it("verify does not throw on a malformed hash", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });

  it("enforces the minimum length policy", () => {
    expect(isPasswordAcceptable("short")).toBe(false);
    expect(isPasswordAcceptable("longenough")).toBe(true);
  });
}, 20_000);
