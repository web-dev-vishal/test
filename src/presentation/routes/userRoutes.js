/**
 * Global-Fi Ultra - User Routes
 * 
 * Routes for user management endpoints.
 */

import { Router } from 'express';

/**
 * Create user routes
 * @param {import('../controllers/UserController.js').UserController} controller
 * @returns {Router}
 */
export const createUserRoutes = (controller) => {
    const router = Router();

    router.get('/', (req, res, next) => controller.listUsers(req, res, next));
    router.get('/:id', (req, res, next) => controller.getUser(req, res, next));
    router.post('/', (req, res, next) => controller.createUser(req, res, next));
    router.put('/:id', (req, res, next) => controller.updateUser(req, res, next));
    router.patch('/:id', (req, res, next) => controller.patchUser(req, res, next));
    router.delete('/:id', (req, res, next) => controller.deleteUser(req, res, next));

    return router;
};

export default createUserRoutes;
