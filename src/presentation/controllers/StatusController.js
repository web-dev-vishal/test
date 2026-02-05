/**
 * Global-Fi Ultra - Status Controller
 * 
 * Circuit breaker and rate limit status endpoints.
 */

/**
 * Status controller
 */
export class StatusController {
    /**
     * @param {Object} dependencies
     * @param {Array} dependencies.apiClients - Array of API client instances
     */
    constructor(dependencies) {
        this.apiClients = dependencies.apiClients || [];
    }

    /**
     * Get circuit breaker states
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getCircuitBreakers(req, res) {
        const states = this.apiClients.map(client => client.getCircuitBreakerStatus());

        res.status(200).json({
            circuitBreakers: states,
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get rate limit usage (placeholder - would need Redis-backed tracking)
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getRateLimits(req, res) {
        // This is a placeholder - real implementation would track per-API rate limits
        const rateLimits = {
            alpha_vantage: { limit: 5, period: '1 minute', usage: 'N/A' },
            coingecko: { limit: 50, period: '1 minute', usage: 'N/A' },
            exchangerate_api: { limit: 1500, period: '1 month', usage: 'N/A' },
            newsapi: { limit: 100, period: '1 day', usage: 'N/A' },
            fred: { limit: 'unlimited', period: 'N/A', usage: 'N/A' },
            finnhub: { limit: 60, period: '1 minute', usage: 'N/A' },
        };

        res.status(200).json({
            rateLimits,
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
        });
    }
}

export default StatusController;
