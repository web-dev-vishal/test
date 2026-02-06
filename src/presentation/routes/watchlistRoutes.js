/**
 * Global-Fi Ultra - Watchlist Routes
 * 
 * Routes for watchlist management endpoints.
 */

import { Router } from 'express';

/**
 * Create watchlist routes
 * @param {import('../controllers/WatchlistController.js').WatchlistController} controller
 * @returns {Router}
 */
export const createWatchlistRoutes = (controller) => {
    const router = Router();

    router.get('/', (req, res, next) => controller.listWatchlists(req, res, next));
    router.get('/:id', (req, res, next) => controller.getWatchlist(req, res, next));
    router.post('/', (req, res, next) => controller.createWatchlist(req, res, next));
    router.put('/:id', (req, res, next) => controller.updateWatchlist(req, res, next));
    router.delete('/:id', (req, res, next) => controller.deleteWatchlist(req, res, next));

    // Asset management
    router.post('/:id/assets', (req, res, next) => controller.addAsset(req, res, next));
    router.delete('/:id/assets/:symbol', (req, res, next) => controller.removeAsset(req, res, next));

    return router;
};

export default createWatchlistRoutes;
