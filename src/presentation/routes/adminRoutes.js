/**
 * Global-Fi Ultra - Admin Routes
 */

import { Router } from 'express';
import { adminRateLimiter } from '../middleware/index.js';

/**
 * Create admin routes
 * @param {import('../controllers/AdminController.js').AdminController} controller
 * @returns {Router}
 */
export const createAdminRoutes = (controller) => {
    const router = Router();

    router.use(adminRateLimiter);

    router.post('/cache/clear', (req, res, next) => controller.clearCache(req, res, next));
    router.get('/metrics', (req, res, next) => controller.getMetrics(req, res, next));
    router.get('/logs', (req, res, next) => controller.getLogs(req, res, next));

    return router;
};

export default createAdminRoutes;
