/**
 * Logging Utilities
 * Provides structured logging with context
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

interface LogContext {
    requestId?: string;
    userId?: string;
    farmId?: string;
    [key: string]: any;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    [key: string]: any;
}

/**
 * Logger class for structured logging
 */
export class Logger {
    private context: LogContext;
    private logLevel: LogLevel;

    constructor(context: LogContext = {}, logLevel: LogLevel = LogLevel.INFO) {
        this.context = context;
        this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || logLevel);
    }

    /**
     * Parse log level from string
     */
    private parseLogLevel(level: string): LogLevel {
        const upperLevel = level.toUpperCase();
        return Object.values(LogLevel).includes(upperLevel as LogLevel)
            ? (upperLevel as LogLevel)
            : LogLevel.INFO;
    }

    /**
     * Check if log level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

    /**
     * Create log entry
     */
    private createLogEntry(
        level: LogLevel,
        message: string,
        additionalContext?: Record<string, any>,
        error?: Error
    ): LogEntry {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context: { ...this.context, ...additionalContext },
        };

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }

        return entry;
    }

    /**
     * Log message
     */
    private log(
        level: LogLevel,
        message: string,
        additionalContext?: Record<string, any>,
        error?: Error
    ): void {
        if (!this.shouldLog(level)) return;

        const entry = this.createLogEntry(level, message, additionalContext, error);
        console.log(JSON.stringify(entry));
    }

    /**
     * Log debug message
     */
    debug(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    /**
     * Log info message
     */
    info(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, context);
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, context);
    }

    /**
     * Log error message
     */
    error(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, context, error);
    }

    /**
     * Add context to logger
     */
    addContext(context: LogContext): Logger {
        return new Logger({ ...this.context, ...context }, this.logLevel);
    }

    /**
     * Create child logger with additional context
     */
    child(context: LogContext): Logger {
        return this.addContext(context);
    }
}

/**
 * Create a logger instance
 */
export function createLogger(context?: LogContext, logLevel?: LogLevel): Logger {
    return new Logger(context, logLevel);
}

/**
 * Default logger instance
 */
export const logger = createLogger();
