/**
 * Global-Fi Ultra - Watchlist Repository
 * 
 * Database operations for Watchlist model.
 */

import { Watchlist } from '../../models/index.js';
import { logger } from '../../config/logger.js';

/**
 * Watchlist Repository
 */
export class WatchlistRepository {
    /**
     * Create a new watchlist
     * @param {Object} watchlistData - Watchlist data
     * @returns {Promise<Object>} Created watchlist
     */
    async create(watchlistData) {
        try {
            const watchlist = new Watchlist(watchlistData);
            await watchlist.save();
            logger.info('Watchlist created', { watchlistId: watchlist._id, userId: watchlist.userId });
            return watchlist;
        } catch (error) {
            logger.error('Error creating watchlist', { error: error.message });
            throw error;
        }
    }

    /**
     * Find watchlist by ID
     * @param {string} id - Watchlist ID
     * @param {boolean} populate - Whether to populate user data
     * @returns {Promise<Object|null>} Watchlist or null
     */
    async findById(id, populate = false) {
        try {
            let query = Watchlist.findById(id);

            if (populate) {
                query = query.populate('userId', 'email firstName lastName');
            }

            return await query;
        } catch (error) {
            logger.error('Error finding watchlist by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Find watchlists by user ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Watchlists
     */
    async findByUserId(userId, { sort = '-createdAt', limit = 100 } = {}) {
        try {
            return await Watchlist.find({ userId })
                .sort(sort)
                .limit(limit)
                .lean();
        } catch (error) {
            logger.error('Error finding watchlists by user ID', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Find all watchlists with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Watchlists and pagination info
     */
    async findAll({ page = 1, limit = 20, filter = {}, sort = '-createdAt' } = {}) {
        try {
            const skip = (page - 1) * limit;

            const [watchlists, total] = await Promise.all([
                Watchlist.find(filter)
                    .populate('userId', 'email firstName lastName')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Watchlist.countDocuments(filter),
            ]);

            return {
                watchlists,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error finding watchlists', { error: error.message });
            throw error;
        }
    }

    /**
     * Update watchlist by ID
     * @param {string} id - Watchlist ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} Updated watchlist or null
     */
    async update(id, updateData) {
        try {
            const watchlist = await Watchlist.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (watchlist) {
                logger.info('Watchlist updated', { watchlistId: id });
            }

            return watchlist;
        } catch (error) {
            logger.error('Error updating watchlist', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Add asset to watchlist
     * @param {string} id - Watchlist ID
     * @param {string} symbol - Asset symbol
     * @param {string} notes - Optional notes
     * @returns {Promise<Object|null>} Updated watchlist or null
     */
    async addAsset(id, symbol, notes = '') {
        try {
            const watchlist = await Watchlist.findById(id);

            if (!watchlist) {
                return null;
            }

            await watchlist.addAsset(symbol, notes);
            logger.info('Asset added to watchlist', { watchlistId: id, symbol });

            return watchlist;
        } catch (error) {
            logger.error('Error adding asset to watchlist', { id, symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Remove asset from watchlist
     * @param {string} id - Watchlist ID
     * @param {string} symbol - Asset symbol
     * @returns {Promise<Object|null>} Updated watchlist or null
     */
    async removeAsset(id, symbol) {
        try {
            const watchlist = await Watchlist.findById(id);

            if (!watchlist) {
                return null;
            }

            await watchlist.removeAsset(symbol);
            logger.info('Asset removed from watchlist', { watchlistId: id, symbol });

            return watchlist;
        } catch (error) {
            logger.error('Error removing asset from watchlist', { id, symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Delete watchlist by ID
     * @param {string} id - Watchlist ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        try {
            const result = await Watchlist.findByIdAndDelete(id);

            if (result) {
                logger.info('Watchlist deleted', { watchlistId: id });
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error deleting watchlist', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Check if watchlist name exists for user
     * @param {string} userId - User ID
     * @param {string} name - Watchlist name
     * @param {string} excludeId - Watchlist ID to exclude
     * @returns {Promise<boolean>} True if exists
     */
    async nameExistsForUser(userId, name, excludeId = null) {
        try {
            const query = { userId, name };
            if (excludeId) {
                query._id = { $ne: excludeId };
            }

            const count = await Watchlist.countDocuments(query);
            return count > 0;
        } catch (error) {
            logger.error('Error checking watchlist name existence', { userId, name, error: error.message });
            throw error;
        }
    }
}

export default WatchlistRepository;
