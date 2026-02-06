/**
 * Global-Fi Ultra - Financial Asset Repository
 * 
 * Database operations for FinancialAsset model.
 */

import { FinancialAsset } from '../../models/index.js';
import { logger } from '../../config/logger.js';

/**
 * Financial Asset Repository
 */
export class FinancialAssetRepository {
    /**
     * Create a new asset
     * @param {Object} assetData - Asset data
     * @returns {Promise<Object>} Created asset
     */
    async create(assetData) {
        try {
            const asset = new FinancialAsset(assetData);
            await asset.save();
            logger.info('Financial asset created', { symbol: asset.symbol, type: asset.type });
            return asset;
        } catch (error) {
            logger.error('Error creating financial asset', { error: error.message });
            throw error;
        }
    }

    /**
     * Find asset by symbol
     * @param {string} symbol - Asset symbol
     * @returns {Promise<Object|null>} Asset or null
     */
    async findBySymbol(symbol) {
        try {
            return await FinancialAsset.findOne({ symbol: symbol.toUpperCase() });
        } catch (error) {
            logger.error('Error finding asset by symbol', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Find asset by ID
     * @param {string} id - Asset ID
     * @returns {Promise<Object|null>} Asset or null
     */
    async findById(id) {
        try {
            return await FinancialAsset.findById(id);
        } catch (error) {
            logger.error('Error finding asset by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Search/list assets with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Assets and pagination info
     */
    async findAll({ page = 1, limit = 20, filter = {}, sort = '-createdAt', search = '' } = {}) {
        try {
            const skip = (page - 1) * limit;

            // Add search functionality
            if (search) {
                filter.$or = [
                    { symbol: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                ];
            }

            const [assets, total] = await Promise.all([
                FinancialAsset.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                FinancialAsset.countDocuments(filter),
            ]);

            return {
                assets,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error finding assets', { error: error.message });
            throw error;
        }
    }

    /**
     * Update asset by symbol
     * @param {string} symbol - Asset symbol
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} Updated asset or null
     */
    async updateBySymbol(symbol, updateData) {
        try {
            const asset = await FinancialAsset.findOneAndUpdate(
                { symbol: symbol.toUpperCase() },
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (asset) {
                logger.info('Financial asset updated', { symbol });
            }

            return asset;
        } catch (error) {
            logger.error('Error updating asset', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Update asset price
     * @param {string} symbol - Asset symbol
     * @param {number} price - New price
     * @param {string} source - Price source
     * @returns {Promise<Object|null>} Updated asset or null
     */
    async updatePrice(symbol, price, source = 'api') {
        try {
            const asset = await this.findBySymbol(symbol);

            if (!asset) {
                return null;
            }

            await asset.updatePrice(price, source);
            logger.info('Asset price updated', { symbol, price, source });

            return asset;
        } catch (error) {
            logger.error('Error updating asset price', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Bulk update prices
     * @param {Array} updates - Array of {symbol, price, source}
     * @returns {Promise<number>} Number of updated assets
     */
    async bulkUpdatePrices(updates) {
        try {
            let updated = 0;

            for (const { symbol, price, source } of updates) {
                const result = await this.updatePrice(symbol, price, source);
                if (result) updated++;
            }

            logger.info('Bulk price update completed', { total: updates.length, updated });
            return updated;
        } catch (error) {
            logger.error('Error in bulk price update', { error: error.message });
            throw error;
        }
    }

    /**
     * Delete asset by symbol (soft delete)
     * @param {string} symbol - Asset symbol
     * @returns {Promise<Object|null>} Deleted asset or null
     */
    async deleteBySymbol(symbol) {
        try {
            const asset = await FinancialAsset.findOneAndUpdate(
                { symbol: symbol.toUpperCase() },
                { $set: { isActive: false } },
                { new: true }
            );

            if (asset) {
                logger.info('Financial asset soft deleted', { symbol });
            }

            return asset;
        } catch (error) {
            logger.error('Error deleting asset', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Get assets by type
     * @param {string} type - Asset type
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Assets
     */
    async findByType(type, { limit = 100, isActive = true } = {}) {
        try {
            return await FinancialAsset.find({ type, isActive })
                .sort('-lastUpdated')
                .limit(limit)
                .lean();
        } catch (error) {
            logger.error('Error finding assets by type', { type, error: error.message });
            throw error;
        }
    }
}

export default FinancialAssetRepository;
