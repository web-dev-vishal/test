/**
 * Global-Fi Ultra - Health Controller
 * 
 * Health check and readiness probe endpoints.
 */

import { isDatabaseConnected } from '../../config/database.js';
import { isRedisConnected } from '../../config/redis.js';

/**
 * Health controller
 */
export class HealthController {
    /**
     * Health check - basic liveness probe
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async health(req, res) {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        });
    }

    /**
     * Readiness probe - checks all dependencies
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async readiness(req, res) {
        const checks = {
            database: isDatabaseConnected(),
            redis: isRedisConnected(),
        };

        const allHealthy = Object.values(checks).every(Boolean);
        const status = allHealthy ? 'ready' : 'not_ready';
        const httpStatus = allHealthy ? 200 : 503;

        res.status(httpStatus).json({
            status,
            checks,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        });
    }
}

export default HealthController;
