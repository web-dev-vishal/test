/**
 * Global-Fi Ultra - Asset Controller
 * 
 * HTTP request handlers for financial asset management endpoints.
 */

import { logger } from '../../config/logger.js';

/**
 * Asset Controller
 */
export class AssetController {
    /**
     * @param {Object} dependencies
     * @param {import('../../application/use-cases/ManageFinancialAsset.js').ManageFinancialAsset} dependencies.manageFinancialAsset
     * @param {import('../../application/use-cases/OrchestrateFinancialData.js').OrchestrateFinancialData} dependencies.orchestrateFinancialData
     */
    constructor({ manageFinancialAsset, orchestrateFinancialData }) {
        this.manageFinancialAsset = manageFinancialAsset;
        this.orchestrateFinancialData = orchestrateFinancialData;
    }

    /**
     * GET /assets - Search/list assets
     */
    async searchAssets(req, res, next) {
        try {
            const { type, search, isActive, page, limit, sort } = req.query;

            const filter = {};
            if (type) filter.type = type;
            if (isActive !== undefined) filter.isActive = isActive;

            const result = await this.manageFinancialAsset.searchAssets({
                page: page || 1,
                limit: limit || 20,
                filter,
                sort: sort || '-lastUpdated',
                search: search || '',
            });

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /assets/:symbol - Get asset by symbol
     */
    async getAsset(req, res, next) {
        try {
            const asset = await this.manageFinancialAsset.getAsset(req.params.symbol);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                asset,
            });
        } catch (error) {
            if (error.message === 'Asset not found') {
                return res.status(404).json({
                    error: {
                        code: 'E5001',
                        message: 'Asset not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * GET /assets/:symbol/live - Get live data for asset
     */
    async getLiveAssetData(req, res, next) {
        try {
            const { symbol } = req.params;
            const { forceRefresh } = req.query;

            // Get asset info
            let asset;
            try {
                asset = await this.manageFinancialAsset.getAsset(symbol);
            } catch (error) {
                // Asset doesn't exist in DB, that's okay
                asset = null;
            }

            // Fetch live data based on asset type or default to stock
            const assetType = asset?.type || 'stock';
            let liveData;

            if (assetType === 'stock') {
                liveData = await this.orchestrateFinancialData.execute({
                    stockSymbol: symbol,
                    cryptoIds: '',
                    baseCurrency: 'USD',
                    newsQuery: symbol,
                    fredSeriesId: 'GDP',
                });
            } else if (assetType === 'crypto') {
                liveData = await this.orchestrateFinancialData.execute({
                    stockSymbol: 'IBM',
                    cryptoIds: symbol.toLowerCase(),
                    baseCurrency: 'USD',
                    newsQuery: symbol,
                    fredSeriesId: 'GDP',
                });
            }

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                symbol,
                assetInfo: asset,
                liveData,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /assets - Create/track new asset
     */
    async createAsset(req, res, next) {
        try {
            const asset = await this.manageFinancialAsset.createAsset(req.body);

            res.status(201).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Asset created successfully',
                asset,
            });
        } catch (error) {
            if (error.message === 'Asset with this symbol already exists') {
                return res.status(409).json({
                    error: {
                        code: 'E5002',
                        message: 'Asset with this symbol already exists',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * PUT /assets/:symbol - Update asset
     */
    async updateAsset(req, res, next) {
        try {
            const asset = await this.manageFinancialAsset.updateAsset(req.params.symbol, req.body);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Asset updated successfully',
                asset,
            });
        } catch (error) {
            if (error.message === 'Asset not found') {
                return res.status(404).json({
                    error: {
                        code: 'E5001',
                        message: 'Asset not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * DELETE /assets/:symbol - Delete asset
     */
    async deleteAsset(req, res, next) {
        try {
            await this.manageFinancialAsset.deleteAsset(req.params.symbol);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Asset deleted successfully',
            });
        } catch (error) {
            if (error.message === 'Asset not found') {
                return res.status(404).json({
                    error: {
                        code: 'E5001',
                        message: 'Asset not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }
}

export default AssetController;
