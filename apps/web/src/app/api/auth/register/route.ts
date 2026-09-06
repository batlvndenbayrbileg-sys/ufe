import type { NextRequest } from "next/server";
import { registerUser } from "@khiye/db";
import { errors } from "@khiye/shared";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create a student account. The client then signs in with the same credentials
 * (Auth.js Credentials provider) — we don't return a session here.
 */
export function POST(req: NextRequest) {
  return route(async () => {
    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
    };
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw errors.validation({ name: "required" }, "Нэрээ оруулна уу.");

    const user = await registerUser({ email, password, name });
    return ok({ id: user.id, username: user.username }, 201);
  });
}
