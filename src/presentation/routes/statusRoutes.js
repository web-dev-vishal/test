/**
 * Global-Fi Ultra - Status Routes
 */

import { Router } from 'express';

/**
 * Create status routes
 * @param {import('../controllers/StatusController.js').StatusController} controller
 * @returns {Router}
 */
export const createStatusRoutes = (controller) => {
    const router = Router();

    router.get('/circuit-breakers', (req, res) => controller.getCircuitBreakers(req, res));
    router.get('/rate-limits', (req, res) => controller.getRateLimits(req, res));

    return router;
};

export default createStatusRoutes;
