/**
 * Global-Fi Ultra - Dependency Injection Container
 * 
 * Constructor-based DI container for managing service instances.
 */

import { AlphaVantageClient, CoinGeckoClient, ExchangeRateClient, NewsAPIClient, FREDClient, FinnhubClient } from '../infrastructure/http/index.js';
import { RedisCache } from '../infrastructure/cache/index.js';
import {
    AuditLogRepository,
    UserRepository,
    FinancialAssetRepository,
    WatchlistRepository,
    AlertRepository
} from '../infrastructure/repositories/index.js';
import { SocketManager } from '../infrastructure/websocket/index.js';
import { MessageQueue } from '../infrastructure/messaging/index.js';
import {
    OrchestrateFinancialData,
    ManageUser,
    ManageWatchlist,
    ManageAlert,
    ManageFinancialAsset
} from '../application/use-cases/index.js';
import {
    HealthController,
    FinancialController,
    AdminController,
    StatusController,
    UserController,
    WatchlistController,
    AlertController,
    AssetController
} from '../presentation/controllers/index.js';
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
        const userRepository = new UserRepository();
        const financialAssetRepository = new FinancialAssetRepository();
        const watchlistRepository = new WatchlistRepository();
        const alertRepository = new AlertRepository();

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

        const manageUser = new ManageUser({ userRepository });
        const manageWatchlist = new ManageWatchlist({ watchlistRepository });
        const manageAlert = new ManageAlert({ alertRepository });
        const manageFinancialAsset = new ManageFinancialAsset({ financialAssetRepository });

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
        const userController = new UserController({ manageUser });
        const watchlistController = new WatchlistController({ manageWatchlist });
        const alertController = new AlertController({ manageAlert });
        const assetController = new AssetController({
            manageFinancialAsset,
            orchestrateFinancialData,
        });

        // Store instances
        this.instances.set('cache', cache);
        this.instances.set('auditLogRepository', auditLogRepository);
        this.instances.set('userRepository', userRepository);
        this.instances.set('financialAssetRepository', financialAssetRepository);
        this.instances.set('watchlistRepository', watchlistRepository);
        this.instances.set('alertRepository', alertRepository);
        this.instances.set('apiClients', apiClients);
        this.instances.set('orchestrateFinancialData', orchestrateFinancialData);
        this.instances.set('manageUser', manageUser);
        this.instances.set('manageWatchlist', manageWatchlist);
        this.instances.set('manageAlert', manageAlert);
        this.instances.set('manageFinancialAsset', manageFinancialAsset);
        this.instances.set('healthController', healthController);
        this.instances.set('financialController', financialController);
        this.instances.set('adminController', adminController);
        this.instances.set('statusController', statusController);
        this.instances.set('userController', userController);
        this.instances.set('watchlistController', watchlistController);
        this.instances.set('alertController', alertController);
        this.instances.set('assetController', assetController);

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
