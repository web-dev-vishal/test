/**
 * Global-Fi Ultra - Redis Cache Service
 * 
 * TTL-based caching with stale-while-revalidate support.
 */

import { getRedisClient } from '../../config/redis.js';
import { config } from '../../config/environment.js';
import { logger } from '../../config/logger.js';

/**
 * Redis cache implementation
 */
export class RedisCache {
    constructor() {
        this.keyPrefix = 'globalfi';
    }

    /**
     * Get Redis client
     * @private
     * @returns {import('ioredis').Redis}
     */
    _getClient() {
        return getRedisClient();
    }

    /**
     * Build cache key
     * @param {string} service - Service name
     * @param {string} identifier - Unique identifier
     * @returns {string}
     */
    buildKey(service, identifier) {
        return `${this.keyPrefix}:${service}:${identifier}`;
    }

    /**
     * Get cached value
     * @param {string} key - Cache key
     * @returns {Promise<Object|null>}
     */
    async get(key) {
        const client = this._getClient();
        if (!client) return null;

        try {
            const data = await client.get(key);
            if (!data) return null;

            const parsed = JSON.parse(data);
            logger.debug(`Cache hit: ${key}`);
            return parsed;
        } catch (error) {
            logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }

    /**
     * Set cached value with TTL
     * @param {string} key - Cache key
     * @param {Object} value - Value to cache
     * @param {number} [ttlSeconds] - TTL in seconds
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttlSeconds = config.redis.ttlDefault) {
        const client = this._getClient();
        if (!client) return false;

        try {
            const data = JSON.stringify(value);
            await client.setex(key, ttlSeconds, data);
            logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
            return true;
        } catch (error) {
            logger.error('Cache set error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete cached value
     * @param {string} key - Cache key
     * @returns {Promise<boolean>}
     */
    async delete(key) {
        const client = this._getClient();
        if (!client) return false;

        try {
            await client.del(key);
            logger.debug(`Cache delete: ${key}`);
            return true;
        } catch (error) {
            logger.error('Cache delete error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Clear all cache entries
     * @returns {Promise<boolean>}
     */
    async clear() {
        const client = this._getClient();
        if (!client) return false;

        try {
            const keys = await client.keys(`${this.keyPrefix}:*`);
            if (keys.length > 0) {
                await client.del(...keys);
                logger.info(`Cache cleared: ${keys.length} keys`);
            }
            return true;
        } catch (error) {
            logger.error('Cache clear error', { error: error.message });
            return false;
        }
    }

    /**
     * Get or set with callback (stale-while-revalidate pattern)
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch fresh data
     * @param {number} [ttlSeconds] - TTL in seconds
     * @returns {Promise<{data: Object, fromCache: boolean}>}
     */
    async getOrSet(key, fetchFn, ttlSeconds) {
        // Try cache first
        const cached = await this.get(key);
        if (cached) {
            return { data: cached, fromCache: true };
        }

        // Fetch fresh data
        try {
            const data = await fetchFn();
            await this.set(key, data, ttlSeconds);
            return { data, fromCache: false };
        } catch (error) {
            logger.error('Cache getOrSet fetch error', { key, error: error.message });
            throw error;
        }
    }

    /**
     * Get TTL for a service
     * @param {string} service - Service name
     * @returns {number}
     */
    getTTL(service) {
        const ttlMap = {
            alpha_vantage: config.cacheTTL.alphaVantage,
            coingecko: config.cacheTTL.coinGecko,
            exchangerate_api: config.cacheTTL.exchangeRate,
            newsapi: config.cacheTTL.newsApi,
            fred: config.cacheTTL.fred,
            finnhub: config.cacheTTL.finnhub,
        };
        return ttlMap[service] || config.redis.ttlDefault;
    }
}

export default RedisCache;
