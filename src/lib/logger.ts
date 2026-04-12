import { Logger } from "next-axiom";

export type LogLevel = "debug" | "info" | "warn" | "error";

const axiom = new Logger();

export function createLogger(moduleName: string) {
  return {
    debug: (message: string, data?: unknown) =>
      axiom.debug(message, { module: moduleName, ...(data && typeof data === 'object' ? data : data !== undefined ? { data } : {}) }),
    info: (message: string, data?: unknown) =>
      axiom.info(message, { module: moduleName, ...(data && typeof data === 'object' ? data : data !== undefined ? { data } : {}) }),
    warn: (message: string, data?: unknown) =>
      axiom.warn(message, { module: moduleName, ...(data && typeof data === 'object' ? data : data !== undefined ? { data } : {}) }),
    error: (message: string, data?: unknown) =>
      axiom.error(message, { module: moduleName, ...(data && typeof data === 'object' ? data : data !== undefined ? { data } : {}) }),
    flush: () => axiom.flush(),
  };
}
