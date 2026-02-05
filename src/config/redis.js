/**
 * Global-Fi Ultra - Redis Configuration
 * 
 * Redis client setup with reconnection logic and graceful handling.
 */

import Redis from 'ioredis';
import { config } from './environment.js';
import { logger } from './logger.js';

let redisClient = null;

/**
 * Create and configure Redis client
 * @returns {Redis}
 */
export const createRedisClient = () => {
    if (redisClient) {
        return redisClient;
    }

    const options = {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
    };

    // Add password if provided
    if (config.redis.password) {
        options.password = config.redis.password;
    }

    redisClient = new Redis(config.redis.url, options);

    redisClient.on('connect', () => {
        logger.info('✅ Redis client connected');
    });

    redisClient.on('ready', () => {
        logger.info('✅ Redis client ready');
    });

    redisClient.on('error', (err) => {
        logger.error('❌ Redis client error', { error: err.message });
    });

    redisClient.on('close', () => {
        logger.warn('⚠️ Redis connection closed');
    });

    redisClient.on('reconnecting', (time) => {
        logger.info(`🔄 Redis reconnecting in ${time}ms`);
    });

    return redisClient;
};

/**
 * Connect to Redis
 * @returns {Promise<Redis>}
 */
export const connectRedis = async () => {
    const client = createRedisClient();

    try {
        await client.connect();
        return client;
    } catch (error) {
        logger.error('❌ Failed to connect to Redis', { error: error.message });
        throw error;
    }
};

/**
 * Get Redis client instance
 * @returns {Redis|null}
 */
export const getRedisClient = () => {
    return redisClient;
};

/**
 * Close Redis connection gracefully
 * @returns {Promise<void>}
 */
export const closeRedisConnection = async () => {
    if (redisClient) {
        try {
            await redisClient.quit();
            logger.info('Redis connection closed gracefully');
            redisClient = null;
        } catch (error) {
            logger.error('Error closing Redis connection', { error: error.message });
            throw error;
        }
    }
};

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
export const isRedisConnected = () => {
    return redisClient?.status === 'ready';
};

export default {
    createRedisClient,
    connectRedis,
    getRedisClient,
    closeRedisConnection,
    isRedisConnected,
};
