export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  function: string;
  message: string;
  data?: Record<string, unknown>;
}

export function createLogger(fnName: string) {
  function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      function: fnName,
      message,
      ...(data ? { data } : {}),
    };
    const output = JSON.stringify(entry);
    if (level === "ERROR" || level === "WARN") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (message: string, data?: Record<string, unknown>) => log("DEBUG", message, data),
    info:  (message: string, data?: Record<string, unknown>) => log("INFO",  message, data),
    warn:  (message: string, data?: Record<string, unknown>) => log("WARN",  message, data),
    error: (message: string, data?: Record<string, unknown>) => log("ERROR", message, data),
  };
}
