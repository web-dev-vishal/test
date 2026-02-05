/**
 * Global-Fi Ultra - Alpha Vantage Client
 * 
 * Stock quotes from Alpha Vantage API.
 * Free tier: 5 requests/minute.
 */

import { BaseApiClient } from './BaseApiClient.js';
import { config } from '../../config/environment.js';
import { ValidationError } from '../../core/errors/index.js';
import { Money, Percentage } from '../../domain/value-objects/index.js';

/**
 * Alpha Vantage API client for stock data
 */
export class AlphaVantageClient extends BaseApiClient {
    /**
     * @param {Object} [options]
     * @param {Function} [options.onCircuitStateChange]
     */
    constructor(options = {}) {
        super('alpha_vantage', {
            baseURL: 'https://www.alphavantage.co',
            timeout: 15000,
            onCircuitStateChange: options.onCircuitStateChange,
        });

        this.apiKey = config.apiKeys.alphaVantage;
    }

    /**
     * Get global quote for a stock symbol
     * @param {string} [symbol='IBM'] - Stock symbol
     * @returns {Promise<Object>} Normalized stock quote
     */
    async getGlobalQuote(symbol = 'IBM') {
        const response = await this.get('/query', {
            function: 'GLOBAL_QUOTE',
            symbol,
            apikey: this.apiKey,
        });

        return this._normalizeQuote(response, symbol);
    }

    /**
     * Normalize Alpha Vantage response to Global-Fi schema
     * @private
     * @param {Object} response
     * @param {string} symbol
     * @returns {Object}
     */
    _normalizeQuote(response, symbol) {
        const quote = response['Global Quote'];

        // Handle API limit message
        if (response.Note || response.Information) {
            throw new ValidationError(
                'Alpha Vantage API limit or invalid response',
                [{ message: response.Note || response.Information }]
            );
        }

        if (!quote || Object.keys(quote).length === 0) {
            throw new ValidationError(
                `No quote data returned for symbol: ${symbol}`,
                [{ field: 'symbol', message: 'Invalid or unknown symbol' }]
            );
        }

        // Use Big.js for precision
        const price = new Money(quote['05. price'] || '0');
        const change = new Money(quote['09. change'] || '0');
        const changePercent = quote['10. change percent']?.replace('%', '') || '0';

        return {
            symbol: quote['01. symbol'] || symbol,
            price: price.toString(),
            change: change.toString(),
            changePercent: new Percentage(changePercent).toString(),
            open: quote['02. open'] || null,
            high: quote['03. high'] || null,
            low: quote['04. low'] || null,
            volume: quote['06. volume'] || null,
            latestTradingDay: quote['07. latest trading day'] || null,
            previousClose: quote['08. previous close'] || null,
            source: 'alpha_vantage',
        };
    }
}

export default AlphaVantageClient;
