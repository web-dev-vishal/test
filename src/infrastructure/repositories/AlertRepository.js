/**
 * Global-Fi Ultra - Alert Repository
 * 
 * Database operations for Alert model.
 */

import { Alert } from '../../models/index.js';
import { logger } from '../../config/logger.js';

/**
 * Alert Repository
 */
export class AlertRepository {
    /**
     * Create a new alert
     * @param {Object} alertData - Alert data
     * @returns {Promise<Object>} Created alert
     */
    async create(alertData) {
        try {
            const alert = new Alert(alertData);
            await alert.save();
            logger.info('Alert created', { alertId: alert._id, userId: alert.userId, symbol: alert.symbol });
            return alert;
        } catch (error) {
            logger.error('Error creating alert', { error: error.message });
            throw error;
        }
    }

    /**
     * Find alert by ID
     * @param {string} id - Alert ID
     * @param {boolean} populate - Whether to populate user data
     * @returns {Promise<Object|null>} Alert or null
     */
    async findById(id, populate = false) {
        try {
            let query = Alert.findById(id);

            if (populate) {
                query = query.populate('userId', 'email firstName lastName');
            }

            return await query;
        } catch (error) {
            logger.error('Error finding alert by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Find alerts by user ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Alerts
     */
    async findByUserId(userId, { isActive = null, sort = '-createdAt', limit = 100 } = {}) {
        try {
            const filter = { userId };
            if (isActive !== null) {
                filter.isActive = isActive;
            }

            return await Alert.find(filter)
                .sort(sort)
                .limit(limit)
                .lean();
        } catch (error) {
            logger.error('Error finding alerts by user ID', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Find alerts by symbol
     * @param {string} symbol - Asset symbol
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Alerts
     */
    async findBySymbol(symbol, { isActive = true } = {}) {
        try {
            return await Alert.find({ symbol: symbol.toUpperCase(), isActive })
                .populate('userId', 'email firstName lastName')
                .lean();
        } catch (error) {
            logger.error('Error finding alerts by symbol', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Find all active alerts
     * @returns {Promise<Array>} Active alerts
     */
    async findActive() {
        try {
            return await Alert.find({ isActive: true, isTriggered: false })
                .populate('userId', 'email firstName lastName')
                .lean();
        } catch (error) {
            logger.error('Error finding active alerts', { error: error.message });
            throw error;
        }
    }

    /**
     * Find all alerts with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Alerts and pagination info
     */
    async findAll({ page = 1, limit = 20, filter = {}, sort = '-createdAt' } = {}) {
        try {
            const skip = (page - 1) * limit;

            const [alerts, total] = await Promise.all([
                Alert.find(filter)
                    .populate('userId', 'email firstName lastName')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Alert.countDocuments(filter),
            ]);

            return {
                alerts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error finding alerts', { error: error.message });
            throw error;
        }
    }

    /**
     * Update alert by ID
     * @param {string} id - Alert ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} Updated alert or null
     */
    async update(id, updateData) {
        try {
            const alert = await Alert.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (alert) {
                logger.info('Alert updated', { alertId: id });
            }

            return alert;
        } catch (error) {
            logger.error('Error updating alert', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Mark alert as triggered
     * @param {string} id - Alert ID
     * @param {number} triggeredPrice - Price at which alert was triggered
     * @returns {Promise<Object|null>} Updated alert or null
     */
    async markTriggered(id, triggeredPrice) {
        try {
            const alert = await Alert.findByIdAndUpdate(
                id,
                {
                    $set: {
                        isTriggered: true,
                        triggeredAt: new Date(),
                        triggeredPrice,
                        isActive: false,
                    },
                },
                { new: true }
            );

            if (alert) {
                logger.info('Alert marked as triggered', { alertId: id, triggeredPrice });
            }

            return alert;
        } catch (error) {
            logger.error('Error marking alert as triggered', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Check and trigger alerts for a symbol
     * @param {string} symbol - Asset symbol
     * @param {number} currentPrice - Current price
     * @returns {Promise<Array>} Triggered alerts
     */
    async checkAndTrigger(symbol, currentPrice) {
        try {
            const alerts = await this.findBySymbol(symbol, { isActive: true });
            const triggered = [];

            for (const alert of alerts) {
                const alertDoc = await Alert.findById(alert._id);
                if (alertDoc && alertDoc.checkTrigger(currentPrice)) {
                    await alertDoc.save();
                    triggered.push(alertDoc);
                }
            }

            if (triggered.length > 0) {
                logger.info('Alerts triggered', { symbol, count: triggered.length });
            }

            return triggered;
        } catch (error) {
            logger.error('Error checking and triggering alerts', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Delete alert by ID
     * @param {string} id - Alert ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        try {
            const result = await Alert.findByIdAndDelete(id);

            if (result) {
                logger.info('Alert deleted', { alertId: id });
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error deleting alert', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Deactivate expired alerts
     * @returns {Promise<number>} Number of deactivated alerts
     */
    async deactivateExpired() {
        try {
            const result = await Alert.updateMany(
                {
                    isActive: true,
                    expiresAt: { $lte: new Date() },
                },
                {
                    $set: { isActive: false },
                }
            );

            if (result.modifiedCount > 0) {
                logger.info('Expired alerts deactivated', { count: result.modifiedCount });
            }

            return result.modifiedCount;
        } catch (error) {
            logger.error('Error deactivating expired alerts', { error: error.message });
            throw error;
        }
    }
}

export default AlertRepository;
