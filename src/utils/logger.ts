import fs from 'fs';
import path from 'path';
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

class Logger {
  private static logToFile(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? '\n' + JSON.stringify(args, null, 2) : '';
    const logLine = `[${timestamp}] [${level}] ${message}${formattedArgs}\n`;

    try {
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
      process.stderr.write(`[LOGGER ERROR] Impossible d'écrire dans le fichier de log: ${err}\n`);
    }
  }

  private static logToStderr(level: LogLevel, message: string, ...args: any[]) {
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
  }

  private static getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[90m'; // Gris
      case LogLevel.INFO: return '\x1b[32m'; // Vert
      case LogLevel.WARN: return '\x1b[33m'; // Jaune
      case LogLevel.ERROR: return '\x1b[31m'; // Rouge
      default: return '\x1b[0m';
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
