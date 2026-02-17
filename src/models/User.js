// User model - accounts with preferences and metadata

import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
    // Primary identifier for authentication
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    // Bcrypt hash - select:false prevents accidental exposure in API responses
    passwordHash: {
        type: String,
        required: false,
        select: false,
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

    // Soft delete flag
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },

    // User preferences for financial data
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

    // Extensible metadata for additional data
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

// Virtual property for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Include virtuals in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Method to compare password with hash
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.passwordHash) {
        return false;
    }
    
    // Import bcrypt dynamically to avoid loading it if not needed
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to hash password
userSchema.statics.hashPassword = async function(password) {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 10);
};

export const User = mongoose.model('User', userSchema);

export default User;
