/**
 * Global-Fi Ultra - Security Middleware
 * 
 * Helmet and CORS configuration.
 */

import helmet from 'helmet';
import cors from 'cors';
import { config } from '../../config/environment.js';

/**
 * Configure Helmet security headers
 */
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:'],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Configure CORS
 */
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        if (config.security.corsOrigins.includes(origin)) {
            return callback(null, true);
        }

        // In development, allow all origins
        if (config.server.isDev) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
});

export default { securityHeaders, corsMiddleware };
