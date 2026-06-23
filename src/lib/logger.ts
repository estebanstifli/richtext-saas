type LogLevel = "debug" | "info" | "error";

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  error: 30
};

function isEnabled() {
  return process.env.LOGGING_ENABLED !== "false";
}

function configuredLevel(): LogLevel {
  const value = process.env.LOG_LEVEL;

  if (value === "debug" || value === "info" || value === "error") {
    return value;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel) {
  return isEnabled() && levelRank[level] >= levelRank[configuredLevel()];
}

function write(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = meta === undefined ? "" : meta;
  const prefix = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;

  if (level === "error") {
    console.error(prefix, payload);
    return;
  }

  if (level === "debug") {
    console.debug(prefix, payload);
    return;
  }

  console.info(prefix, payload);
}

export const logger = {
  debug(message: string, meta?: unknown) {
    write("debug", message, meta);
  },
  info(message: string, meta?: unknown) {
    write("info", message, meta);
  },
  error(message: string, meta?: unknown) {
    write("error", message, meta);
  }
};
