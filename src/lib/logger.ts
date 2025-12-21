/**
 * Secure Logger Utility
 * Only logs in development, silent in production
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private shouldLog(): boolean {
        return this.isDevelopment;
    }

    log(...args: unknown[]): void {
        if (this.shouldLog()) {
            console.log(...args);
        }
    }

    error(...args: unknown[]): void {
        if (this.shouldLog()) {
            console.error(...args);
        }
    }

    warn(...args: unknown[]): void {
        if (this.shouldLog()) {
            console.warn(...args);
        }
    }

    info(...args: unknown[]): void {
        if (this.shouldLog()) {
            console.info(...args);
        }
    }

    debug(...args: unknown[]): void {
        if (this.shouldLog()) {
            console.debug(...args);
        }
    }

    // For production error logging (sanitized)
    logError(message: string, context?: Record<string, unknown>): void {
        // In production, log to error tracking service (e.g., Sentry)
        // For now, only log in development
        if (this.isDevelopment) {
            console.error(message, context);
        }
    }
}

export const logger = new Logger();
