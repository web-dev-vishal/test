/**
 * Global-Fi Ultra - Manage Watchlist Use Case
 * 
 * Business logic for watchlist management operations.
 */

import { logger } from '../../config/logger.js';

/**
 * Manage Watchlist Use Case
 */
export class ManageWatchlist {
    /**
     * @param {Object} dependencies
     * @param {import('../../infrastructure/repositories/WatchlistRepository.js').WatchlistRepository} dependencies.watchlistRepository
     */
    constructor({ watchlistRepository }) {
        this.watchlistRepository = watchlistRepository;
    }

    /**
     * Create a new watchlist
     * @param {Object} watchlistData - Watchlist data
     * @returns {Promise<Object>} Created watchlist
     */
    async createWatchlist(watchlistData) {
        try {
            // Check if watchlist name already exists for user
            const exists = await this.watchlistRepository.nameExistsForUser(
                watchlistData.userId,
                watchlistData.name
            );

            if (exists) {
                throw new Error('Watchlist name already exists for this user');
            }

            const watchlist = await this.watchlistRepository.create(watchlistData);
            logger.info('Watchlist created successfully', { watchlistId: watchlist._id });

            return watchlist;
        } catch (error) {
            logger.error('Error in createWatchlist use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Get watchlist by ID
     * @param {string} watchlistId - Watchlist ID
     * @returns {Promise<Object>} Watchlist
     */
    async getWatchlist(watchlistId) {
        try {
            const watchlist = await this.watchlistRepository.findById(watchlistId, true);

            if (!watchlist) {
                throw new Error('Watchlist not found');
            }

            return watchlist;
        } catch (error) {
            logger.error('Error in getWatchlist use case', { watchlistId, error: error.message });
            throw error;
        }
    }

    /**
     * Get user's watchlists
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Watchlists
     */
    async getUserWatchlists(userId, options = {}) {
        try {
            return await this.watchlistRepository.findByUserId(userId, options);
        } catch (error) {
            logger.error('Error in getUserWatchlists use case', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * List all watchlists with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Watchlists and pagination info
     */
    async listWatchlists(options = {}) {
        try {
            return await this.watchlistRepository.findAll(options);
        } catch (error) {
            logger.error('Error in listWatchlists use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Update watchlist
     * @param {string} watchlistId - Watchlist ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated watchlist
     */
    async updateWatchlist(watchlistId, updateData) {
        try {
            const watchlist = await this.watchlistRepository.update(watchlistId, updateData);

            if (!watchlist) {
                throw new Error('Watchlist not found');
            }

            logger.info('Watchlist updated successfully', { watchlistId });
            return watchlist;
        } catch (error) {
            logger.error('Error in updateWatchlist use case', { watchlistId, error: error.message });
            throw error;
        }
    }

    /**
     * Add asset to watchlist
     * @param {string} watchlistId - Watchlist ID
     * @param {string} symbol - Asset symbol
     * @param {string} notes - Optional notes
     * @returns {Promise<Object>} Updated watchlist
     */
    async addAssetToWatchlist(watchlistId, symbol, notes = '') {
        try {
            const watchlist = await this.watchlistRepository.addAsset(watchlistId, symbol, notes);

            if (!watchlist) {
                throw new Error('Watchlist not found');
            }

            logger.info('Asset added to watchlist', { watchlistId, symbol });
            return watchlist;
        } catch (error) {
            logger.error('Error in addAssetToWatchlist use case', { watchlistId, symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Remove asset from watchlist
     * @param {string} watchlistId - Watchlist ID
     * @param {string} symbol - Asset symbol
     * @returns {Promise<Object>} Updated watchlist
     */
    async removeAssetFromWatchlist(watchlistId, symbol) {
        try {
            const watchlist = await this.watchlistRepository.removeAsset(watchlistId, symbol);

            if (!watchlist) {
                throw new Error('Watchlist not found');
            }

            logger.info('Asset removed from watchlist', { watchlistId, symbol });
            return watchlist;
        } catch (error) {
            logger.error('Error in removeAssetFromWatchlist use case', { watchlistId, symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Delete watchlist
     * @param {string} watchlistId - Watchlist ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteWatchlist(watchlistId) {
        try {
            const success = await this.watchlistRepository.delete(watchlistId);

            if (!success) {
                throw new Error('Watchlist not found');
            }

            logger.info('Watchlist deleted successfully', { watchlistId });
            return success;
        } catch (error) {
            logger.error('Error in deleteWatchlist use case', { watchlistId, error: error.message });
            throw error;
        }
    }
}

export default ManageWatchlist;
