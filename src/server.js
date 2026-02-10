/**
 * Global-Fi Ultra - Application Entry Point
 * 
 * Express + Socket.io server with graceful shutdown.
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config, logger, connectDatabase, closeDatabaseConnection, connectRedis, closeRedisConnection, connectRabbitMQ, closeRabbitMQConnection, flushLogger, safeLog } from './config/index.js';
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
import { createAIRoutes } from './presentation/routes/aiRoutes.js';

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
    // Health routes
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

    // AI routes (if enabled)
    const aiController = container.get('aiController');
    if (aiController) {
        app.use('/api/v1/ai', createAIRoutes(aiController));
        logger.info('✅ AI routes mounted at /api/v1/ai');
    } else {
        logger.info('ℹ️  AI routes not mounted (AI features disabled)');
    }

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
            safeLog('info', 'HTTP server closed'); // ✅ Use safeLog
        });

        // Set timeout for force shutdown
        const forceShutdownTimer = setTimeout(() => {
            console.error('Forced shutdown after timeout'); // ✅ Use console directly
            process.exit(1);
        }, 15000);

        try {
            // Close Socket.io
            const socketManager = container.getSocketManager();
            if (socketManager) {
                await socketManager.close();
                safeLog('info', 'Socket.io closed'); // ✅ Use safeLog
            }

            // Close AI job queue
            await container.closeAIJobQueue();
            safeLog('info', 'AI job queue closed'); // ✅ Use safeLog

            // Close MongoDB
            await closeDatabaseConnection();
            safeLog('info', 'MongoDB connection closed'); // ✅ Use safeLog

            // Close Redis
            await closeRedisConnection();
            safeLog('info', 'Redis connection closed'); // ✅ Use safeLog

            // Close RabbitMQ
            await closeRabbitMQConnection();
            safeLog('info', 'RabbitMQ connection closed'); // ✅ Use safeLog

            // Flush logs
            await flushLogger();
            console.log('Graceful shutdown complete'); // ✅ Use console after logger is closed

            clearTimeout(forceShutdownTimer);
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown', error.message); // ✅ Use console directly
            clearTimeout(forceShutdownTimer);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ✅ Handle uncaught exceptions - use console.error to avoid logger issues
    process.on('uncaughtException', (error) => {
        console.error('='.repeat(60));
        console.error('❌ UNCAUGHT EXCEPTION');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('='.repeat(60));
        shutdown('uncaughtException');
    });

    // ✅ Handle unhandled rejections - use console.error
    process.on('unhandledRejection', (reason, promise) => {
        console.error('='.repeat(60));
        console.error('❌ UNHANDLED REJECTION');
        console.error('='.repeat(60));
        console.error('Reason:', String(reason));
        console.error('='.repeat(60));
    });
};

/**
 * Start the server
 */
const startServer = async () => {
    try {
        logger.info('Starting Global-Fi Ultra...');

        // 🔍 DEBUG: Check environment variables at startup
        console.log('='.repeat(60));
        console.log('🔍 ENVIRONMENT VARIABLE DEBUG');
        console.log('='.repeat(60));
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('GROQ_API_KEY from process.env:', process.env.GROQ_API_KEY ? `EXISTS (length: ${process.env.GROQ_API_KEY.length})` : 'MISSING/EMPTY');
        console.log('GROQ_API_KEY value:', process.env.GROQ_API_KEY || 'EMPTY');
        console.log('GROQ_API_KEY first 10 chars:', process.env.GROQ_API_KEY?.substring(0, 10) || 'N/A');
        console.log('='.repeat(60));

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
        await container.initialize({ io });  // ✅ With await

        // Setup routes
        setupRoutes(app, container);

        // Setup graceful shutdown
        setupGracefulShutdown(httpServer, container);

        // Start listening
        httpServer.listen(config.server.port, config.server.host, () => {
            logger.info(`🚀 Global-Fi Ultra running on http://${config.server.host}:${config.server.port}`);
            logger.info(`   Environment: ${config.server.nodeEnv}`);
            logger.info(`   Health check: http://${config.server.host}:${config.server.port}/health`);
            
            // Log AI status
            if (container.isAIEnabled()) {
                logger.info(`   ✅ AI Features: ENABLED`);
                logger.info(`   🤖 AI Endpoints: http://${config.server.host}:${config.server.port}/api/v1/ai/*`);
                logger.info(`   🔌 AI WebSocket: ws://${config.server.host}:${config.server.port}`);
            } else {
                logger.info(`   ℹ️  AI Features: DISABLED (configure GROQ_API_KEY to enable)`);
            }
        });
    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
};

// Start the server
startServer();