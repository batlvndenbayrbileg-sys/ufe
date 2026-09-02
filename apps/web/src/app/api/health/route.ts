import { NextResponse } from "next/server";
import { newRequestId, REQUEST_ID_HEADER, toSuccess } from "@khiye/shared";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. Also the reference implementation of the API
 * response envelope + X-Request-Id header (docs/blueprint/10-api-spec.md §10.1).
 */
export function GET() {
  const requestId = newRequestId();
  const body = toSuccess(
    {
      status: "ok",
      service: "khiye-web",
      version: process.env.npm_package_version ?? "0.1.0",
      time: new Date().toISOString(),
    },
    requestId,
  );
  return NextResponse.json(body, {
    headers: { [REQUEST_ID_HEADER]: requestId },
  });
}
