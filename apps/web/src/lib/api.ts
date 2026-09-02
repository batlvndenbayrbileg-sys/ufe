import { NextResponse } from "next/server";
import {
  httpStatusOf,
  newRequestId,
  REQUEST_ID_HEADER,
  toErrorResponse,
  toSuccess,
} from "@khiye/shared";

export function ok<T>(data: T, status = 200): NextResponse {
  const requestId = newRequestId();
  return NextResponse.json(toSuccess(data, requestId), {
    status,
    headers: { [REQUEST_ID_HEADER]: requestId },
  });
}

export function fail(err: unknown): NextResponse {
  const requestId = newRequestId();
  const status = httpStatusOf(err);
  if (status >= 500) console.error("[api]", err);
  return NextResponse.json(toErrorResponse(err, requestId), {
    status,
    headers: { [REQUEST_ID_HEADER]: requestId },
  });
}

/** Wrap a handler so any thrown AppError/Error becomes the error envelope. */
export async function route(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    return fail(e);
  }
}
