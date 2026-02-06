/**
 * Global-Fi Ultra - Manage Alert Use Case
 * 
 * Business logic for alert management operations.
 */

import { logger } from '../../config/logger.js';

/**
 * Manage Alert Use Case
 */
export class ManageAlert {
    /**
     * @param {Object} dependencies
     * @param {import('../../infrastructure/repositories/AlertRepository.js').AlertRepository} dependencies.alertRepository
     */
    constructor({ alertRepository }) {
        this.alertRepository = alertRepository;
    }

    /**
     * Create a new alert
     * @param {Object} alertData - Alert data
     * @returns {Promise<Object>} Created alert
     */
    async createAlert(alertData) {
        try {
            const alert = await this.alertRepository.create(alertData);
            logger.info('Alert created successfully', { alertId: alert._id });
            return alert;
        } catch (error) {
            logger.error('Error in createAlert use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Get alert by ID
     * @param {string} alertId - Alert ID
     * @returns {Promise<Object>} Alert
     */
    async getAlert(alertId) {
        try {
            const alert = await this.alertRepository.findById(alertId, true);

            if (!alert) {
                throw new Error('Alert not found');
            }

            return alert;
        } catch (error) {
            logger.error('Error in getAlert use case', { alertId, error: error.message });
            throw error;
        }
    }

    /**
     * Get user's alerts
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Alerts
     */
    async getUserAlerts(userId, options = {}) {
        try {
            return await this.alertRepository.findByUserId(userId, options);
        } catch (error) {
            logger.error('Error in getUserAlerts use case', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Get active alerts
     * @returns {Promise<Array>} Active alerts
     */
    async getActiveAlerts() {
        try {
            return await this.alertRepository.findActive();
        } catch (error) {
            logger.error('Error in getActiveAlerts use case', { error: error.message });
            throw error;
        }
    }

    /**
     * List all alerts with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Alerts and pagination info
     */
    async listAlerts(options = {}) {
        try {
            return await this.alertRepository.findAll(options);
        } catch (error) {
            logger.error('Error in listAlerts use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Update alert
     * @param {string} alertId - Alert ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated alert
     */
    async updateAlert(alertId, updateData) {
        try {
            const alert = await this.alertRepository.update(alertId, updateData);

            if (!alert) {
                throw new Error('Alert not found');
            }

            logger.info('Alert updated successfully', { alertId });
            return alert;
        } catch (error) {
            logger.error('Error in updateAlert use case', { alertId, error: error.message });
            throw error;
        }
    }

    /**
     * Delete alert
     * @param {string} alertId - Alert ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteAlert(alertId) {
        try {
            const success = await this.alertRepository.delete(alertId);

            if (!success) {
                throw new Error('Alert not found');
            }

            logger.info('Alert deleted successfully', { alertId });
            return success;
        } catch (error) {
            logger.error('Error in deleteAlert use case', { alertId, error: error.message });
            throw error;
        }
    }

    /**
     * Check and trigger alerts for a symbol
     * @param {string} symbol - Asset symbol
     * @param {number} currentPrice - Current price
     * @returns {Promise<Array>} Triggered alerts
     */
    async checkAndTriggerAlerts(symbol, currentPrice) {
        try {
            return await this.alertRepository.checkAndTrigger(symbol, currentPrice);
        } catch (error) {
            logger.error('Error in checkAndTriggerAlerts use case', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Deactivate expired alerts
     * @returns {Promise<number>} Number of deactivated alerts
     */
    async deactivateExpiredAlerts() {
        try {
            return await this.alertRepository.deactivateExpired();
        } catch (error) {
            logger.error('Error in deactivateExpiredAlerts use case', { error: error.message });
            throw error;
        }
    }
}

export default ManageAlert;
