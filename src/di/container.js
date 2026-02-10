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
import { config } from '../config/environment.js';

// AI Infrastructure
import { GroqClient } from '../infrastructure/ai/groqClient.js';
import { AINewsService } from '../application/services/AINewsService.js';
import { AIMarketService } from '../application/services/AIMarketService.js';
import { AIStreamHandler } from '../infrastructure/websocket/AIStreamHandler.js';
import { AIJobQueue } from '../infrastructure/messaging/AIJobQueue.js';
import { AIController } from '../presentation/controllers/AIController.js';

/**
 * DI Container
 */
export class Container {
    constructor() {
        this.instances = new Map();
        this.socketManager = null;
        this.aiStreamHandler = null;
    }

    /**
     * Initialize all services
     * @param {Object} options
     * @param {import('socket.io').Server} options.io - Socket.io server
     */
    async initialize(options) {  // ✅ ADDED 'async' keyword here
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

        // AI Infrastructure (only if API key is configured)
        let groqClient = null;
        let aiNewsService = null;
        let aiMarketService = null;
        let aiJobQueue = null;
        let aiController = null;

        if (config.ai.groqApiKey && config.ai.groqApiKey !== '') {
            try {
                logger.info('Initializing AI services...');

                // Initialize Groq client
                groqClient = new GroqClient({
                    apiKey: config.ai.groqApiKey,
                    cacheService: cache,
                    logger
                });

                // Validate API key
                await groqClient.validateApiKey();  // ✅ This line (125) now works because the function is async
                logger.info('✅ Groq API key validated');

                // Initialize AI services
                aiNewsService = new AINewsService({
                    groqClient,
                    cacheService: cache
                });

                aiMarketService = new AIMarketService({
                    groqClient,
                    cacheService: cache
                });

                // Initialize AI stream handler
                this.aiStreamHandler = new AIStreamHandler({
                    io,
                    groqClient,
                    aiNewsService,
                    aiMarketService
                });
                this.aiStreamHandler.initialize();
                logger.info('✅ AI WebSocket handler initialized');

                // Initialize job queue (optional - RabbitMQ might not be available)
                try {
                    aiJobQueue = new AIJobQueue({
                        aiNewsService,
                        aiMarketService
                    });
                    await aiJobQueue.connect();
                    await aiJobQueue.startConsumers();
                    logger.info('✅ AI job queue initialized');
                } catch (queueError) {
                    logger.warn('⚠️  AI job queue not available (RabbitMQ not connected)', {
                        error: queueError.message
                    });
                    aiJobQueue = null;
                }

                // Initialize AI controller
                aiController = new AIController({
                    aiNewsService,
                    aiMarketService,
                    aiJobQueue
                });

                logger.info('✅ AI services initialized successfully');
            } catch (error) {
                logger.error('❌ Failed to initialize AI services', {
                    error: error.message
                });
                logger.warn('⚠️  AI features will be disabled');
                // Set all to null if initialization fails
                groqClient = null;
                aiNewsService = null;
                aiMarketService = null;
                aiJobQueue = null;
                aiController = null;
                this.aiStreamHandler = null;
            }
        } else {
            logger.info('ℹ️  AI features disabled (GROQ_API_KEY not configured)');
        }

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

        // Store AI instances (may be null if not configured)
        this.instances.set('groqClient', groqClient);
        this.instances.set('aiNewsService', aiNewsService);
        this.instances.set('aiMarketService', aiMarketService);
        this.instances.set('aiJobQueue', aiJobQueue);
        this.instances.set('aiController', aiController);

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

    /**
     * Get AI Stream Handler
     * @returns {AIStreamHandler|null}
     */
    getAIStreamHandler() {
        return this.aiStreamHandler;
    }

    /**
     * Check if AI is enabled
     * @returns {boolean}
     */
    isAIEnabled() {
        return this.instances.get('aiController') !== null;
    }

    /**
     * Close AI job queue
     */
    async closeAIJobQueue() {
        const aiJobQueue = this.instances.get('aiJobQueue');
        if (aiJobQueue) {
            await aiJobQueue.close();
        }
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