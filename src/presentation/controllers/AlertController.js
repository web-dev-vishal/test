/**
 * Global-Fi Ultra - Alert Controller
 * 
 * HTTP request handlers for alert management endpoints.
 */

import { logger } from '../../config/logger.js';

/**
 * Alert Controller
 */
export class AlertController {
    /**
     * @param {Object} dependencies
     * @param {import('../../application/use-cases/ManageAlert.js').ManageAlert} dependencies.manageAlert
     */
    constructor({ manageAlert }) {
        this.manageAlert = manageAlert;
    }

    /**
     * GET /alerts - List alerts
     */
    async listAlerts(req, res, next) {
        try {
            const { userId, symbol, isActive, isTriggered, page, limit, sort } = req.query;

            if (userId) {
                // Get user's alerts
                const alerts = await this.manageAlert.getUserAlerts(userId, {
                    isActive: isActive !== undefined ? isActive : null,
                    sort: sort || '-createdAt',
                });

                return res.status(200).json({
                    requestId: req.requestId,
                    timestamp: new Date().toISOString(),
                    alerts,
                });
            }

            // List all alerts with pagination
            const filter = {};
            if (symbol) filter.symbol = symbol.toUpperCase();
            if (isActive !== undefined) filter.isActive = isActive;
            if (isTriggered !== undefined) filter.isTriggered = isTriggered;

            const result = await this.manageAlert.listAlerts({
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
     * GET /alerts/:id - Get alert by ID
     */
    async getAlert(req, res, next) {
        try {
            const alert = await this.manageAlert.getAlert(req.params.id);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                alert,
            });
        } catch (error) {
            if (error.message === 'Alert not found') {
                return res.status(404).json({
                    error: {
                        code: 'E4001',
                        message: 'Alert not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * POST /alerts - Create new alert
     */
    async createAlert(req, res, next) {
        try {
            const alert = await this.manageAlert.createAlert(req.body);

            res.status(201).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Alert created successfully',
                alert,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /alerts/:id - Update alert
     */
    async updateAlert(req, res, next) {
        try {
            const alert = await this.manageAlert.updateAlert(req.params.id, req.body);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Alert updated successfully',
                alert,
            });
        } catch (error) {
            if (error.message === 'Alert not found') {
                return res.status(404).json({
                    error: {
                        code: 'E4001',
                        message: 'Alert not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * DELETE /alerts/:id - Delete alert
     */
    async deleteAlert(req, res, next) {
        try {
            await this.manageAlert.deleteAlert(req.params.id);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Alert deleted successfully',
            });
        } catch (error) {
            if (error.message === 'Alert not found') {
                return res.status(404).json({
                    error: {
                        code: 'E4001',
                        message: 'Alert not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * PATCH /alerts/:id/activate - Activate alert
     */
    async activateAlert(req, res, next) {
        try {
            const alert = await this.manageAlert.updateAlert(req.params.id, { isActive: true });

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Alert activated successfully',
                alert,
            });
        } catch (error) {
            if (error.message === 'Alert not found') {
                return res.status(404).json({
                    error: {
                        code: 'E4001',
                        message: 'Alert not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * PATCH /alerts/:id/deactivate - Deactivate alert
     */
    async deactivateAlert(req, res, next) {
        try {
            const alert = await this.manageAlert.updateAlert(req.params.id, { isActive: false });

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'Alert deactivated successfully',
                alert,
            });
        } catch (error) {
            if (error.message === 'Alert not found') {
                return res.status(404).json({
                    error: {
                        code: 'E4001',
                        message: 'Alert not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }
}

export default AlertController;
