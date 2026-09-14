import type { NextRequest } from "next/server";
import { errors } from "@khiye/shared";
import { resetPassword } from "@khiye/db";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reset the password for an account by e-mail. Returns a uniform response
 * whether or not the address exists, so it can't be used to probe which e-mails
 * are registered. (No mail-link step — see resetPassword's note.)
 */
export function POST(req: NextRequest) {
  return route(async () => {
    const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";
    if (!email || !password) {
      throw errors.validation({ email: "required", password: "required" }, "Имэйл болон нууц үгээ оруулна уу.");
    }
    await resetPassword(email, password);
    // Uniform success regardless of whether the account existed.
    return ok({ done: true });
  });
}
