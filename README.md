# Global-Fi Ultra

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

High-performance financial orchestration engine that aggregates, normalizes, and streams financial data from 6 public APIs in real-time.

## Features

- 🚀 **Real-time Data Streaming** via Socket.io
- 📊 **6 Financial APIs** (Stocks, Crypto, Forex, News, Economic Indicators)
- 🔄 **Circuit Breaker** pattern for resilience
- 💰 **Precision Math** with Big.js (no floating-point errors)
- 📦 **Redis Caching** with per-API TTLs
- 🐳 **Docker Ready** with Render.com deployment
- ✅ **Production Ready** with health checks and graceful shutdown

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd globalfi-ultra
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start with Docker (Recommended)

```bash
npm run docker:run
```

### 4. Or Start Locally

```bash
# Start MongoDB and Redis first
npm run dev
```

## API Endpoints

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe |
| `/readiness` | GET | Readiness probe (checks DB/Redis) |

### Financial Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/financial/live` | GET | Trigger orchestration, get live data |
| `/api/v1/financial/cached` | GET | Get cached data only |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users` | GET | List all users (paginated) |
| `/api/v1/users/:id` | GET | Get user by ID |
| `/api/v1/users` | POST | Create new user |
| `/api/v1/users/:id` | PUT | Update user (full update) |
| `/api/v1/users/:id` | PATCH | Partial update user |
| `/api/v1/users/:id` | DELETE | Delete user (soft delete) |

### Watchlists

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/watchlists` | GET | List watchlists (supports userId query) |
| `/api/v1/watchlists/:id` | GET | Get watchlist by ID |
| `/api/v1/watchlists` | POST | Create new watchlist |
| `/api/v1/watchlists/:id` | PUT | Update watchlist |
| `/api/v1/watchlists/:id` | DELETE | Delete watchlist |
| `/api/v1/watchlists/:id/assets` | POST | Add asset to watchlist |
| `/api/v1/watchlists/:id/assets/:symbol` | DELETE | Remove asset from watchlist |

### Alerts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/alerts` | GET | List alerts (supports userId, symbol queries) |
| `/api/v1/alerts/:id` | GET | Get alert by ID |
| `/api/v1/alerts` | POST | Create new alert |
| `/api/v1/alerts/:id` | PUT | Update alert |
| `/api/v1/alerts/:id` | DELETE | Delete alert |
| `/api/v1/alerts/:id/activate` | PATCH | Activate alert |
| `/api/v1/alerts/:id/deactivate` | PATCH | Deactivate alert |

### Financial Assets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/assets` | GET | Search/list assets (supports type, search queries) |
| `/api/v1/assets/:symbol` | GET | Get asset by symbol |
| `/api/v1/assets/:symbol/live` | GET | Get live data for asset |
| `/api/v1/assets` | POST | Create/track new asset |
| `/api/v1/assets/:symbol` | PUT | Update asset info |
| `/api/v1/assets/:symbol` | DELETE | Remove asset tracking |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/cache/clear` | POST | Clear all cache |
| `/api/v1/admin/metrics` | GET | System metrics |
| `/api/v1/admin/logs` | GET | Recent error logs |

### System Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/status/circuit-breakers` | GET | Circuit breaker states |
| `/api/v1/status/rate-limits` | GET | Rate limit usage |

## Socket.io Events

### Client → Server

```javascript
socket.emit('join-live-stream', { userId: 'optional' });
socket.emit('leave-live-stream', {});
socket.emit('request-current-data', {});
```

### Server → Client

```javascript
socket.on('financial-data-update', (data) => { /* Global-Fi schema */ });
socket.on('system-warning', (warning) => { /* Circuit breaker alerts */ });
socket.on('circuit-breaker-state-change', (state) => { /* State changes */ });
socket.on('connection-acknowledged', (ack) => { /* Connection confirmed */ });
```

## Architecture

```
src/
├── config/          # Environment, DB, Redis, Logger
├── core/errors/     # Custom error classes
├── infrastructure/
│   ├── http/        # API clients (6 services)
│   ├── cache/       # Redis cache
│   ├── resilience/  # Circuit breaker, retry
│   └── websocket/   # Socket.io manager
├── application/
│   ├── use-cases/   # Business logic orchestration
│   └── dto/         # Zod schemas
├── domain/
│   └── value-objects/  # Money, Percentage (Big.js)
├── presentation/
│   ├── routes/      # Express routes
│   ├── controllers/ # Request handlers
│   └── middleware/  # Error, security, rate limiting
├── models/          # Mongoose schemas
├── di/              # Dependency injection container
└── server.js        # Entry point
```

## API Keys Required

| Service | Get Key At |
|---------|------------|
| Alpha Vantage | https://www.alphavantage.co/support/#api-key |
| NewsAPI | https://newsapi.org/register |
| FRED | https://fred.stlouisfed.org/docs/api/api_key.html |
| Finnhub | https://finnhub.io/register |

> CoinGecko and ExchangeRate-API work without keys.

## Deploy to Render.com

1. Push to GitHub
2. Connect to Render.com
3. Use the `render.yaml` blueprint
4. Add environment variables

## Scripts

```bash
npm start          # Production
npm run dev        # Development (nodemon)
npm test           # Run tests
npm run docker:run # Docker compose up
```

## License

MIT