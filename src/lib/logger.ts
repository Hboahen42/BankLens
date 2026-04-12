export type LogLevel = "debug" | "info" | "warn" | "error";

const IS_DEV = process.env.NODE_ENV === "development";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

function emit(entry: LogEntry) {
  const { level, module, message, data, timestamp } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;

  if (!IS_DEV && level === "debug") return; // suppress debug in production

  const args = data !== undefined ? [prefix, message, data] : [prefix, message];

  switch (level) {
    case "debug":
      console.debug(...args);
      break;
    case "info":
      console.info(...args);
      break;
    case "warn":
      console.warn(...args);
      break;
    case "error":
      console.error(...args);
      break;
  }
}

export function createLogger(moduleName: string) {
  function log(level: LogLevel, message: string, data?: unknown) {
    emit({
      timestamp: new Date().toISOString(),
      level,
      module: moduleName,
      message,
      data,
    });
  }

  return {
    debug: (message: string, data?: unknown) => log("debug", message, data),
    info:  (message: string, data?: unknown) => log("info",  message, data),
    warn:  (message: string, data?: unknown) => log("warn",  message, data),
    error: (message: string, data?: unknown) => log("error", message, data),
  };
}
