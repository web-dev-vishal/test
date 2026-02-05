/**
 * Global-Fi Ultra - Winston Logger Configuration
 * 
 * Structured JSON logging for production, pretty printing for development.
 */

import winston from 'winston';
import { config } from './environment.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Ensure logs directory exists
const logDir = dirname(config.logging.filePath);
if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
}

/**
 * Custom format for adding metadata
 */
const addMetadata = winston.format((info) => {
    info.timestamp = new Date().toISOString();
    info.service = 'globalfi-ultra';
    return info;
});

/**
 * Development format - colorized and readable
 */
const devFormat = winston.format.combine(
    addMetadata(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
        const reqId = requestId ? `[${requestId}]` : '';
        const metaStr = Object.keys(meta).length > 1
            ? `\n${JSON.stringify(meta, null, 2)}`
            : '';
        return `${timestamp} ${level} ${reqId} ${message}${metaStr}`;
    })
);

/**
 * Production format - structured JSON
 */
const prodFormat = winston.format.combine(
    addMetadata(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

/**
 * Transports configuration
 */
const transports = [
    // Console transport
    new winston.transports.Console({
        format: config.server.isProd ? prodFormat : devFormat,
    }),
];

// Add file transport in production
if (config.server.isProd) {
    transports.push(
        new winston.transports.File({
            filename: config.logging.filePath,
            format: prodFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: config.logging.filePath.replace('.log', '.error.log'),
            level: 'error',
            format: prodFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        })
    );
}

/**
 * Winston logger instance
 */
export const logger = winston.createLogger({
    level: config.logging.level,
    transports,
    exitOnError: false,
});

/**
 * Create a child logger with request context
 * @param {string} requestId - Request ID for tracing
 * @returns {winston.Logger}
 */
export const createRequestLogger = (requestId) => {
    return logger.child({ requestId });
};

/**
 * Flush logger and close transports
 * @returns {Promise<void>}
 */
export const flushLogger = () => {
    return new Promise((resolve) => {
        logger.on('finish', resolve);
        logger.end();
    });
};

export default logger;
