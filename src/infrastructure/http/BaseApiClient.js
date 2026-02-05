/**
 * Global-Fi Ultra - Base API Client
 * 
 * Abstract base class for all external API clients.
 * Includes circuit breaker integration, retry logic, and error handling.
 */

import axios from 'axios';
import { configureRetry } from '../resilience/RetryStrategy.js';
import { CircuitBreaker } from '../resilience/CircuitBreaker.js';
import { ExternalAPIError } from '../../core/errors/index.js';
import { logger } from '../../config/logger.js';

/**
 * Base API client with resilience patterns
 */
export class BaseApiClient {
    /**
     * @param {string} name - Client name for logging
     * @param {Object} options
     * @param {string} options.baseURL - Base URL for API
     * @param {number} [options.timeout] - Request timeout in ms
     * @param {Object} [options.headers] - Default headers
     * @param {Function} [options.onCircuitStateChange] - Circuit breaker state change callback
     */
    constructor(name, options) {
        this.name = name;
        this.baseURL = options.baseURL;

        // Create axios instance
        this.client = axios.create({
            baseURL: options.baseURL,
            timeout: options.timeout || 10000,
            headers: {
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        // Configure retry logic
        configureRetry(this.client, {
            retries: 3,
            retryDelay: 1000,
        });

        // Create circuit breaker
        this.circuitBreaker = new CircuitBreaker(name, {
            onStateChange: options.onCircuitStateChange,
        });

        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            config.metadata = { startTime: Date.now() };
            logger.debug(`API Request: ${this.name}`, {
                url: config.url,
                method: config.method,
            });
            return config;
        });

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                const duration = Date.now() - response.config.metadata.startTime;
                logger.debug(`API Response: ${this.name}`, {
                    url: response.config.url,
                    status: response.status,
                    duration: `${duration}ms`,
                });
                return response;
            },
            (error) => {
                const duration = error.config?.metadata
                    ? Date.now() - error.config.metadata.startTime
                    : 0;
                logger.error(`API Error: ${this.name}`, {
                    url: error.config?.url,
                    status: error.response?.status,
                    message: error.message,
                    duration: `${duration}ms`,
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Execute a request through the circuit breaker
     * @protected
     * @template T
     * @param {Function} requestFn - Function that returns a promise
     * @returns {Promise<T>}
     */
    async executeWithCircuitBreaker(requestFn) {
        return this.circuitBreaker.execute(requestFn);
    }

    /**
     * Make a GET request
     * @protected
     * @param {string} endpoint - API endpoint
     * @param {Object} [params] - Query parameters
     * @returns {Promise<Object>}
     */
    async get(endpoint, params = {}) {
        return this.executeWithCircuitBreaker(async () => {
            try {
                const response = await this.client.get(endpoint, { params });
                return response.data;
            } catch (error) {
                throw this._handleError(error);
            }
        });
    }

    /**
     * Handle and transform API errors
     * @protected
     * @param {Error} error
     * @returns {ExternalAPIError}
     */
    _handleError(error) {
        // Timeout error
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return new ExternalAPIError('E1001', this.name, 'Request timeout', error);
        }

        // Rate limit error (usually 429)
        if (error.response?.status === 429) {
            return new ExternalAPIError('E1002', this.name, 'Rate limit exceeded', error);
        }

        // Invalid response format
        if (error.response?.status >= 400 && error.response?.status < 500) {
            return new ExternalAPIError('E1004', this.name, `Invalid response: ${error.response?.status}`, error);
        }

        // Server error
        if (error.response?.status >= 500) {
            return new ExternalAPIError('E1001', this.name, `Server error: ${error.response?.status}`, error);
        }

        // Network error
        return new ExternalAPIError('E1001', this.name, error.message, error);
    }

    /**
     * Get circuit breaker status
     * @returns {Object}
     */
    getCircuitBreakerStatus() {
        return this.circuitBreaker.getStatus();
    }
}

export default BaseApiClient;
