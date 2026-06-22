import pino, { type Logger, type LoggerOptions } from "pino";

export type AppLogger = Pick<Logger, "debug" | "error" | "info" | "warn">;

export function createLoggerOptions(options: LoggerOptions = {}): LoggerOptions {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    ...options,
  };
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return pino(createLoggerOptions(options));
}

export const logger = createLogger({ name: "job-hunter-agent" });
