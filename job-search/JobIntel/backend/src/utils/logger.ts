import winston, { Logger } from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Initialize Winston logger
 */
export const logger: Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),

  defaultMeta: { service: 'jobintel' },

  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14, // 14 days
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14, // 14 days
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    }),

    // Console output (all environments during debugging)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, service }) => {
          return `${timestamp} [${service}] ${level}: ${message}`;
        })
      ),
    }),
  ],
});

/**
 * HTTP request logger middleware
 */
export const morganFormat = ':method :url :status :response-time ms - :res[content-length]';

/**
 * Create module-specific logger
 */
export function createLogger(moduleName: string): Logger {
  return logger.child({ module: moduleName });
}

/**
 * Log API request
 */
export function logRequest(method: string, url: string, statusCode: number, responseTime: number): void {
  logger.info(`${method} ${url} - ${statusCode} (${responseTime}ms)`);
}

/**
 * Log API error
 */
export function logError(error: Error, context?: Record<string, any>): void {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Log service operation
 */
export function logService(service: string, action: string, success: boolean, details?: any): void {
  const level = success ? 'info' : 'warn';
  logger[level as any]({
    message: `${service}: ${action}`,
    success,
    ...details,
  });
}

export default logger;
