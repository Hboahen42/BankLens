import pino from "pino";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL || (isDev ? "debug" : "info");
const logtailToken = process.env.LOGTAIL_SOURCE_TOKEN;
const logtailEndpoint = process.env.LOGTAIL_INGESTING_HOST;
const logDir = path.join(process.cwd(), "logs");

type PinoTarget = {
  target: string;
  level: string;
  options: Record<string, unknown>;
};

const targets: PinoTarget[] = [
  // Always write info+ to file
  {
    target: "pino/file",
    level: "info",
    options: {
      destination: path.join(logDir, "app.log"),
      mkdir: true,
    },
  },
];

if (isDev) {
  // Pretty-print to stdout in development
  targets.push({
    target: "pino-pretty",
    level: logLevel,
    options: {
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname",
      messageFormat: "[{module}] {msg}",
      singleLine: false,
    },
  });
} else {
  // Plain JSON to stdout in production
  targets.push({
    target: "pino/file",
    level: logLevel,
    options: { destination: 1 }, // fd 1 = stdout
  });
}

// Conditionally add Better Stack (Logtail) transport
if (logtailToken) {
  const logtailOptions: Record<string, unknown> = {
    sourceToken: logtailToken,
  };
  if (logtailEndpoint) {
    logtailOptions.options = { endpoint: logtailEndpoint };
  }
  targets.push({
    target: "@logtail/pino",
    level: "info",
    options: logtailOptions,
  });
}

const transport = pino.transport({ targets });

const logger = pino(
  {
    level: logLevel,
    base: { env: process.env.NODE_ENV },
  },
  transport,
);

/**
 * Create a child logger scoped to a specific module.
 *
 * @example
 * const log = createLogger("auth");
 * log.info("User signed in", { userId });
 */
export function createLogger(module: string) {
  return logger.child({ module });
}

export default logger;