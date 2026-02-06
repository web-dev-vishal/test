/**
 * Global-Fi Ultra - Alert Routes
 * 
 * Routes for alert management endpoints.
 */

import { Router } from 'express';

/**
 * Create alert routes
 * @param {import('../controllers/AlertController.js').AlertController} controller
 * @returns {Router}
 */
export const createAlertRoutes = (controller) => {
    const router = Router();

    router.get('/', (req, res, next) => controller.listAlerts(req, res, next));
    router.get('/:id', (req, res, next) => controller.getAlert(req, res, next));
    router.post('/', (req, res, next) => controller.createAlert(req, res, next));
    router.put('/:id', (req, res, next) => controller.updateAlert(req, res, next));
    router.delete('/:id', (req, res, next) => controller.deleteAlert(req, res, next));

    // Alert activation
    router.patch('/:id/activate', (req, res, next) => controller.activateAlert(req, res, next));
    router.patch('/:id/deactivate', (req, res, next) => controller.deactivateAlert(req, res, next));

    return router;
};

export default createAlertRoutes;
