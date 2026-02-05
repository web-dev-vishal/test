/**
 * Global-Fi Ultra - Error Handler Middleware
 * 
 * Centralized error handling with structured logging.
 */

import { AppError } from '../../core/errors/index.js';
import { logger } from '../../config/logger.js';
import { config } from '../../config/environment.js';

/**
 * Express error handling middleware
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const errorHandler = (err, req, res, next) => {
    const requestId = req.requestId || 'unknown';

    // Log the error
    logger.error('Request error', {
        requestId,
        path: req.path,
        method: req.method,
        error: err.message,
        stack: config.server.isDev ? err.stack : undefined,
        code: err.code,
    });

    // Handle operational errors (our custom errors)
    if (err instanceof AppError) {
        return res.status(err.httpStatus).json({
            error: {
                code: err.code,
                message: config.server.isProd ? err.message : err.details || err.message,
            },
            requestId,
        });
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: {
                code: 'E1008',
                message: 'Validation error',
                details: config.server.isDev ? err.errors : undefined,
            },
            requestId,
        });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                code: 'E1008',
                message: 'Validation error',
                details: config.server.isDev ? err.message : undefined,
            },
            requestId,
        });
    }

    // Handle unknown errors (don't leak details in production)
    return res.status(500).json({
        error: {
            code: 'E1009',
            message: config.server.isProd ? 'Internal server error' : err.message,
        },
        requestId,
    });
};

/**
 * 404 Not Found handler
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: {
            code: 'E1010',
            message: `Route not found: ${req.method} ${req.path}`,
        },
        requestId: req.requestId,
    });
};

export default errorHandler;
