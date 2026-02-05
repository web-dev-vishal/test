/**
 * Global-Fi Ultra - ExchangeRate Client
 * 
 * Currency exchange rates from ExchangeRate-API.
 * Free tier: 1500 requests/month.
 */

import { BaseApiClient } from './BaseApiClient.js';
import { ValidationError } from '../../core/errors/index.js';
import { Money } from '../../domain/value-objects/index.js';

/**
 * ExchangeRate-API client for forex data
 */
export class ExchangeRateClient extends BaseApiClient {
    /**
     * @param {Object} [options]
     * @param {Function} [options.onCircuitStateChange]
     */
    constructor(options = {}) {
        super('exchangerate_api', {
            baseURL: 'https://api.exchangerate-api.com/v4',
            timeout: 10000,
            onCircuitStateChange: options.onCircuitStateChange,
        });
    }

    /**
     * Get latest exchange rates for a base currency
     * @param {string} [base='USD'] - Base currency code
     * @returns {Promise<Object>} Normalized exchange rates
     */
    async getLatestRates(base = 'USD') {
        const response = await this.get(`/latest/${base.toUpperCase()}`);

        return this._normalizeResponse(response, base);
    }

    /**
     * Normalize ExchangeRate-API response to Global-Fi schema
     * @private
     * @param {Object} response
     * @param {string} base
     * @returns {Object}
     */
    _normalizeResponse(response, base) {
        if (!response || !response.rates) {
            throw new ValidationError(
                'No exchange rate data returned',
                [{ field: 'base', message: 'Invalid or unsupported base currency' }]
            );
        }

        // Use Big.js for precision on key rates
        const keyRates = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
        const normalizedRates = {};

        for (const currency of keyRates) {
            if (response.rates[currency]) {
                normalizedRates[currency] = new Money(response.rates[currency].toString()).toString();
            }
        }

        return {
            baseCurrency: response.base || base.toUpperCase(),
            rates: normalizedRates,
            allRates: Object.fromEntries(
                Object.entries(response.rates).map(([k, v]) => [k, new Money(v.toString()).toString()])
            ),
            date: response.date || new Date().toISOString().split('T')[0],
            provider: response.provider || 'exchangerate-api',
            source: 'exchangerate_api',
        };
    }
}

export default ExchangeRateClient;
