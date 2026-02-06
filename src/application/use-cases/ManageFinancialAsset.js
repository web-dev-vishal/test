/**
 * Global-Fi Ultra - Manage Financial Asset Use Case
 * 
 * Business logic for financial asset management operations.
 */

import { logger } from '../../config/logger.js';

/**
 * Manage Financial Asset Use Case
 */
export class ManageFinancialAsset {
    /**
     * @param {Object} dependencies
     * @param {import('../../infrastructure/repositories/FinancialAssetRepository.js').FinancialAssetRepository} dependencies.financialAssetRepository
     */
    constructor({ financialAssetRepository }) {
        this.financialAssetRepository = financialAssetRepository;
    }

    /**
     * Create a new asset
     * @param {Object} assetData - Asset data
     * @returns {Promise<Object>} Created asset
     */
    async createAsset(assetData) {
        try {
            // Check if asset already exists
            const existing = await this.financialAssetRepository.findBySymbol(assetData.symbol);
            if (existing) {
                throw new Error('Asset with this symbol already exists');
            }

            const asset = await this.financialAssetRepository.create(assetData);
            logger.info('Financial asset created successfully', { symbol: asset.symbol });

            return asset;
        } catch (error) {
            logger.error('Error in createAsset use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Get asset by symbol
     * @param {string} symbol - Asset symbol
     * @returns {Promise<Object>} Asset
     */
    async getAsset(symbol) {
        try {
            const asset = await this.financialAssetRepository.findBySymbol(symbol);

            if (!asset) {
                throw new Error('Asset not found');
            }

            return asset;
        } catch (error) {
            logger.error('Error in getAsset use case', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Search/list assets
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Assets and pagination info
     */
    async searchAssets(options = {}) {
        try {
            return await this.financialAssetRepository.findAll(options);
        } catch (error) {
            logger.error('Error in searchAssets use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Update asset
     * @param {string} symbol - Asset symbol
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated asset
     */
    async updateAsset(symbol, updateData) {
        try {
            const asset = await this.financialAssetRepository.updateBySymbol(symbol, updateData);

            if (!asset) {
                throw new Error('Asset not found');
            }

            logger.info('Asset updated successfully', { symbol });
            return asset;
        } catch (error) {
            logger.error('Error in updateAsset use case', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Update asset price
     * @param {string} symbol - Asset symbol
     * @param {number} price - New price
     * @param {string} source - Price source
     * @returns {Promise<Object>} Updated asset
     */
    async updateAssetPrice(symbol, price, source = 'api') {
        try {
            const asset = await this.financialAssetRepository.updatePrice(symbol, price, source);

            if (!asset) {
                throw new Error('Asset not found');
            }

            return asset;
        } catch (error) {
            logger.error('Error in updateAssetPrice use case', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Delete asset
     * @param {string} symbol - Asset symbol
     * @returns {Promise<Object>} Deleted asset
     */
    async deleteAsset(symbol) {
        try {
            const asset = await this.financialAssetRepository.deleteBySymbol(symbol);

            if (!asset) {
                throw new Error('Asset not found');
            }

            logger.info('Asset deleted successfully', { symbol });
            return asset;
        } catch (error) {
            logger.error('Error in deleteAsset use case', { symbol, error: error.message });
            throw error;
        }
    }

    /**
     * Get assets by type
     * @param {string} type - Asset type
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Assets
     */
    async getAssetsByType(type, options = {}) {
        try {
            return await this.financialAssetRepository.findByType(type, options);
        } catch (error) {
            logger.error('Error in getAssetsByType use case', { type, error: error.message });
            throw error;
        }
    }
}

export default ManageFinancialAsset;
