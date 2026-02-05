/**
 * Global-Fi Ultra - Financial Controller
 * 
 * Financial data endpoints.
 */

import { logger } from '../../config/logger.js';

/**
 * Financial data controller
 */
export class FinancialController {
    /**
     * @param {Object} dependencies
     * @param {import('../../application/use-cases/OrchestrateFinancialData.js').OrchestrateFinancialData} dependencies.orchestrateFinancialData
     * @param {import('../../infrastructure/websocket/SocketManager.js').SocketManager} dependencies.socketManager
     */
    constructor(dependencies) {
        this.orchestrateFinancialData = dependencies.orchestrateFinancialData;
        this.socketManager = dependencies.socketManager;
    }

    /**
     * Get live financial data (triggers API calls)
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getLive(req, res, next) {
        try {
            const options = {
                stockSymbol: req.query.symbol || 'IBM',
                cryptoIds: req.query.crypto || 'bitcoin,ethereum',
                baseCurrency: req.query.currency || 'USD',
                newsQuery: req.query.newsQuery || 'finance OR stock market',
                fredSeriesId: req.query.fredSeries || 'GDP',
            };

            const data = await this.orchestrateFinancialData.execute(options);

            // Broadcast to Socket.io if successful
            if (data.status !== 'error') {
                this.socketManager.broadcastFinancialData(data);
            }

            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get cached financial data only (no API calls)
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    async getCached(req, res, next) {
        try {
            const cachedData = await this.orchestrateFinancialData.getCachedData();

            if (!cachedData) {
                return res.status(404).json({
                    error: {
                        code: 'E1010',
                        message: 'No cached data available',
                    },
                    requestId: req.requestId,
                });
            }

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                status: 'cached',
                data: cachedData,
                metadata: {
                    fromCache: true,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default FinancialController;
