/**
 * Global-Fi Ultra - Financial Asset Model
 * 
 * Tracks financial assets (stocks, crypto, forex) with current prices.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Financial Asset schema
 */
const financialAssetSchema = new Schema({
    symbol: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['stock', 'crypto', 'forex', 'commodity', 'index'],
        index: true,
    },
    currentPrice: {
        type: Number,
        default: null,
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
    },
    lastUpdated: {
        type: Date,
        default: null,
    },
    metadata: {
        exchange: String,
        sector: String,
        industry: String,
        marketCap: Number,
        description: String,
        website: String,
        logo: String,
    },
    priceHistory: [{
        price: Number,
        timestamp: Date,
        source: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'financial_assets',
});

// Compound indexes for common queries
financialAssetSchema.index({ type: 1, isActive: 1 });
financialAssetSchema.index({ symbol: 1, type: 1 });
financialAssetSchema.index({ createdAt: -1 });

// Method to update price
financialAssetSchema.methods.updatePrice = function (price, source = 'api') {
    this.currentPrice = price;
    this.lastUpdated = new Date();

    // Add to price history (keep last 100 entries)
    this.priceHistory.push({
        price,
        timestamp: new Date(),
        source,
    });

    if (this.priceHistory.length > 100) {
        this.priceHistory = this.priceHistory.slice(-100);
    }

    return this.save();
};

/**
 * Financial Asset Model
 */
export const FinancialAsset = mongoose.model('FinancialAsset', financialAssetSchema);

export default FinancialAsset;
