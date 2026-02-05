/**
 * Global-Fi Ultra - Dependency Injection Container
 * 
 * Constructor-based DI container for managing service instances.
 */

import { AlphaVantageClient, CoinGeckoClient, ExchangeRateClient, NewsAPIClient, FREDClient, FinnhubClient } from '../infrastructure/http/index.js';
import { RedisCache } from '../infrastructure/cache/index.js';
import { AuditLogRepository } from '../infrastructure/repositories/index.js';
import { SocketManager } from '../infrastructure/websocket/index.js';
import { OrchestrateFinancialData } from '../application/use-cases/index.js';
import { HealthController, FinancialController, AdminController, StatusController } from '../presentation/controllers/index.js';
import { logger } from '../config/logger.js';

/**
 * DI Container
 */
export class Container {
    constructor() {
        this.instances = new Map();
        this.socketManager = null;
    }

    /**
     * Initialize all services
     * @param {Object} options
     * @param {import('socket.io').Server} options.io - Socket.io server
     */
    initialize(options) {
        const { io } = options;

        // Circuit breaker state change callback
        const onCircuitStateChange = (change) => {
            if (this.socketManager) {
                this.socketManager.broadcastCircuitBreakerStateChange(change);
                if (change.newState === 'OPEN') {
                    this.socketManager.broadcastSystemWarning({
                        service: change.service,
                        message: `Circuit breaker tripped for ${change.service}`,
                        severity: 'warning',
                    });
                }
            }
        };

        // Infrastructure
        const cache = new RedisCache();
        const auditLogRepository = new AuditLogRepository();

        // API Clients
        const alphaVantageClient = new AlphaVantageClient({ onCircuitStateChange });
        const coinGeckoClient = new CoinGeckoClient({ onCircuitStateChange });
        const exchangeRateClient = new ExchangeRateClient({ onCircuitStateChange });
        const newsAPIClient = new NewsAPIClient({ onCircuitStateChange });
        const fredClient = new FREDClient({ onCircuitStateChange });
        const finnhubClient = new FinnhubClient({ onCircuitStateChange });

        const apiClients = [
            alphaVantageClient,
            coinGeckoClient,
            exchangeRateClient,
            newsAPIClient,
            fredClient,
            finnhubClient,
        ];

        // Socket Manager
        this.socketManager = new SocketManager(io);

        // Use Cases
        const orchestrateFinancialData = new OrchestrateFinancialData({
            alphaVantageClient,
            coinGeckoClient,
            exchangeRateClient,
            newsAPIClient,
            fredClient,
            finnhubClient,
            cache,
            auditLogRepository,
        });

        // Controllers
        const healthController = new HealthController();
        const financialController = new FinancialController({
            orchestrateFinancialData,
            socketManager: this.socketManager,
        });
        const adminController = new AdminController({
            cache,
            auditLogRepository,
        });
        const statusController = new StatusController({
            apiClients,
        });

        // Store instances
        this.instances.set('cache', cache);
        this.instances.set('auditLogRepository', auditLogRepository);
        this.instances.set('apiClients', apiClients);
        this.instances.set('orchestrateFinancialData', orchestrateFinancialData);
        this.instances.set('healthController', healthController);
        this.instances.set('financialController', financialController);
        this.instances.set('adminController', adminController);
        this.instances.set('statusController', statusController);

        logger.info('DI Container initialized');
    }

    /**
     * Get a service instance
     * @param {string} name
     * @returns {any}
     */
    get(name) {
        return this.instances.get(name);
    }

    /**
     * Get Socket Manager
     * @returns {SocketManager}
     */
    getSocketManager() {
        return this.socketManager;
    }
}

// Singleton instance
let container = null;

/**
 * Get or create container instance
 * @returns {Container}
 */
export const getContainer = () => {
    if (!container) {
        container = new Container();
    }
    return container;
};

export default getContainer;
