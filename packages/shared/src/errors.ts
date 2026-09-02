/**
 * Typed application errors and the canonical API response envelope.
 * See docs/blueprint/10-api-spec.md §10.1.
 *
 * Every error carries a `mn` message that is safe to display to a student.
 * Never leak stack traces or internal detail through `mn`.
 */

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "TASK_LOCKED"
  | "SOLUTION_LOCKED"
  | "HINT_LOCKED"
  | "PLAN_REQUIRED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNPROCESSABLE"
  | "RATE_LIMITED"
  | "SANDBOX_UNAVAILABLE"
  | "AI_UNAVAILABLE"
  | "AI_QUOTA_EXCEEDED"
  | "INTERNAL";

interface CodeMeta {
  httpStatus: number;
  /** Default Mongolian message; a call site may override it. */
  mn: string;
}

/** Default HTTP status + Mongolian copy per error code. */
const CODE_META: Record<ErrorCode, CodeMeta> = {
  VALIDATION_FAILED: { httpStatus: 400, mn: "Оруулсан мэдээлэл буруу байна." },
  UNAUTHENTICATED: { httpStatus: 401, mn: "Нэвтэрч орно уу." },
  FORBIDDEN: { httpStatus: 403, mn: "Танд энэ үйлдлийг хийх эрх алга." },
  TASK_LOCKED: {
    httpStatus: 403,
    mn: "Энэ даалгавар хараахан нээгдээгүй байна. Өмнөх даалгавраа дуусгана уу.",
  },
  SOLUTION_LOCKED: {
    httpStatus: 403,
    mn: "Хариултыг одоохондоо харах боломжгүй. Хэдэн удаа оролдоод үзээрэй.",
  },
  HINT_LOCKED: { httpStatus: 403, mn: "Эхлээд өмнөх зааврыг үзнэ үү." },
  PLAN_REQUIRED: { httpStatus: 403, mn: "Энэ хэсэг төлбөртэй багцад багтдаг." },
  NOT_FOUND: { httpStatus: 404, mn: "Олдсонгүй." },
  CONFLICT: { httpStatus: 409, mn: "Мэдээлэл зөрчилдөж байна. Дахин ачаална уу." },
  PAYLOAD_TOO_LARGE: { httpStatus: 413, mn: "Илгээсэн өгөгдөл хэт том байна." },
  UNPROCESSABLE: { httpStatus: 422, mn: "Өгөгдлийг боловсруулж чадсангүй." },
  RATE_LIMITED: {
    httpStatus: 429,
    mn: "Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.",
  },
  SANDBOX_UNAVAILABLE: {
    httpStatus: 503,
    mn: "Сервер завгүй байна. Таны буруу биш — дахин оролдоно уу.",
  },
  AI_UNAVAILABLE: {
    httpStatus: 503,
    mn: "AI туслах одоохондоо ажиллахгүй байна. Заавар болон Console чинь хэвээрээ байна.",
  },
  AI_QUOTA_EXCEEDED: {
    httpStatus: 429,
    mn: "Өнөөдрийн AI хязгаарт хүрлээ. Заавар болон форумыг ашиглаарай.",
  },
  INTERNAL: { httpStatus: 500, mn: "Систем дээр алдаа гарлаа. Дахин оролдоно уу." },
};

export interface AppErrorOptions {
  /** Overrides the code's default HTTP status. */
  httpStatus?: number;
  /** Overrides the code's default Mongolian message. */
  mn?: string;
  /** Structured, non-sensitive detail returned to the client. */
  details?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * The one error type application code should throw. Route handlers translate
 * it into the response envelope via {@link toErrorResponse}.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly mn: string;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message?: string, opts: AppErrorOptions = {}) {
    const meta = CODE_META[code];
    super(message ?? meta.mn, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = opts.httpStatus ?? meta.httpStatus;
    this.mn = opts.mn ?? meta.mn;
    this.details = opts.details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Serialisable error body (without the envelope wrapper). */
  toBody(): ErrorBody {
    return {
      code: this.code,
      message: this.message,
      mn: this.mn,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

// ── Factories for the most common cases ──────────────────────────────────────

export const errors = {
  validation(fields: Record<string, string>, mn?: string): AppError {
    return new AppError("VALIDATION_FAILED", "Validation failed", {
      mn,
      details: { fields },
    });
  },
  unauthenticated(mn?: string): AppError {
    return new AppError("UNAUTHENTICATED", "Not authenticated", { mn });
  },
  forbidden(mn?: string): AppError {
    return new AppError("FORBIDDEN", "Forbidden", { mn });
  },
  notFound(what = "Resource", mn?: string): AppError {
    return new AppError("NOT_FOUND", `${what} not found`, { mn });
  },
  taskLocked(requiredTaskId?: string): AppError {
    return new AppError("TASK_LOCKED", "Task is locked", {
      details: requiredTaskId ? { requiredTaskId } : undefined,
    });
  },
  solutionLocked(details: Record<string, unknown>): AppError {
    return new AppError("SOLUTION_LOCKED", "Solution is locked", { details });
  },
  rateLimited(retryAfterSeconds?: number): AppError {
    return new AppError("RATE_LIMITED", "Rate limited", {
      details: retryAfterSeconds ? { retryAfterSeconds } : undefined,
    });
  },
  conflict(mn?: string, details?: Record<string, unknown>): AppError {
    return new AppError("CONFLICT", "Conflict", { mn, details });
  },
  internal(cause?: unknown): AppError {
    return new AppError("INTERNAL", "Internal error", { cause });
  },
};

// ── Response envelope (docs/blueprint/10-api-spec.md §10.1) ───────────────────

export interface ResponseMeta {
  requestId: string;
  [k: string]: unknown;
}

export interface ErrorBody {
  code: ErrorCode;
  message: string;
  mn: string;
  details?: Record<string, unknown>;
}

export interface SuccessEnvelope<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ErrorEnvelope {
  error: ErrorBody;
  meta: ResponseMeta;
}

export function toSuccess<T>(data: T, requestId: string): SuccessEnvelope<T> {
  return { data, meta: { requestId } };
}

/**
 * Normalise any thrown value into an error envelope. Unknown errors become
 * INTERNAL and their detail is dropped from the client body (kept for logs).
 */
export function toErrorResponse(err: unknown, requestId: string): ErrorEnvelope {
  const appErr = isAppError(err) ? err : errors.internal(err);
  return { error: appErr.toBody(), meta: { requestId } };
}

export function httpStatusOf(err: unknown): number {
  return isAppError(err) ? err.httpStatus : 500;
}
