/**
 * Global-Fi Ultra - Alert Model
 * 
 * Price alerts for financial assets.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Alert schema
 */
const alertSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    assetType: {
        type: String,
        enum: ['stock', 'crypto', 'forex', 'commodity', 'index'],
        default: 'stock',
    },
    condition: {
        type: String,
        required: true,
        enum: ['above', 'below', 'equals'],
    },
    targetPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    currentPrice: {
        type: Number,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isTriggered: {
        type: Boolean,
        default: false,
        index: true,
    },
    triggeredAt: {
        type: Date,
        default: null,
    },
    triggeredPrice: {
        type: Number,
        default: null,
    },
    notificationMethod: {
        email: {
            type: Boolean,
            default: true,
        },
        websocket: {
            type: Boolean,
            default: true,
        },
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    notes: {
        type: String,
        maxlength: 500,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    collection: 'alerts',
});

// Compound indexes for common queries
alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ symbol: 1, isActive: 1 });
alertSchema.index({ userId: 1, symbol: 1, isActive: 1 });
alertSchema.index({ isActive: 1, isTriggered: 1 });
alertSchema.index({ expiresAt: 1 });

// Method to check if alert should trigger
alertSchema.methods.checkTrigger = function (currentPrice) {
    if (!this.isActive || this.isTriggered) {
        return false;
    }

    // Check expiration
    if (this.expiresAt && new Date() > this.expiresAt) {
        this.isActive = false;
        return false;
    }

    let shouldTrigger = false;

    switch (this.condition) {
        case 'above':
            shouldTrigger = currentPrice > this.targetPrice;
            break;
        case 'below':
            shouldTrigger = currentPrice < this.targetPrice;
            break;
        case 'equals':
            // Allow 0.1% tolerance for equals
            const tolerance = this.targetPrice * 0.001;
            shouldTrigger = Math.abs(currentPrice - this.targetPrice) <= tolerance;
            break;
    }

    if (shouldTrigger) {
        this.isTriggered = true;
        this.triggeredAt = new Date();
        this.triggeredPrice = currentPrice;
        this.isActive = false; // Deactivate after triggering
    }

    this.currentPrice = currentPrice;
    return shouldTrigger;
};

// Method to reset alert
alertSchema.methods.reset = function () {
    this.isTriggered = false;
    this.triggeredAt = null;
    this.triggeredPrice = null;
    this.isActive = true;
    return this.save();
};

/**
 * Alert Model
 */
export const Alert = mongoose.model('Alert', alertSchema);

export default Alert;