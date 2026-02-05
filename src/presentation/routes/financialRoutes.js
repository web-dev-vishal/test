/**
 * Global-Fi Ultra - Financial Routes
 */

import { Router } from 'express';

/**
 * Create financial routes
 * @param {import('../controllers/FinancialController.js').FinancialController} controller
 * @returns {Router}
 */
export const createFinancialRoutes = (controller) => {
    const router = Router();

    router.get('/live', (req, res, next) => controller.getLive(req, res, next));
    router.get('/cached', (req, res, next) => controller.getCached(req, res, next));

    return router;
};

export default createFinancialRoutes;
