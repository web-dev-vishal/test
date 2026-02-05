/**
 * Global-Fi Ultra - Retry Strategy
 * 
 * Axios retry configuration with exponential backoff.
 */

import axiosRetry from 'axios-retry';
import { logger } from '../../config/logger.js';

/**
 * Configure axios instance with retry logic
 * @param {import('axios').AxiosInstance} axiosInstance
 * @param {Object} [options]
 * @param {number} [options.retries] - Number of retries
 * @param {number} [options.retryDelay] - Base delay in ms
 */
export const configureRetry = (axiosInstance, options = {}) => {
    const { retries = 3, retryDelay = 1000 } = options;

    axiosRetry(axiosInstance, {
        retries,
        retryDelay: (retryCount) => {
            // Exponential backoff: 1s, 2s, 4s
            return retryDelay * Math.pow(2, retryCount - 1);
        },
        retryCondition: (error) => {
            // Retry on network errors or 5xx errors
            return (
                axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                (error.response?.status >= 500 && error.response?.status < 600)
            );
        },
        onRetry: (retryCount, error, requestConfig) => {
            logger.warn(`Retry attempt ${retryCount} for ${requestConfig.url}`, {
                url: requestConfig.url,
                error: error.message,
                retryCount,
            });
        },
    });

    return axiosInstance;
};

export default configureRetry;
