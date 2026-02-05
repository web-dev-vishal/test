/**
 * Global-Fi Ultra - NewsAPI Client
 * 
 * Financial news from NewsAPI.
 * Free tier: 100 requests/day.
 */

import { BaseApiClient } from './BaseApiClient.js';
import { config } from '../../config/environment.js';
import { ValidationError } from '../../core/errors/index.js';

/**
 * NewsAPI client for financial news
 */
export class NewsAPIClient extends BaseApiClient {
    /**
     * @param {Object} [options]
     * @param {Function} [options.onCircuitStateChange]
     */
    constructor(options = {}) {
        super('newsapi', {
            baseURL: 'https://newsapi.org/api',
            timeout: 15000,
            headers: {
                'X-Api-Key': config.apiKeys.newsApi,
            },
            onCircuitStateChange: options.onCircuitStateChange,
        });
    }

    /**
     * Get financial news articles
     * @param {Object} [params]
     * @param {string} [params.q='finance OR stock market'] - Search query
     * @param {string} [params.language='en'] - Language code
     * @param {string} [params.sortBy='publishedAt'] - Sort order
     * @param {number} [params.pageSize=10] - Number of results
     * @returns {Promise<Object>} Normalized news articles
     */
    async getEverything(params = {}) {
        const {
            q = 'finance OR stock market',
            language = 'en',
            sortBy = 'publishedAt',
            pageSize = 10,
        } = params;

        const response = await this.get('/v2/everything', {
            q,
            language,
            sortBy,
            pageSize,
        });

        return this._normalizeResponse(response);
    }

    /**
     * Normalize NewsAPI response to Global-Fi schema
     * @private
     * @param {Object} response
     * @returns {Object}
     */
    _normalizeResponse(response) {
        // Handle API errors
        if (response.status === 'error') {
            throw new ValidationError(
                response.message || 'NewsAPI error',
                [{ message: response.code }]
            );
        }

        if (!response.articles || response.articles.length === 0) {
            return {
                articles: [],
                totalResults: 0,
                source: 'newsapi',
            };
        }

        const articles = response.articles.map(article => ({
            title: article.title || '',
            description: article.description || '',
            url: article.url || '',
            urlToImage: article.urlToImage || null,
            publishedAt: article.publishedAt || null,
            author: article.author || null,
            sourceName: article.source?.name || 'Unknown',
        }));

        return {
            articles,
            totalResults: response.totalResults || articles.length,
            source: 'newsapi',
        };
    }
}

export default NewsAPIClient;
