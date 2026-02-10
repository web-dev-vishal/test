# AI Features Documentation

## Overview

Global-Fi Ultra now includes AI-powered features using Groq AI for ultra-fast financial analysis, market insights, and intelligent recommendations.

## Groq AI Integration

### Why Groq?

- **Ultra-fast inference**: 280-560 tokens/second
- **Generous free tier**: 300K tokens/min, 1K requests/min
- **Cost-effective**: $0.59-$0.79 per 1M tokens
- **Large context**: 131K token window
- **No daily limits** on free tier

### Model Selection Strategy

We use a dual-model approach for optimal performance:

#### Llama 3.3 70B Versatile (Primary)
- **Speed**: 280 tokens/second
- **Use cases**: Complex market analysis, multi-document synthesis, reasoning chains
- **Cost**: $0.59 input / $0.79 output per 1M tokens

#### Llama 3.1 8B Instant (Fast)
- **Speed**: 560 tokens/second  
- **Use cases**: Sentiment classification, entity extraction, simple queries
- **Cost**: $0.05 input / $0.08 output per 1M tokens

## Setup

### 1. Get Groq API Key

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a free account
3. Generate an API key

### 2. Configure Environment

Add to your `.env` file:

```env
# Groq AI Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant
```

### 3. Verify Installation

```bash
npm install
```

## Usage

### Basic Example

```javascript
import { GroqClient } from './infrastructure/ai/groqClient.js';
import { RedisCache } from './infrastructure/cache/RedisCache.js';
import { logger } from './config/logger.js';
import { config } from './config/environment.js';

// Initialize client
const groqClient = new GroqClient({
  apiKey: config.ai.groqApiKey,
  cacheService: new RedisCache(),
  logger
});

// Simple query (uses fast 8B model)
const sentiment = await groqClient.generateContent(
  'Analyze the sentiment of this news: "Stock market hits all-time high"',
  { complex: false }
);

// Complex analysis (uses 70B model)
const analysis = await groqClient.generateContent(
  'Provide a detailed market analysis comparing tech stocks vs energy stocks',
  { complex: true }
);
```

### Streaming Responses

```javascript
// Stream tokens in real-time
await groqClient.streamContent(
  'Explain the current crypto market trends',
  (chunk) => {
    process.stdout.write(chunk);
  },
  { complex: true }
);
```

### Structured JSON Output

```javascript
// Get structured data
const marketData = await groqClient.generateJSON(
  `Analyze this stock data and return JSON with fields: 
   sentiment (positive/negative/neutral), 
   confidence (0-100), 
   summary (string)`,
  { sentiment: '', confidence: 0, summary: '' },
  { complex: false }
);

console.log(marketData);
// { sentiment: 'positive', confidence: 85, summary: '...' }
```

## Redis Monitoring Tool

Professional CLI tool for monitoring and managing Redis cache.

### Features

✅ List all Redis keys with type, TTL, size, status  
✅ View values for any key (pretty-printed JSON)  
✅ Real-time watch mode (auto-refresh every 2 seconds)  
✅ Cache statistics dashboard (hit rate, memory usage)  
✅ Search/filter by pattern  
✅ Export data to JSON file  
✅ Clear cache by pattern with confirmation  
✅ Interactive CLI interface  
✅ Color-coded output (🟢 Active, 🟡 Expiring, 🔴 Critical, ⚪ Persistent)  
✅ Circuit breaker state monitoring  
✅ Memory usage per key  
✅ Connection health check  

### Usage

#### Interactive Mode (Recommended)

```bash
npm run redis:monitor
```

This starts an interactive menu where you can:
- [R] Refresh display
- [F] Filter by pattern
- [V] View key details
- [E] Export to JSON
- [C] Clear by pattern
- [S] Sort keys (by TTL, size, name)
- [H] Health check
- [Q] Quit

#### Watch Mode (Auto-refresh)

```bash
npm run redis:watch
```

Automatically refreshes every 2 seconds. Press Ctrl+C to exit.

#### List Keys

```bash
npm run redis:keys
```

#### Statistics Only

```bash
npm run redis:stats
```

#### Export Cache Data

```bash
npm run redis:export
# Exports to ./cache-export.json

# Or specify custom file and pattern
node src/tools/redisMonitor.js --export ./my-export.json --pattern "cache:stocks:*"
```

#### Clear Cache by Pattern

```bash
# Interactive with confirmation
node src/tools/redisMonitor.js --clear "cache:stocks:*"
```

#### View Specific Key

```bash
node src/tools/redisMonitor.js --view "cache:crypto:BTC-USD"
```

#### Health Check

```bash
npm run redis:health
```

### Output Example

```
╔═══════════════════════════════════════════════════════════╗
║           REDIS CACHE MONITOR v1.0                        ║
║           Global-Fi Ultra - Development Tool              ║
╚═══════════════════════════════════════════════════════════╝

📊 Cache Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Keys: 127        Memory Used: 2.4 MB       Uptime: 3d 14h
Hit Rate: 87.3%        Evictions: 12             Ops/sec: 234

🔑 Active Cache Keys (Pattern: *, Sort: ttl)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key                              Type    TTL     Size    Status
────────────────────────────────────────────────────────────────
cache:crypto:BTC-USD            string   55s    0.8KB   🟢 Active
cache:stocks:AAPL               string   45s    1.2KB   🟢 Active
cache:stocks:TSLA               string   28s    0.9KB   🟡 Expiring
cache:news:technology           string   12s    4.5KB   🟡 Expiring
ratelimit:user:123              string   3s     48B     🔴 Critical
circuit:breaker:alphavantage    hash     N/A    256B    ⚪ Persistent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commands:
[R] Refresh       [F] Filter by pattern    [V] View key details
[E] Export JSON   [C] Clear by pattern     [S] Sort keys
[H] Health check  [Q] Quit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Architecture

### Clean Architecture Layers

```
src/
├── infrastructure/
│   └── ai/
│       ├── aiConfig.js      # AI configuration constants
│       ├── groqClient.js    # Groq API client wrapper
│       └── index.js         # Exports
├── application/
│   └── use-cases/
│       └── (AI use cases to be added)
├── domain/
│   └── (AI domain models to be added)
└── tools/
    └── redisMonitor.js      # Redis monitoring CLI
```

### Dependency Injection

All AI services use dependency injection for testability:

```javascript
const groqClient = new GroqClient({
  apiKey: config.ai.groqApiKey,
  cacheService: redisCache,  // Injected
  logger: logger             // Injected
});
```

## Error Handling

The AI client includes comprehensive error handling:

```javascript
import { 
  AIServiceError, 
  AIRateLimitError, 
  AIAuthError, 
  AITimeoutError 
} from './infrastructure/ai/groqClient.js';

try {
  const result = await groqClient.generateContent(prompt);
} catch (error) {
  if (error instanceof AIRateLimitError) {
    // Handle rate limit (retry after error.retryAfter seconds)
  } else if (error instanceof AIAuthError) {
    // Handle invalid API key
  } else if (error instanceof AITimeoutError) {
    // Handle timeout
  } else {
    // Handle general error
  }
}
```

## Caching Strategy

AI responses are automatically cached in Redis to save API quota:

```javascript
// Cached for 1 hour by default
const result = await groqClient.generateContent(prompt, { 
  cache: true 
});

// Custom cache TTL via aiConfig.js
cache: {
  ttl: {
    standard: 3600,            // 1 hour
    news: 300,                 // 5 minutes
    insights: 900,             // 15 minutes
    recommendations: 21600     // 6 hours
  }
}
```

## Rate Limiting

Groq free tier limits (automatically handled):

- **Llama 3.3 70B**: 300K tokens/min, 1K requests/min
- **Llama 3.1 8B**: 250K tokens/min, 1K requests/min
- **No daily limits**

The client includes automatic retry with exponential backoff.

## Best Practices

### 1. Choose the Right Model

```javascript
// ❌ BAD - Using 70B for simple tasks (slower, more expensive)
await groqClient.generateContent('Is this positive?', { complex: true });

// ✅ GOOD - Use 8B for simple classification
await groqClient.generateContent('Is this positive?', { complex: false });

// ✅ GOOD - Use 70B for complex analysis
await groqClient.generateContent(
  'Compare market trends across 5 sectors with reasoning',
  { complex: true }
);
```

### 2. Enable Caching

```javascript
// ✅ GOOD - Cache responses to save quota
await groqClient.generateContent(prompt, { cache: true });
```

### 3. Handle Errors Gracefully

```javascript
// ✅ GOOD - Provide fallback
try {
  return await groqClient.generateContent(prompt);
} catch (error) {
  logger.error('AI generation failed', { error });
  return getFallbackResponse();
}
```

### 4. Use Structured Output

```javascript
// ✅ GOOD - Request JSON for structured data
const data = await groqClient.generateJSON(
  'Analyze sentiment and return JSON',
  { sentiment: '', confidence: 0 }
);
```

## Next Steps

1. **AI Services**: Create application-layer services for specific use cases
2. **WebSocket Integration**: Stream AI responses to clients
3. **RabbitMQ Integration**: Queue AI analysis jobs
4. **Testing**: Add comprehensive tests for AI features

## Support

For issues or questions:
- Check Groq documentation: [https://console.groq.com/docs](https://console.groq.com/docs)
- Review error logs in `./logs/app.log`
- Use Redis monitor to debug caching issues

## License

MIT
