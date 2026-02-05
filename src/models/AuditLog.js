/**
 * Global-Fi Ultra - Audit Log Model
 * 
 * Mongoose schema for orchestration audit logs.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Individual API call result schema
 */
const apiCallResultSchema = new Schema({
    service: {
        type: String,
        required: true,
        enum: ['alpha_vantage', 'coingecko', 'exchangerate_api', 'newsapi', 'fred', 'finnhub'],
    },
    status: {
        type: String,
        required: true,
        enum: ['success', 'error', 'cached'],
    },
    duration: {
        type: Number,
        required: true,
    },
    cached: {
        type: Boolean,
        default: false,
    },
    errorCode: {
        type: String,
        default: null,
    },
    errorMessage: {
        type: String,
        default: null,
    },
}, { _id: false });

/**
 * Audit log schema
 */
const auditLogSchema = new Schema({
    requestId: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['success', 'partial', 'error'],
    },
    totalDuration: {
        type: Number,
        required: true,
    },
    apiCalls: [apiCallResultSchema],
    cacheHits: {
        type: Number,
        default: 0,
    },
    apiCallsMade: {
        type: Number,
        default: 0,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    collection: 'audit_logs',
});

// Indexes for common queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

/**
 * Audit Log Model
 */
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
