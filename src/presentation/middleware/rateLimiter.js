/**
 * Global-Fi Ultra - Rate Limiter Middleware
 * 
 * Express rate limiting per IP.
 */

import rateLimit from 'express-rate-limit';
import { config } from '../../config/environment.js';
import { logger } from '../../config/logger.js';

/**
 * Global rate limiter (100 requests per 15 minutes)
 */
export const globalRateLimiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: {
        error: {
            code: 'E1002',
            message: 'Too many requests, please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            requestId: req.requestId,
        });
        res.status(429).json(options.message);
    },
});

/**
 * Stricter rate limiter for admin endpoints (20 requests per 15 minutes)
 */
export const adminRateLimiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: 20,
    message: {
        error: {
            code: 'E1002',
            message: 'Too many admin requests, please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter rate limiter for AI endpoints (10 requests per minute)
 * AI calls are expensive (token consumption, Groq API quota), so limit separately.
 */
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute window
    max: 10,                    // 10 AI requests per minute per IP
    message: {
        error: {
            code: 'E1012',
            message: 'AI rate limit exceeded. Maximum 10 AI requests per minute.',
            retryAfter: 60,
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    },
    handler: (req, res, next, options) => {
        logger.warn('AI rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            requestId: req.requestId,
        });
        res.status(429).json(options.message);
    },
});

/**
 * Lenient rate limiter for health checks (1000 requests per minute)
 */
export const healthRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    message: {
        error: {
            code: 'E1002',
            message: 'Too many health check requests.',
        },
    },
});

export default globalRateLimiter;
