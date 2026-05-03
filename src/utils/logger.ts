const isDev = __DEV__;

type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, tag: string, message: string, data?: unknown) {
  if (!isDev && level === "debug") return;
  const prefix = `[AlHassan][${tag}]`;
  if (level === "error") {
    console.error(prefix, message, data ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, data ?? "");
  } else {
    console.log(prefix, message, data ?? "");
  }
}

export const logger = {
  info: (tag: string, message: string, data?: unknown) => log("info", tag, message, data),
  warn: (tag: string, message: string, data?: unknown) => log("warn", tag, message, data),
  error: (tag: string, message: string, data?: unknown) => log("error", tag, message, data),
  debug: (tag: string, message: string, data?: unknown) => log("debug", tag, message, data),
};
