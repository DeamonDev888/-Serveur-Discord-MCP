import pino from "pino";
import path from "path";

/**
 * ============================================================================
 * SUPER-PINO LOGGER - Discord Server Edition
 * ============================================================================
 */

const REDACT_PATHS = [
  "*.password",
  "*.api_key",
  "*.token",
  "*.secret",
  "req.headers.authorization",
  "*.email",
  "db.password",
  "DISCORD_TOKEN",
];

const DEFAULT_LOG_DIR = path.join(process.cwd(), "logs");
const DEFAULT_LOG_FILE = path.join(DEFAULT_LOG_DIR, "nexus-discord.log");
const GLOBAL_LOG_PATH = "C:\\SierraChart\\ACS_Source\\BTCacsil\\logs\\nexus-discord-server.log";

function getFileTargets(): string[] {
  const raw = process.env.LOG_FILES ?? "";
  const paths = raw.split(",").map(p => p.trim()).filter(Boolean);
  const userPaths = paths.map(p => path.isAbsolute(p) ? p : path.resolve(process.cwd(), p));
  return [DEFAULT_LOG_FILE, GLOBAL_LOG_PATH, ...userPaths];
}

const fileTargets = getFileTargets();

const transport = pino.transport({
  targets: [
    {
      target: "pino-pretty",
      level: process.env.LOG_LEVEL || "debug",
      options: {
        destination: 2, 
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname,service,version",
        messageFormat: "\x1b[35m[{module}]\x1b[0m {msg}", // Magenta for Discord
        errorLikeObjectKeys: ["err", "error"],
      } as any,
    },
    ...fileTargets.map((filePath) => ({
      target: "pino-roll",
      level: process.env.LOG_LEVEL || "info",
      options: {
        file: filePath,
        frequency: "daily",
        dateFormat: "yyyy-MM-dd",
        size: "50m",
        limit: { count: 30 },
        mkdir: true,
      },
    })),
  ],
});

export const logger = pino(
  {
    name: "discord-mcp",
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: REDACT_PATHS,
      censor: "[CONFIDENTIEL]",
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    base: {
      service: "discord-mcp-server",
      version: "2.1.3",
    },
  },
  transport
);

// --- COMPATIBILITY LAYER ---
export class Logger {
  static debug(message: string, ...args: any[]) {
    logger.debug({ module: "DEBUG", args }, message);
  }
  static info(message: string, ...args: any[]) {
    logger.info({ module: "INFO", args }, message);
  }
  static warn(message: string, ...args: any[]) {
    logger.warn({ module: "WARN", args }, message);
  }
  static error(message: string, ...args: any[]) {
    logger.error({ module: "ERROR", args }, message);
  }
}

export default Logger;
