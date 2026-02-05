/**
 * Global-Fi Ultra - Finnhub Client
 * 
 * Market news from Finnhub.
 * Free tier: 60 requests/minute.
 */

import { BaseApiClient } from './BaseApiClient.js';
import { config } from '../../config/environment.js';
import { ValidationError } from '../../core/errors/index.js';

/**
 * Finnhub API client for market news
 */
export class FinnhubClient extends BaseApiClient {
    /**
     * @param {Object} [options]
     * @param {Function} [options.onCircuitStateChange]
     */
    constructor(options = {}) {
        super('finnhub', {
            baseURL: 'https://finnhub.io/api/v1',
            timeout: 15000,
            onCircuitStateChange: options.onCircuitStateChange,
        });

        this.apiKey = config.apiKeys.finnhub;
    }

    /**
     * Get market news
     * @param {Object} [params]
     * @param {string} [params.category='general'] - News category
     * @returns {Promise<Object>} Normalized news data
     */
    async getMarketNews(params = {}) {
        const { category = 'general' } = params;

        const response = await this.get('/news', {
            category,
            token: this.apiKey,
        });

        return this._normalizeResponse(response);
    }

    /**
     * Normalize Finnhub response to Global-Fi schema
     * @private
     * @param {Array} response
     * @returns {Object}
     */
    _normalizeResponse(response) {
        if (!Array.isArray(response)) {
            throw new ValidationError(
                'Invalid Finnhub response format',
                [{ message: 'Expected array of news items' }]
            );
        }

        if (response.length === 0) {
            return {
                news: [],
                source: 'finnhub',
            };
        }

        // Take top 10 news items
        const news = response.slice(0, 10).map(item => ({
            id: item.id?.toString() || null,
            headline: item.headline || '',
            summary: item.summary || '',
            url: item.url || '',
            image: item.image || null,
            datetime: item.datetime
                ? new Date(item.datetime * 1000).toISOString()
                : null,
            category: item.category || 'general',
            related: item.related || null,
            sourceName: item.source || 'Unknown',
        }));

        return {
            news,
            source: 'finnhub',
        };
    }
}

export default FinnhubClient;
