/**
 * Global-Fi Ultra - Circuit Breaker Error
 * 
 * Used when circuit breaker is open (E1003).
 */

import { AppError } from './AppError.js';

export class CircuitBreakerError extends AppError {
    /**
     * @param {string} service - Service name that is circuit-broken
     * @param {string} [details] - Error details
     */
    constructor(service, details = null) {
        super('E1003', details || `Circuit breaker open for ${service}`, { service });
        this.service = service;
    }
}

export default CircuitBreakerError;
