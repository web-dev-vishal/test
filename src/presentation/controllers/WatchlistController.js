/**
 * Global-Fi Ultra - Watchlist Controller
 * 
 * HTTP request handlers for watchlist management endpoints.
 */

import { logger } from '../../config/logger.js';

/**
 * Watchlist Controller
 */
export class WatchlistController {
    /**
     * @param {Object} dependencies
     * @param {import('../../application/use-cases/ManageWatchlist.js').ManageWatchlist} dependencies.manageWatchlist
     */
    constructor({ manageWatchlist }) {
        this.manageWatchlist = manageWatchlist;
    }

    /**
     * GET /watchlists - List watchlists
     */
    async listWatchlists(req, res, next) {
        try {
            const { userId, page, limit, isPublic, sort } = req.query;

            if (userId) {
                // Get user's watchlists
                const watchlists = await this.manageWatchlist.getUserWatchlists(userId, {
                    sort: sort || '-createdAt',
                });

                return res.status(200).json({
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                    watchlists,
                });
            }

            // List all watchlists with pagination
            const filter = {};
            if (isPublic !== undefined) {
                filter.isPublic = isPublic;
            }

            const result = await this.manageWatchlist.listWatchlists({
                page: page || 1,
                limit: limit || 20,
                filter,
                sort: sort || '-createdAt',
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
     * GET /watchlists/:id - Get watchlist by ID
     */
    async getWatchlist(req, res, next) {
        try {
            const watchlist = await this.manageWatchlist.getWatchlist(req.params.id);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                watchlist,
            });
        } catch (error) {
            if (error.message === 'Watchlist not found') {
                return res.status(404).json({
                    error: {
                        code: 'E3001',
                        message: 'Watchlist not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * POST /watchlists - Create new watchlist
     */
    async createWatchlist(req, res, next) {
        try {
            const watchlist = await this.manageWatchlist.createWatchlist(req.body);

            res.status(201).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Watchlist created successfully',
                watchlist,
            });
        } catch (error) {
            if (error.message === 'Watchlist name already exists for this user') {
                return res.status(409).json({
                    error: {
                        code: 'E3002',
                        message: 'Watchlist name already exists for this user',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * PUT /watchlists/:id - Update watchlist
     */
    async updateWatchlist(req, res, next) {
        try {
            const watchlist = await this.manageWatchlist.updateWatchlist(req.params.id, req.body);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Watchlist updated successfully',
                watchlist,
            });
        } catch (error) {
            if (error.message === 'Watchlist not found') {
                return res.status(404).json({
                    error: {
                        code: 'E3001',
                        message: 'Watchlist not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * DELETE /watchlists/:id - Delete watchlist
     */
    async deleteWatchlist(req, res, next) {
        try {
            await this.manageWatchlist.deleteWatchlist(req.params.id);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Watchlist deleted successfully',
            });
        } catch (error) {
            if (error.message === 'Watchlist not found') {
                return res.status(404).json({
                    error: {
                        code: 'E3001',
                        message: 'Watchlist not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * POST /watchlists/:id/assets - Add asset to watchlist
     */
    async addAsset(req, res, next) {
        try {
            const { symbol, notes } = req.body;
            const watchlist = await this.manageWatchlist.addAssetToWatchlist(
                req.params.id,
                symbol,
                notes
            );

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Asset added to watchlist successfully',
                watchlist,
            });
        } catch (error) {
            if (error.message === 'Watchlist not found') {
                return res.status(404).json({
                    error: {
                        code: 'E3001',
                        message: 'Watchlist not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * DELETE /watchlists/:id/assets/:symbol - Remove asset from watchlist
     */
    async removeAsset(req, res, next) {
        try {
            const watchlist = await this.manageWatchlist.removeAssetFromWatchlist(
                req.params.id,
                req.params.symbol
            );

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Asset removed from watchlist successfully',
                watchlist,
            });
        } catch (error) {
            if (error.message === 'Watchlist not found') {
                return res.status(404).json({
                    error: {
                        code: 'E3001',
                        message: 'Watchlist not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }
}

export default WatchlistController;
