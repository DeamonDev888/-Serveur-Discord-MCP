import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin absolu vers le fichier de log à la racine du projet
const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');

// S'assurer que le répertoire de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Flags pour éviter les boucles infinies de logs
let isLoggingInternal = false;
let isStderrBroken = false;
let isFileBroken = false;

class Logger {
  private static readonly MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
  private static readonly MAX_LOG_FILES = 5;

  private static rotateLogs() {
    try {
      if (!fs.existsSync(LOG_FILE)) return;

      const stats = fs.statSync(LOG_FILE);
      if (stats.size < this.MAX_LOG_SIZE) return;

      // Supprimer le plus vieux log
      const oldestLog = `${LOG_FILE}.${this.MAX_LOG_FILES}`;
      if (fs.existsSync(oldestLog)) {
        fs.unlinkSync(oldestLog);
      }

      // Décaler les logs existants
      for (let i = this.MAX_LOG_FILES - 1; i >= 1; i--) {
        const currentLog = `${LOG_FILE}.${i}`;
        const nextLog = `${LOG_FILE}.${i + 1}`;
        if (fs.existsSync(currentLog)) {
          fs.renameSync(currentLog, nextLog);
        }
      }

      // Renommer le log actuel
      fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    } catch (err) {
      // Ignorer les erreurs de rotation
    }
  }

  private static logToFile(level: LogLevel, message: string, ...args: any[]) {
    if (isFileBroken || isLoggingInternal) return;

    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? '\n' + JSON.stringify(args, null, 2) : '';
    const logLine = `[${timestamp}] [${level}] ${message}${formattedArgs}\n`;

    isLoggingInternal = true;
    try {
      this.rotateLogs();
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
      // Ne pas écrire sur stderr pour éviter les boucles EPIPE si stderr est aussi cassé
      // Marquer le fichier comme cassé pour éviter de réessayer en boucle
      isFileBroken = true;
    } finally {
      isLoggingInternal = false;
    }
  }

  private static logToStderr(level: LogLevel, message: string, ...args: any[]) {
    if (isStderrBroken || isLoggingInternal) return;

    isLoggingInternal = true;
    try {
      const timestamp = new Date().toLocaleTimeString();
      const color = this.getColor(level);
      const reset = '\x1b[0m';

      const formattedMessage = `[${timestamp}] ${color}[${level}]${reset} ${message}`;

      if (args.length > 0) {
        process.stderr.write(`${formattedMessage}\n`);
        for (const arg of args) {
          process.stderr.write(`${JSON.stringify(arg, null, 2)}\n`);
        }
      } else {
        process.stderr.write(`${formattedMessage}\n`);
      }
    } catch (err) {
      // stderr est cassé (EPIPE), marquer pour éviter les boucles
      if ((err as any)?.code === 'EPIPE') {
        isStderrBroken = true;
      }
    } finally {
      isLoggingInternal = false;
    }
  }

  private static getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[90m'; // Gris
      case LogLevel.INFO:
        return '\x1b[32m'; // Vert
      case LogLevel.WARN:
        return '\x1b[33m'; // Jaune
      case LogLevel.ERROR:
        return '\x1b[31m'; // Rouge
      default:
        return '\x1b[0m';
    }
  }

  static debug(message: string, ...args: any[]) {
    this.logToStderr(LogLevel.DEBUG, message, ...args);
    this.logToFile(LogLevel.DEBUG, message, ...args);
  }

  static info(message: string, ...args: any[]) {
    this.logToStderr(LogLevel.INFO, message, ...args);
    this.logToFile(LogLevel.INFO, message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    this.logToStderr(LogLevel.WARN, message, ...args);
    this.logToFile(LogLevel.WARN, message, ...args);
  }

  static error(message: string, ...args: any[]) {
    this.logToStderr(LogLevel.ERROR, message, ...args);
    this.logToFile(LogLevel.ERROR, message, ...args);
  }
}

export default Logger;
