/**
 * Minimal structured logger. Emits one JSON object per line (parseable by any
 * log pipeline) and supports request-scoped child loggers that carry a
 * requestId and other bound fields. No third-party dependency.
 * See docs/blueprint/11-system-architecture.md §11 and 08-dashboards.md.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Returns a new logger that includes `bound` on every line. */
  child(bound: LogFields): Logger;
}

interface LoggerConfig {
  level: LogLevel;
  base: LogFields;
  /** Sink; defaults to stdout/stderr as JSON. Injectable for tests. */
  write: (level: LogLevel, line: string) => void;
  /** Pretty (dev) vs JSON (prod). */
  pretty: boolean;
}

function defaultWrite(level: LogLevel, line: string): void {
  if (level === "error" || level === "warn") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

/** Convert an Error (or AppError-like) into a serialisable field object. */
function serializeError(err: unknown): LogFields {
  if (err instanceof Error) {
    const out: LogFields = { name: err.name, message: err.message };
    if ("code" in err) out.code = (err as { code: unknown }).code;
    if ("httpStatus" in err) out.httpStatus = (err as { httpStatus: unknown }).httpStatus;
    if (err.stack) out.stack = err.stack;
    return out;
  }
  return { message: String(err) };
}

function normalizeFields(fields?: LogFields): LogFields {
  if (!fields) return {};
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = v instanceof Error ? serializeError(v) : v;
  }
  return out;
}

function create(cfg: LoggerConfig): Logger {
  const emit = (level: LogLevel, msg: string, fields?: LogFields): void => {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[cfg.level]) return;
    const record = {
      level,
      time: new Date().toISOString(),
      msg,
      ...cfg.base,
      ...normalizeFields(fields),
    };
    if (cfg.pretty) {
      const boundStr = Object.entries({ ...cfg.base, ...normalizeFields(fields) })
        .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join(" ");
      cfg.write(level, `[${level.toUpperCase()}] ${msg}${boundStr ? " · " + boundStr : ""}`);
    } else {
      cfg.write(level, JSON.stringify(record));
    }
  };

  return {
    debug: (m, f) => emit("debug", m, f),
    info: (m, f) => emit("info", m, f),
    warn: (m, f) => emit("warn", m, f),
    error: (m, f) => emit("error", m, f),
    child: (bound) => create({ ...cfg, base: { ...cfg.base, ...bound } }),
  };
}

export interface CreateLoggerOptions {
  level?: LogLevel;
  base?: LogFields;
  pretty?: boolean;
  write?: (level: LogLevel, line: string) => void;
}

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const isProd = process.env.NODE_ENV === "production";
  return create({
    level: opts.level ?? (isProd ? "info" : "debug"),
    base: opts.base ?? {},
    pretty: opts.pretty ?? !isProd,
    write: opts.write ?? defaultWrite,
  });
}

/** Process-wide default logger. Prefer a request-scoped `.child({ requestId })`. */
export const logger: Logger = createLogger({ base: { service: "khiye" } });
