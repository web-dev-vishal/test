/**
 * Global-Fi Ultra - Validation Error
 * 
 * Used for request/response validation failures (E1008).
 */

import { AppError } from './AppError.js';

export class ValidationError extends AppError {
    /**
     * @param {string} details - Validation error details
     * @param {Array} [errors] - Array of validation errors
     */
    constructor(details, errors = []) {
        super('E1008', details, { validationErrors: errors });
        this.errors = errors;
    }
}

export default ValidationError;
