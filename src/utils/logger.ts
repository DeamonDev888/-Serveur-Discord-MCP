import { botConfig } from '../config.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = botConfig.environment === 'production' ? 'info' : 'debug';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // Retirer les emojis et caractères spéciaux pour éviter les erreurs d'encodage MCP
    let cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '');

    if (args.length > 0) {
      const cleanArgs = args.map(arg => {
        if (typeof arg === 'string') {
          return arg
            .replace(/([A-Za-z0-9_-]{24,})\./g, '[TOKEN_HIDDEN].')
            .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '');
        }
        return arg;
      });
      return `${prefix} ${cleanMessage} ${JSON.stringify(cleanArgs)}\n`;
    }

    return `${prefix} ${cleanMessage}\n`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      process.stderr.write(this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      process.stderr.write(this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      process.stderr.write(this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        process.stderr.write(
          this.formatMessage('error', message) + (error.stack || error.message) + '\n'
        );
      } else {
        process.stderr.write(this.formatMessage('error', message, error));
      }
    }
  }

  // Pour les événements Discord
  logDiscordEvent(event: string, userId?: string, details?: any): void {
    const message = `Discord Event: ${event}${userId ? ` | User: ${userId}` : ''}`;
    this.debug(message, details);
  }

  // Pour les erreurs Discord
  logDiscordError(event: string, error: any, userId?: string): void {
    const message = `Discord Error in ${event}${userId ? ` | User: ${userId}` : ''}`;
    this.error(message, error);
  }
}

export const logger = Logger.getInstance();
