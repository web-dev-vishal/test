# AI Integration Guide

Step-by-step guide to integrate AI features into your existing Global-Fi Ultra server.

## Prerequisites

- ✅ Node.js 18+
- ✅ Redis running
- ✅ MongoDB running
- ✅ Groq API key
- ✅ RabbitMQ (optional)

## Step 1: Update Dependency Injection Container

Edit `src/di/container.js`:

```javascript
import { GroqClient } from '../infrastructure/ai/groqClient.js';
import { AINewsService } from '../application/services/AINewsService.js';
import { AIMarketService } from '../application/services/AIMarketService.js';
import { AIJobQueue } from '../infrastructure/messaging/AIJobQueue.js';
import { AIController } from '../presentation/controllers/AIController.js';
import { AIStreamHandler } from '../infrastructure/websocket/AIStreamHandler.js';

// ... existing imports

export const createContainer = async () => {
  // ... existing code

  // Initialize AI services
  const groqClient = new GroqClient({
    apiKey: config.ai.groqApiKey,
    cacheService: redisCache,
    logger
  });

  const aiNewsService = new AINewsService({
    groqClient,
    cacheService: redisCache
  });

  const aiMarketService = new AIMarketService({
    groqClient,
    cacheService: redisCache
  });

  // Optional: Job queue
  let aiJobQueue = null;
  try {
    aiJobQueue = new AIJobQueue({
      aiNewsService,
      aiMarketService
    });
    await aiJobQueue.connect();
    await aiJobQueue.startConsumers();
    logger.info('AI job queue initialized');
  } catch (error) {
    logger.warn('AI job queue not available', { error: error.message });
  }

  const aiController = new AIController({
    aiNewsService,
    aiMarketService,
    aiJobQueue
  });

  return {
    // ... existing services
    groqClient,
    aiNewsService,
    aiMarketService,
    aiJobQueue,
    aiController
  };
};
```

## Step 2: Add AI Routes

Edit `src/server.js`:

```javascript
import { createAIRoutes } from './presentation/routes/aiRoutes.js';

// ... existing code

// After creating container
const container = await createContainer();

// ... existing routes

// Add AI routes
app.use('/api/v1/ai', createAIRoutes(container.aiController));

logger.info('AI routes mounted at /api/v1/ai');
```

## Step 3: Add WebSocket AI Handler

Edit your Socket.io setup (likely in `src/server.js` or `src/infrastructure/websocket/SocketManager.js`):

```javascript
import { AIStreamHandler } from './infrastructure/websocket/AIStreamHandler.js';

// After creating Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: config.security.corsOrigins,
    methods: ['GET', 'POST']
  }
});

// Initialize AI stream handler
const aiStreamHandler = new AIStreamHandler({
  io,
  groqClient: container.groqClient,
  aiNewsService: container.aiNewsService,
  aiMarketService: container.aiMarketService
});

aiStreamHandler.initialize();

logger.info('AI WebSocket handler initialized');
```

## Step 4: Update Health Check

Edit your health check endpoint to include AI status:

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: await checkMongoConnection(),
      redis: await checkRedisConnection(),
      ai: {
        enabled: !!container.groqClient,
        jobQueueEnabled: !!container.aiJobQueue
      }
    }
  };

  res.json(health);
});
```

## Step 5: Add Graceful Shutdown

Update your shutdown handler:

```javascript
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close AI job queue
  if (container.aiJobQueue) {
    await container.aiJobQueue.close();
    logger.info('AI job queue closed');
  }

  // Close Redis
  await closeRedisConnection();

  // Close MongoDB
  await mongoose.connection.close();

  logger.info('Shutdown complete');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

## Step 6: Test Integration

### Test HTTP Endpoints

```bash
# Start server
npm run dev

# Test sentiment analysis
curl -X POST http://localhost:3000/api/v1/ai/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text":"Stock market rallies on strong earnings"}'

# Test asset analysis
curl -X POST http://localhost:3000/api/v1/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "priceData": {
      "current": 150,
      "change24h": 2.5,
      "volume": 50000000
    }
  }'
```

### Test WebSocket

Open `examples/websocket-client.html` in your browser and test the chat interface.

### Test Redis Cache

```bash
npm run redis:monitor
```

## Step 7: Add to Existing Controllers (Optional)

You can add AI features to existing controllers. For example, in `FinancialController.js`:

```javascript
export class FinancialController {
  constructor({ orchestrator, aiMarketService }) {
    this.orchestrator = orchestrator;
    this.aiMarketService = aiMarketService;
  }

  getLiveData = async (req, res) => {
    try {
      const data = await this.orchestrator.fetchAllData();

      // Add AI insights
      if (this.aiMarketService && data.stocks?.length > 0) {
        const topStock = data.stocks[0];
        const analysis = await this.aiMarketService.analyzeAsset(
          topStock.symbol,
          {
            current: topStock.price,
            change24h: topStock.changePercent,
            volume: topStock.volume
          }
        );

        data.aiInsights = {
          topStock: topStock.symbol,
          analysis
        };
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      // ... error handling
    }
  };
}
```

## Step 8: Add AI to Existing Routes

Enhance existing endpoints with AI. For example, in `AssetController.js`:

```javascript
getAssetDetails = async (req, res) => {
  try {
    const { symbol } = req.params;

    // Get asset data
    const asset = await this.assetRepository.findBySymbol(symbol);

    // Add AI explanation if price changed significantly
    if (Math.abs(asset.changePercent) > 5 && this.aiMarketService) {
      const explanation = await this.aiMarketService.explainMovement(
        symbol,
        asset.changePercent,
        asset.recentNews || []
      );

      asset.aiExplanation = explanation;
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    // ... error handling
  }
};
```

## Step 9: Environment Variables

Ensure your `.env` file has:

```env
# Groq AI
GROQ_API_KEY=gsk_your_key_here
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant

# RabbitMQ (optional)
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_PREFIX=globalfi
```

## Step 10: Update Documentation

Update your API documentation to include AI endpoints:

```markdown
## AI Endpoints

### Sentiment Analysis
POST /api/v1/ai/sentiment
Body: { text: string }

### Asset Analysis
POST /api/v1/ai/analyze
Body: { symbol: string, priceData: object }

### Investment Recommendations
POST /api/v1/ai/recommend
Body: { userProfile: object, marketData: array }

... (see docs/AI_FEATURES.md for full list)
```

## Complete Integration Example

Here's a minimal complete integration in `src/server.js`:

```javascript
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Existing imports
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { logger } from './config/logger.js';
import { config } from './config/environment.js';

// AI imports
import { GroqClient } from './infrastructure/ai/groqClient.js';
import { AINewsService } from './application/services/AINewsService.js';
import { AIMarketService } from './application/services/AIMarketService.js';
import { AIStreamHandler } from './infrastructure/websocket/AIStreamHandler.js';
import { AIController } from './presentation/controllers/AIController.js';
import { createAIRoutes } from './presentation/routes/aiRoutes.js';
import { RedisCache } from './infrastructure/cache/RedisCache.js';

const startServer = async () => {
  // Connect to databases
  await connectDatabase();
  await connectRedis();

  // Initialize Express
  const app = express();
  const httpServer = createServer(app);

  app.use(express.json());

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: { origin: config.security.corsOrigins }
  });

  // Initialize AI services
  const cacheService = new RedisCache();
  
  const groqClient = new GroqClient({
    apiKey: config.ai.groqApiKey,
    cacheService,
    logger
  });

  const aiNewsService = new AINewsService({
    groqClient,
    cacheService
  });

  const aiMarketService = new AIMarketService({
    groqClient,
    cacheService
  });

  // Initialize AI WebSocket handler
  const aiStreamHandler = new AIStreamHandler({
    io,
    groqClient,
    aiNewsService,
    aiMarketService
  });
  aiStreamHandler.initialize();

  // Initialize AI controller
  const aiController = new AIController({
    aiNewsService,
    aiMarketService
  });

  // Mount routes
  app.use('/api/v1/ai', createAIRoutes(aiController));

  // ... mount other routes

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      ai: { enabled: true }
    });
  });

  // Start server
  const PORT = config.server.port;
  httpServer.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    logger.info('AI features enabled');
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
```

## Verification Checklist

After integration, verify:

- [ ] Server starts without errors
- [ ] `/health` endpoint shows AI enabled
- [ ] POST `/api/v1/ai/sentiment` works
- [ ] POST `/api/v1/ai/analyze` works
- [ ] WebSocket connection works
- [ ] Redis cache stores AI responses
- [ ] Logs show AI operations
- [ ] Error handling works (try invalid API key)

## Troubleshooting

### Server won't start

**Check:**
1. All imports are correct
2. `.env` has `GROQ_API_KEY`
3. Redis is running
4. No syntax errors

### AI endpoints return 500

**Check:**
1. Groq API key is valid
2. Redis is connected
3. Check logs for error details
4. Try `npm run ai:demo` to test AI client

### WebSocket not connecting

**Check:**
1. CORS origins configured
2. Socket.io initialized correctly
3. AIStreamHandler initialized
4. Browser console for errors

### Slow responses

**Check:**
1. Enable caching
2. Use fast model (8B) for simple tasks
3. Check Redis connection
4. Monitor with `npm run redis:monitor`

## Performance Optimization

### 1. Enable Caching

```javascript
// Always enable cache for repeated queries
const result = await aiMarketService.analyzeAsset(symbol, data);
// Cached automatically for 1 hour
```

### 2. Use Appropriate Model

```javascript
// Simple task - use fast model
await groqClient.generateContent(prompt, { complex: false });

// Complex task - use 70B model
await groqClient.generateContent(prompt, { complex: true });
```

### 3. Batch Operations

```javascript
// Use job queue for bulk processing
await aiJobQueue.publishJob('batch', {
  items: assets,
  operation: 'analysis'
});
```

### 4. Monitor Usage

```bash
# Check cache hit rate
npm run redis:stats

# Monitor queue
curl http://localhost:3000/api/v1/ai/jobs/stats
```

## Production Considerations

1. **API Key Security**: Use environment variables, never commit
2. **Rate Limiting**: Add Express rate limiter
3. **Error Monitoring**: Setup Sentry or similar
4. **Caching**: Tune TTLs based on usage
5. **Scaling**: Use Redis for session storage
6. **Logging**: Use structured logging (Winston)
7. **Monitoring**: Track API usage and costs

## Next Steps

1. ✅ Complete integration
2. ✅ Test all endpoints
3. ✅ Monitor performance
4. ✅ Add to frontend
5. ✅ Deploy to production

## Support

- **Full Documentation**: `docs/AI_FEATURES.md`
- **Quick Start**: `docs/QUICK_START_AI.md`
- **Examples**: `examples/` directory
- **Tests**: `__tests__/unit/`

---

Happy integrating! 🚀
