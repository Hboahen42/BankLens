/**
 * Lightweight structured logger for Supabase Edge Functions (Deno).
 * Outputs JSON lines — Supabase captures these in the function logs dashboard.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

const REDACT_KEYS = /(token|secret|password|authorization|cookie|account|routing)/i;

function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
    if (!meta) return undefined;
    return Object.fromEntries(
         Object.entries(meta).map(([key, value]) => [
              key,
              REDACT_KEYS.test(key) ? "[REDACTED]" : value,
         ]),
    );
}

function emit(level: LogLevel, module: string, requestId: string | undefined, msg: string, meta?: LogMeta) {
  const entry = {
    level,
    time: new Date().toISOString(),
    module,
    requestId,
    msg,
    meta: sanitizeMeta(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function createLogger(module: string, requestId?: string) {
  return {
    debug: (msg: string, meta?: LogMeta) => emit("debug", module, requestId, msg, meta),
    info:  (msg: string, meta?: LogMeta) => emit("info",  module, requestId, msg, meta),
    warn:  (msg: string, meta?: LogMeta) => emit("warn",  module, requestId, msg, meta),
    error: (msg: string, meta?: LogMeta) => emit("error", module, requestId, msg, meta),
  };
}