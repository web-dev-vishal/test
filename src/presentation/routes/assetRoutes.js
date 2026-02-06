/**
 * Global-Fi Ultra - Asset Routes
 * 
 * Routes for financial asset management endpoints.
 */

import { Router } from 'express';

/**
 * Create asset routes
 * @param {import('../controllers/AssetController.js').AssetController} controller
 * @returns {Router}
 */
export const createAssetRoutes = (controller) => {
    const router = Router();

    router.get('/', (req, res, next) => controller.searchAssets(req, res, next));
    router.get('/:symbol', (req, res, next) => controller.getAsset(req, res, next));
    router.get('/:symbol/live', (req, res, next) => controller.getLiveAssetData(req, res, next));
    router.post('/', (req, res, next) => controller.createAsset(req, res, next));
    router.put('/:symbol', (req, res, next) => controller.updateAsset(req, res, next));
    router.delete('/:symbol', (req, res, next) => controller.deleteAsset(req, res, next));

    return router;
};

export default createAssetRoutes;
