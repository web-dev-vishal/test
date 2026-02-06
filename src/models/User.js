/**
 * Global-Fi Ultra - User Model
 * 
 * User management for authentication and profiles.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * User schema
 */
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
        type: String,
        required: false, // Optional for now, can be added when implementing auth
        select: false, // Don't return password hash in queries by default
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    preferences: {
        defaultCurrency: {
            type: String,
            default: 'USD',
            uppercase: true,
        },
        defaultStockSymbol: {
            type: String,
            default: 'IBM',
            uppercase: true,
        },
        defaultCryptoIds: {
            type: String,
            default: 'bitcoin,ethereum',
        },
        notifications: {
            email: {
                type: Boolean,
                default: true,
            },
            websocket: {
                type: Boolean,
                default: true,
            },
        },
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    collection: 'users',
});

// Indexes for common queries
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

/**
 * User Model
 */
export const User = mongoose.model('User', userSchema);

export default User;
