/**
 * Global-Fi Ultra - Application Entry Point
 * 
 * Express + Socket.io server with graceful shutdown.
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config, logger, connectDatabase, closeDatabaseConnection, connectRedis, closeRedisConnection, connectRabbitMQ, closeRabbitMQConnection, flushLogger } from './config/index.js';
import { getContainer } from './di/container.js';
import {
    requestIdMiddleware,
    globalRateLimiter,
    errorHandler,
    notFoundHandler,
    securityHeaders,
    corsMiddleware,
} from './presentation/middleware/index.js';
import {
    createHealthRoutes,
    createFinancialRoutes,
    createAdminRoutes,
    createStatusRoutes,
    createUserRoutes,
    createWatchlistRoutes,
    createAlertRoutes,
    createAssetRoutes,
} from './presentation/routes/index.js';

/**
 * Create and configure Express app
 */
const createApp = () => {
    const app = express();

    // Trust proxy for rate limiting behind reverse proxy
    app.set('trust proxy', 1);

    // Security middleware
    app.use(securityHeaders);
    app.use(corsMiddleware);

    // Request parsing
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // Request ID for tracing
    app.use(requestIdMiddleware);

    // Global rate limiting
    app.use('/api', globalRateLimiter);

    return app;
};

/**
 * Setup routes
 */
const setupRoutes = (app, container) => {
    // Health routes (no /api prefix)
    app.use('/api/v1/health', createHealthRoutes(container.get('healthController')));

    // API routes
    app.use('/api/v1/financial', createFinancialRoutes(container.get('financialController')));
    app.use('/api/v1/admin', createAdminRoutes(container.get('adminController')));
    app.use('/api/v1/status', createStatusRoutes(container.get('statusController')));

    // New resource routes
    app.use('/api/v1/users', createUserRoutes(container.get('userController')));
    app.use('/api/v1/watchlists', createWatchlistRoutes(container.get('watchlistController')));
    app.use('/api/v1/alerts', createAlertRoutes(container.get('alertController')));
    app.use('/api/v1/assets', createAssetRoutes(container.get('assetController')));

    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);
};

/**
 * Graceful shutdown handler
 */
const setupGracefulShutdown = (server, container) => {
    let isShuttingDown = false;

    const shutdown = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        logger.info(`${signal} received, starting graceful shutdown`);

        // Stop accepting new connections
        server.close(() => {
            logger.info('HTTP server closed');
        });

        // Set timeout for force shutdown
        const forceShutdownTimer = setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 15000);

        try {
            // Close Socket.io
            const socketManager = container.getSocketManager();
            if (socketManager) {
                await socketManager.close();
                logger.info('Socket.io closed');
            }

            // Close MongoDB
            await closeDatabaseConnection();
            logger.info('MongoDB connection closed');

            // Close Redis
            await closeRedisConnection();
            logger.info('Redis connection closed');

            // Close RabbitMQ
            await closeRabbitMQConnection();
            logger.info('RabbitMQ connection closed');

            // Flush logs
            await flushLogger();

            clearTimeout(forceShutdownTimer);
            logger.info('Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown', { error: error.message });
            clearTimeout(forceShutdownTimer);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { error: error.message, stack: error.stack });
        shutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled rejection', { reason: String(reason) });
    });
};

/**
 * Start the server
 */
const startServer = async () => {
    try {
        logger.info('Starting Global-Fi Ultra...');

        // Connect to databases and message queue
        await connectDatabase();
        await connectRedis();
        await connectRabbitMQ();

        // Create Express app
        const app = createApp();
        const httpServer = createServer(app);

        // Create Socket.io server
        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: config.socketIo.corsOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        // Initialize DI container
        const container = getContainer();
        container.initialize({ io });

        // Setup routes
        setupRoutes(app, container);

        // Setup graceful shutdown
        setupGracefulShutdown(httpServer, container);

        // Start listening
        httpServer.listen(config.server.port, config.server.host, () => {
            logger.info(`🚀 Global-Fi Ultra running on http://${config.server.host}:${config.server.port}`);
            logger.info(`   Environment: ${config.server.nodeEnv}`);
            logger.info(`   Health check: http://${config.server.host}:${config.server.port}/health`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
};

// Start the server
startServer();
