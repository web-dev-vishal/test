/**
 * Global-Fi Ultra - Database Error
 * 
 * Used for MongoDB connection/operation failures (E1005).
 */

import { AppError } from './AppError.js';

export class DatabaseError extends AppError {
    /**
     * @param {string} [details] - Error details
     * @param {Object} [originalError] - Original Mongoose error
     */
    constructor(details = null, originalError = null) {
        super('E1005', details, { originalError: originalError?.message });
        this.originalError = originalError;
    }
}

export default DatabaseError;
