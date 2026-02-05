/**
 * Global-Fi Ultra - Health Routes
 */

import { Router } from 'express';
import { healthRateLimiter } from '../middleware/index.js';

/**
 * Create health routes
 * @param {import('../controllers/HealthController.js').HealthController} controller
 * @returns {Router}
 */
export const createHealthRoutes = (controller) => {
    const router = Router();

    router.get('/health', healthRateLimiter, (req, res) => controller.health(req, res));
    router.get('/readiness', healthRateLimiter, (req, res) => controller.readiness(req, res));

    return router;
};

export default createHealthRoutes;
