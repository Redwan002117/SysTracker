// Error Logging with PID Tracking - SysTracker v3.0.0
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Structured logging function with PID tracking
 * Logs both to console and file for debugging
 */
class ErrorLogger {
    constructor() {
        this.pid = process.pid;
        this.startTime = new Date();
    }

    log(level, message, error = null, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            pid: this.pid,
            level,
            message,
            context,
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            })
        };

        // Console output
        const prefix = `[${timestamp}] [PID:${this.pid}] [${level.toUpperCase()}]`;
        if (level === 'error') {
            console.error(`${prefix} ${message}`, error ? `\n${error.stack}` : '', context);
        } else if (level === 'warn') {
            console.warn(`${prefix} ${message}`, context);
        } else {
            console.log(`${prefix} ${message}`, context);
        }

        // File output
        const logFile = path.join(LOG_DIR, `systracker-${new Date().toISOString().split('T')[0]}.log`);
        try {
            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        } catch (e) {
            console.error('Failed to write to log file:', e.message);
        }
    }

    error(message, error, context) {
        this.log('error', message, error, context);
    }

    warn(message, context) {
        this.log('warn', message, null, context);
    }

    info(message, context) {
        this.log('info', message, null, context);
    }

    debug(message, context) {
        if (process.env.DEBUG) {
            this.log('debug', message, null, context);
        }
    }
}

const logger = new ErrorLogger();

// Global error handlers
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION', error, {
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
    // Exit gracefully
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION', new Error(String(reason)), {
        promise: String(promise),
        uptime: process.uptime()
    });
});

module.exports = { logger, LOG_DIR };
