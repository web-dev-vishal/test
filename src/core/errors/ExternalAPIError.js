/**
 * Global-Fi Ultra - External API Error
 * 
 * Used for external API failures (E1001-E1004).
 */

import { AppError } from './AppError.js';

export class ExternalAPIError extends AppError {
    /**
     * @param {string} code - Error code (E1001-E1004)
     * @param {string} service - Service name that failed
     * @param {string} [details] - Error details
     * @param {Object} [originalError] - Original error object
     */
    constructor(code, service, details = null, originalError = null) {
        super(code, details, { service, originalError: originalError?.message });
        this.service = service;
        this.originalError = originalError;
    }
}

export default ExternalAPIError;
