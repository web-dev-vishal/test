/**
 * Global-Fi Ultra - Base Application Error
 * 
 * Base error class for all application errors with error codes.
 */

/**
 * Error codes mapping
 */
export const ErrorCodes = {
    E1001: { code: 'E1001', message: 'External API timeout', httpStatus: 504 },
    E1002: { code: 'E1002', message: 'External API rate limit exceeded', httpStatus: 429 },
    E1003: { code: 'E1003', message: 'Circuit breaker tripped', httpStatus: 503 },
    E1004: { code: 'E1004', message: 'Invalid API response format', httpStatus: 502 },
    E1005: { code: 'E1005', message: 'Database connection error', httpStatus: 503 },
    E1006: { code: 'E1006', message: 'Redis connection error', httpStatus: 503 },
    E1007: { code: 'E1007', message: 'Authentication failed', httpStatus: 401 },
    E1008: { code: 'E1008', message: 'Validation error', httpStatus: 400 },
    E1009: { code: 'E1009', message: 'Internal server error', httpStatus: 500 },
    E1010: { code: 'E1010', message: 'Service unavailable', httpStatus: 503 },
};

/**
 * Base application error class
 */
export class AppError extends Error {
    /**
     * @param {string} code - Error code from ErrorCodes
     * @param {string} [details] - Additional error details
     * @param {Object} [metadata] - Extra metadata for logging
     */
    constructor(code, details = null, metadata = {}) {
        const errorInfo = ErrorCodes[code] || ErrorCodes.E1009;

        super(details || errorInfo.message);

        this.name = this.constructor.name;
        this.code = errorInfo.code;
        this.httpStatus = errorInfo.httpStatus;
        this.details = details;
        this.metadata = metadata;
        this.timestamp = new Date().toISOString();
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON for API response
     * @param {boolean} includeStack - Include stack trace (dev only)
     */
    toJSON(includeStack = false) {
        const json = {
            error: {
                code: this.code,
                message: this.message,
                timestamp: this.timestamp,
            },
        };

        if (includeStack && this.stack) {
            json.error.stack = this.stack;
        }

        return json;
    }
}

export default AppError;
