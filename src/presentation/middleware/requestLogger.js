/**
 * Global-Fi Ultra - Request Logger Middleware
 * 
 * Logs all HTTP requests with method, path, status, duration, and request ID.
 * 
 * @module presentation/middleware/requestLogger
 */

import { logger } from '../../config/logger.js';

/**
 * Log all incoming HTTP requests on response finish
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP Request', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous',
            requestId: req.requestId,
            contentLength: res.get('Content-Length'),
        });
    });

    next();
};

export default requestLogger;
