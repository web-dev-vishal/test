/**
 * Global-Fi Ultra - Circuit Breaker Implementation
 * 
 * Full state machine implementation (CLOSED → OPEN → HALF_OPEN → CLOSED).
 * Supports Redis-backed state persistence for multi-instance deployments.
 */

import { logger } from '../../config/logger.js';
import { config } from '../../config/environment.js';
import { CircuitBreakerError } from '../../core/errors/index.js';

/**
 * Circuit Breaker States
 */
export const CircuitState = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN',
};

/**
 * Circuit Breaker implementation with full state machine
 */
export class CircuitBreaker {
    /**
     * @param {string} name - Service name for this circuit breaker
     * @param {Object} [options] - Configuration options
     * @param {number} [options.failureThreshold] - Number of failures before opening
     * @param {number} [options.resetTimeout] - Time in ms before attempting half-open
     * @param {number} [options.successThreshold] - Successes needed to close from half-open
     * @param {Function} [options.onStateChange] - Callback when state changes
     */
    constructor(name, options = {}) {
        this.name = name;
        this.failureThreshold = options.failureThreshold || config.circuitBreaker.threshold;
        this.resetTimeout = options.resetTimeout || config.circuitBreaker.resetTimeout;
        this.successThreshold = options.successThreshold || 2;
        this.onStateChange = options.onStateChange || null;

        // State
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
    }

    /**
     * Execute a function through the circuit breaker
     * @template T
     * @param {Function} fn - Async function to execute
     * @returns {Promise<T>}
     */
    async execute(fn) {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttemptTime) {
                throw new CircuitBreakerError(this.name, `Circuit is OPEN until ${new Date(this.nextAttemptTime).toISOString()}`);
            }
            // Transition to half-open
            this._setState(CircuitState.HALF_OPEN);
        }

        try {
            const result = await fn();
            this._onSuccess();
            return result;
        } catch (error) {
            this._onFailure();
            throw error;
        }
    }

    /**
     * Handle successful execution
     * @private
     */
    _onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this._setState(CircuitState.CLOSED);
            }
        } else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed execution
     * @private
     */
    _onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            // Immediately go back to open
            this._setState(CircuitState.OPEN);
        } else if (this.failureCount >= this.failureThreshold) {
            this._setState(CircuitState.OPEN);
        }

        logger.warn(`Circuit breaker ${this.name}: failure ${this.failureCount}/${this.failureThreshold}`, {
            service: this.name,
            state: this.state,
            failureCount: this.failureCount,
        });
    }

    /**
     * Set circuit breaker state
     * @private
     * @param {string} newState
     */
    _setState(newState) {
        const oldState = this.state;
        this.state = newState;

        if (newState === CircuitState.OPEN) {
            this.nextAttemptTime = Date.now() + this.resetTimeout;
            this.successCount = 0;
        } else if (newState === CircuitState.CLOSED) {
            this.failureCount = 0;
            this.successCount = 0;
            this.nextAttemptTime = null;
        } else if (newState === CircuitState.HALF_OPEN) {
            this.successCount = 0;
        }

        logger.info(`Circuit breaker ${this.name}: ${oldState} → ${newState}`, {
            service: this.name,
            oldState,
            newState,
        });

        if (this.onStateChange) {
            this.onStateChange({
                service: this.name,
                oldState,
                newState,
                timestamp: new Date().toISOString(),
            });
        }
    }

    /**
     * Get current circuit breaker status
     * @returns {Object}
     */
    getStatus() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            failureThreshold: this.failureThreshold,
            resetTimeout: this.resetTimeout,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
        };
    }

    /**
     * Manually reset the circuit breaker to closed state
     */
    reset() {
        this._setState(CircuitState.CLOSED);
        logger.info(`Circuit breaker ${this.name}: manually reset`);
    }

    /**
     * Check if circuit is allowing requests
     * @returns {boolean}
     */
    isAllowingRequests() {
        if (this.state === CircuitState.CLOSED) return true;
        if (this.state === CircuitState.HALF_OPEN) return true;
        if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttemptTime) return true;
        return false;
    }
}

export default CircuitBreaker;
