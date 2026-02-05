/**
 * Global-Fi Ultra - Admin Controller
 * 
 * Admin endpoints for cache management and metrics.
 */

import { logger } from '../../config/logger.js';

/**
 * Admin controller
 */
export class AdminController {
    /**
     * @param {Object} dependencies
     * @param {import('../../infrastructure/cache/RedisCache.js').RedisCache} dependencies.cache
     * @param {import('../../infrastructure/repositories/AuditLogRepository.js').AuditLogRepository} dependencies.auditLogRepository
     */
    constructor(dependencies) {
        this.cache = dependencies.cache;
        this.auditLogRepository = dependencies.auditLogRepository;
    }

    /**
     * Clear all cache
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async clearCache(req, res, next) {
        try {
            const success = await this.cache.clear();

            if (!success) {
                return res.status(500).json({
                    error: {
                        code: 'E1006',
                        message: 'Failed to clear cache',
                    },
                    requestId: req.requestId,
                });
            }

            logger.info('Cache cleared by admin', { requestId: req.requestId });

            res.status(200).json({
                success: true,
                message: 'Cache cleared successfully',
                requestId: req.requestId,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get system metrics
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getMetrics(req, res, next) {
        try {
            const hours = parseInt(req.query.hours) || 24;
            const metrics = await this.auditLogRepository.getMetrics(hours);

            res.status(200).json({
                period: `${hours} hours`,
                metrics,
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get recent error logs
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getLogs(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const logs = await this.auditLogRepository.getErrors(limit);

            res.status(200).json({
                count: logs.length,
                logs,
                requestId: req.requestId,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default AdminController;
