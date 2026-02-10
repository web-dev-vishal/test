# Global-Fi Ultra - AI Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Web Browser │  │ Mobile App   │  │  CLI Tools   │         │
│  │  (React/Vue) │  │  (Native)    │  │  (Node.js)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express.js Server                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ HTTP REST  │  │ WebSocket  │  │  GraphQL   │         │  │
│  │  │ /api/v1/*  │  │ Socket.io  │  │ (Optional) │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Financial  │  │      AI      │  │    User      │         │
│  │  Controller  │  │  Controller  │  │  Controller  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Middleware (Auth, Rate Limit, CORS)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Financial  │  │  AI News     │  │  AI Market   │         │
│  │ Orchestrator │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Watchlist  │  │    Alert     │  │     User     │         │
│  │   Use Cases  │  │  Use Cases   │  │  Use Cases   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Groq Client │  │ Redis Cache  │  │  RabbitMQ    │         │
│  │  (AI)        │  │              │  │  Job Queue   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ API Clients  │  │ Circuit      │  │  WebSocket   │         │
│  │ (6 sources)  │  │  Breakers    │  │   Manager    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Repositories (Data Access)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   MongoDB    │  │    Redis     │  │  RabbitMQ    │         │
│  │  (Primary)   │  │   (Cache)    │  │  (Queue)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Groq AI  │  │  Alpha   │  │ CoinGecko│  │ NewsAPI  │       │
│  │          │  │ Vantage  │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │   FRED   │  │ Finnhub  │  │ Exchange │                     │
│  │          │  │          │  │ Rate API │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## AI Data Flow

### 1. HTTP Request Flow

```
Client Request
    │
    ▼
Express Router (/api/v1/ai/*)
    │
    ▼
AI Controller
    │
    ├─→ Validate Input
    │
    ▼
AI Service (News/Market)
    │
    ├─→ Check Redis Cache
    │   │
    │   ├─→ Cache Hit → Return Cached
    │   │
    │   └─→ Cache Miss ↓
    │
    ▼
Groq Client
    │
    ├─→ Select Model (70B/8B)
    ├─→ Build Prompt
    ├─→ Retry Logic
    │
    ▼
Groq API (External)
    │
    ▼
Response Processing
    │
    ├─→ Parse JSON
    ├─→ Validate Schema
    ├─→ Cache in Redis
    │
    ▼
Return to Client
```

### 2. WebSocket Streaming Flow

```
Client Connection
    │
    ▼
Socket.io Server
    │
    ▼
AI Stream Handler
    │
    ├─→ Register Event Listeners
    │   - ai:chat
    │   - ai:analyze
    │   - ai:sentiment
    │   - ai:recommend
    │
    ▼
Event: ai:chat
    │
    ├─→ Emit: ai:stream:start
    │
    ▼
Groq Client (Streaming)
    │
    ├─→ For each token chunk:
    │   │
    │   ├─→ Emit: ai:stream:chunk
    │   │
    │   └─→ Client receives token
    │
    ▼
Stream Complete
    │
    └─→ Emit: ai:stream:complete
```

### 3. Job Queue Flow

```
Client Request
    │
    ▼
POST /api/v1/ai/jobs
    │
    ▼
AI Controller
    │
    ├─→ Validate Job Type
    ├─→ Validate Job Data
    │
    ▼
AI Job Queue
    │
    ├─→ Generate Job ID
    ├─→ Publish to RabbitMQ
    │
    ▼
RabbitMQ Queue
    │
    ├─→ sentiment_queue
    ├─→ analysis_queue
    ├─→ recommendation_queue
    └─→ batch_queue
    │
    ▼
Job Consumer
    │
    ├─→ Process Job
    ├─→ Call AI Service
    ├─→ Handle Errors
    │
    ▼
Publish Result
    │
    └─→ results_queue
```

## Component Interactions

### AI News Service

```
AINewsService
    │
    ├─→ analyzeSentiment()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 8B (fast)
    │
    ├─→ extractEntities()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 8B (fast)
    │
    ├─→ analyzeMarketImpact()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 70B (complex)
    │
    ├─→ generateSummary()
    │   └─→ GroqClient.generateContent()
    │       └─→ Model: 8B (fast)
    │
    └─→ analyzeSentimentTrend()
        └─→ GroqClient.generateJSON()
            └─→ Model: 70B (complex)
```

### AI Market Service

```
AIMarketService
    │
    ├─→ analyzeAsset()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 70B (complex)
    │
    ├─→ compareAssets()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 70B (complex)
    │
    ├─→ generateRecommendation()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 70B (complex)
    │
    ├─→ analyzePortfolio()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 70B (complex)
    │
    ├─→ predictPrice()
    │   └─→ GroqClient.generateJSON()
    │       └─→ Model: 70B (complex)
    │
    └─→ explainMovement()
        └─→ GroqClient.generateContent()
            └─→ Model: 8B (fast)
```

## Caching Strategy

```
Request → Check Cache
            │
            ├─→ Hit (87% avg)
            │   └─→ Return Cached (< 1ms)
            │
            └─→ Miss (13% avg)
                │
                ▼
            Call Groq API
                │
                ├─→ Generate Response (100-500ms)
                │
                ▼
            Cache Response
                │
                ├─→ Standard: 1 hour
                ├─→ News: 5 minutes
                ├─→ Insights: 15 minutes
                └─→ Recommendations: 6 hours
                │
                ▼
            Return to Client
```

## Error Handling Flow

```
Request
    │
    ▼
Try Block
    │
    ├─→ Validate Input
    │   └─→ Invalid → 400 Bad Request
    │
    ├─→ Call AI Service
    │   │
    │   ├─→ Rate Limit → AIRateLimitError
    │   │   └─→ Retry after 60s
    │   │
    │   ├─→ Auth Error → AIAuthError
    │   │   └─→ 401 Unauthorized
    │   │
    │   ├─→ Timeout → AITimeoutError
    │   │   └─→ Fallback Response
    │   │
    │   └─→ General Error → AIServiceError
    │       └─→ Fallback Response
    │
    ▼
Catch Block
    │
    ├─→ Log Error (Winston)
    ├─→ Return User-Friendly Message
    └─→ Provide Fallback Data
```

## Scaling Architecture

### Horizontal Scaling

```
Load Balancer
    │
    ├─→ App Instance 1
    │   └─→ Redis (shared)
    │
    ├─→ App Instance 2
    │   └─→ Redis (shared)
    │
    └─→ App Instance 3
        └─→ Redis (shared)
```

### Vertical Scaling

```
Single Instance
    │
    ├─→ Increase CPU (for AI processing)
    ├─→ Increase RAM (for caching)
    └─→ Increase Network (for API calls)
```

## Security Layers

```
Request
    │
    ▼
1. Rate Limiter
    │
    ├─→ Check IP/User limits
    └─→ Block if exceeded
    │
    ▼
2. CORS Validation
    │
    ├─→ Check origin
    └─→ Block if unauthorized
    │
    ▼
3. Input Validation
    │
    ├─→ Sanitize input
    └─→ Reject if invalid
    │
    ▼
4. Authentication (if enabled)
    │
    ├─→ Verify token
    └─→ Reject if invalid
    │
    ▼
5. Authorization (if enabled)
    │
    ├─→ Check permissions
    └─→ Reject if unauthorized
    │
    ▼
Process Request
```

## Monitoring & Observability

```
Application
    │
    ├─→ Winston Logger
    │   └─→ logs/app.log
    │
    ├─→ Redis Monitor
    │   └─→ Cache statistics
    │
    ├─→ Circuit Breakers
    │   └─→ API health status
    │
    └─→ Metrics (optional)
        └─→ Prometheus/Grafana
```

## Deployment Architecture

### Docker Compose

```
docker-compose.yml
    │
    ├─→ app (Node.js)
    │   └─→ Port 3000
    │
    ├─→ mongodb
    │   └─→ Port 27017
    │
    ├─→ redis
    │   └─→ Port 6379
    │
    └─→ rabbitmq (optional)
        └─→ Port 5672
```

### Production (Cloud)

```
Cloud Provider (AWS/Azure/GCP)
    │
    ├─→ Load Balancer
    │   └─→ SSL/TLS Termination
    │
    ├─→ App Servers (Auto-scaling)
    │   └─→ Docker Containers
    │
    ├─→ Managed Redis
    │   └─→ ElastiCache/Azure Cache
    │
    ├─→ Managed MongoDB
    │   └─→ Atlas/CosmosDB
    │
    └─→ Managed Queue (optional)
        └─→ SQS/Service Bus
```

## Performance Metrics

### Response Times

```
Cached Response:     < 1ms
Simple AI (8B):      100-200ms
Complex AI (70B):    200-500ms
Streaming:           First token < 100ms
```

### Throughput

```
HTTP Endpoints:      1000+ req/sec
WebSocket:           100+ concurrent
Job Queue:           500+ jobs/min
```

### Cache Hit Rate

```
Target:              > 80%
Typical:             85-90%
Peak Hours:          > 90%
```

## Technology Stack

### Backend
- Node.js 18+
- Express.js 4.x
- Socket.io 4.x

### AI
- Groq SDK
- Llama 3.3 70B
- Llama 3.1 8B

### Data
- MongoDB 5+
- Redis 6+
- RabbitMQ 3.x (optional)

### Tools
- Winston (logging)
- Zod (validation)
- Big.js (precision math)
- Axios (HTTP client)

## File Structure

```
src/
├── infrastructure/
│   ├── ai/
│   │   ├── aiConfig.js
│   │   ├── groqClient.js
│   │   └── index.js
│   ├── cache/
│   │   └── RedisCache.js
│   ├── messaging/
│   │   └── AIJobQueue.js
│   └── websocket/
│       └── AIStreamHandler.js
│
├── application/
│   └── services/
│       ├── AINewsService.js
│       └── AIMarketService.js
│
├── presentation/
│   ├── controllers/
│   │   └── AIController.js
│   └── routes/
│       └── aiRoutes.js
│
└── tools/
    └── redisMonitor.js
```

---

This architecture provides:
- ✅ Scalability
- ✅ Maintainability
- ✅ Performance
- ✅ Security
- ✅ Observability
- ✅ Testability
