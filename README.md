# Global-Fi Ultra

Real-time financial data aggregator that pulls from 6+ APIs and streams market data via WebSockets. Built for traders, developers, and anyone who needs reliable market data without the headache of managing multiple API integrations.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why This Exists

Managing multiple financial data APIs is tedious. Global-Fi Ultra solves this by:

- **Aggregating everything** - stocks, crypto, forex, and news into one clean API
- **Handling the hard parts** - circuit breakers and retry logic built-in
- **Real-time updates** - WebSocket streaming, no polling needed
- **Financial precision** - Big.js eliminates floating-point errors

---

## Dashboard Features

### Main Features

**Live Market Dashboard**
- Real-time price updates across stocks, crypto, and forex
- Color-coded change indicators (green for gains, red for losses)
- Volume and market cap displays
- Customizable watchlists

**Interactive Charts**
- Candlestick and line charts for price action
- Multiple timeframes (1H, 4H, 1D, 1W, 1M)
- Technical indicators overlay
- Zoom and pan functionality

**Alert System**
- Visual notifications when price targets hit
- Sound alerts (optional, can be disabled)
- Alert history and management panel
- Multiple condition types (above, below, crosses)

**News Feed**
- Latest financial headlines
- Source attribution with timestamps
- Filter by category (stocks, crypto, markets, economy)
- Click-through to original articles

---

## Data Sources

### Six APIs, One Integration

**Alpha Vantage** - Stock quotes and forex data

**CoinGecko** - Cryptocurrency prices for 10,000+ coins

**ExchangeRate-API** - 160+ currency pairs with daily updates

**NewsAPI** - Financial news headlines from major publications

**FRED** - US economic data from the Federal Reserve

**Finnhub** - Real-time market data for stocks and crypto

### Core Features

**WebSocket Streaming**
Connect once, get updates pushed to you. No more polling. Updates arrive within seconds of market changes.

**Circuit Breakers**
When an API goes down, the system automatically stops sending requests and tries again later. Your app stays stable.

**Precision Math**
Financial calculations use Big.js instead of JavaScript's floating-point math. No more precision errors.

**Smart Caching**
Redis caching with different TTLs per API. Stock data cached for 60s, news for 5min, etc.

**Production Ready**
Health checks, graceful shutdown, Docker setup, rate limiting. Battle-tested in production.

---

## Installation

### Requirements

- Node.js 18+
- MongoDB 5+
- Redis 6+
- Docker (optional but recommended)

### Quick Setup

**1. Get the Code**

```bash
git clone <repository-url>
cd global-fi-ultra
npm install
```

**2. Configure Environment**

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- API keys for the six data sources
- MongoDB connection string
- Redis server address
- Server port (default: 3000)
- CORS origins for your frontend

**3. Get API Keys**

Sign up for free API keys:
- [Alpha Vantage](https://www.alphavantage.co/support/#api-key) - Stock data
- [NewsAPI](https://newsapi.org/register) - Financial news
- [FRED](https://fred.stlouisfed.org/docs/api/api_key.html) - Economic data
- [Finnhub](https://finnhub.io/register) - Market data
- CoinGecko - Works without a key
- ExchangeRate-API - Works without a key

**4. Start the Server**

**Using Docker (Recommended):**

```bash
docker-compose up -d
```

This starts MongoDB, Redis, and the application automatically.

**Without Docker:**

```bash
# Start MongoDB and Redis first
mongod
redis-server

# Then start the app
npm run dev
```

**5. Verify Installation**

Visit `http://localhost:3000/health` - you should see a JSON response showing the server is operational.

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### System Health

**GET /health**  
Returns server status and uptime

**GET /readiness**  
Verifies database connections

### Market Data

**GET /api/v1/financial/live**  
Fetches fresh data from all external APIs (slower but current)

**GET /api/v1/financial/cached**  
Returns cached data from Redis (faster, may be up to 60 seconds old)

Response includes:
- Stock quotes
- Cryptocurrency prices
- Forex rates
- News headlines
- Economic indicators

### User Management

**GET /api/v1/users**  
List all users with pagination  
Query params: `page`, `limit`

**GET /api/v1/users/:id**  
Get specific user by ID

**POST /api/v1/users**  
Create new user  
Body: `{ email, name }`

**PATCH /api/v1/users/:id**  
Update user information

**DELETE /api/v1/users/:id**  
Delete user account

### Watchlists

**GET /api/v1/watchlists**  
List watchlists (filter by `userId`)

**POST /api/v1/watchlists**  
Create watchlist  
Body: `{ name, description, assets }`

**POST /api/v1/watchlists/:id/assets**  
Add asset to watchlist

**DELETE /api/v1/watchlists/:id/assets/:symbol**  
Remove asset from watchlist

### Price Alerts

**GET /api/v1/alerts**  
List alerts (filter by `userId`, `symbol`, `active`)

**POST /api/v1/alerts**  
Create price alert  
Body: `{ symbol, condition, threshold }`

**PATCH /api/v1/alerts/:id/activate**  
Enable alert

**PATCH /api/v1/alerts/:id/deactivate**  
Disable alert

Alert types: `price`, `change`, `volume`  
Conditions: `above`, `below`, `crosses`

### Administration

**POST /api/v1/admin/cache/clear**  
Clear Redis cache

**GET /api/v1/admin/metrics**  
View system metrics

**GET /api/v1/status/circuit-breakers**  
Check API health status

Circuit breaker states:
- `closed` - API working normally
- `open` - API blocked due to failures
- `half-open` - Testing API recovery

---

## WebSocket Integration

### Basic Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected!');
  
  // Subscribe to live updates
  socket.emit('join-live-stream', {
    userId: 'optional-user-id',
    assets: ['AAPL', 'BTC']  // Filter specific assets
  });
});

// Receive market updates
socket.on('financial-data-update', (data) => {
  console.log('Price update:', data);
});

// System warnings
socket.on('system-warning', (warning) => {
  console.warn('Warning:', warning.message);
});

// Circuit breaker state changes
socket.on('circuit-breaker-state-change', (state) => {
  console.log(`${state.service} is now ${state.state}`);
});
```

### Events to Send

**join-live-stream**
```javascript
socket.emit('join-live-stream', {
  userId: 'user123',      // optional
  assets: ['AAPL', 'BTC'] // optional filter
});
```

**leave-live-stream**
```javascript
socket.emit('leave-live-stream', {});
```

**request-current-data**
```javascript
socket.emit('request-current-data', {
  symbols: ['AAPL', 'GOOGL']
});
```

### Events to Receive

**financial-data-update** - Market data updates
```javascript
{
  timestamp: '2024-02-07T10:30:00.000Z',
  stocks: { 
    AAPL: { price: '175.50', change: '+2.3%', volume: 1234567 } 
  },
  crypto: { 
    BTC: { price: '45000.00', change: '+5.1%' } 
  }
}
```

**system-warning** - System issues
```javascript
{
  type: 'circuit-breaker-open',
  service: 'alphavantage',
  message: 'Alpha Vantage temporarily unavailable'
}
```

**circuit-breaker-state-change** - API status changes
```javascript
{
  service: 'newsapi',
  state: 'open',
  failureCount: 5,
  nextAttemptIn: 30000  // milliseconds
}
```

### Complete Client Example

```javascript
class MarketDataClient {
  constructor(url = 'http://localhost:3000') {
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.connected = false;
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to Global-Fi');
      this.connected = true;
      this.subscribe(['AAPL', 'BTC', 'ETH']);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected');
      this.connected = false;
    });
    
    this.socket.on('financial-data-update', (data) => {
      this.handleUpdate(data);
    });
    
    this.socket.on('system-warning', (warning) => {
      this.handleWarning(warning);
    });
  }
  
  subscribe(assets) {
    if (!this.connected) return;
    
    this.socket.emit('join-live-stream', {
      userId: this.userId,
      assets: assets
    });
  }
  
  handleUpdate(data) {
    console.log('Market update:', data);
  }
  
  handleWarning(warning) {
    console.warn('System warning:', warning.message);
  }
  
  disconnect() {
    this.socket.emit('leave-live-stream', {});
    this.socket.disconnect();
  }
}

// Usage
const client = new MarketDataClient();
client.userId = 'user-123';
```

### Update Frequency

- Stock prices: Every 30-60 seconds
- Crypto prices: Every 30-60 seconds
- Forex rates: Every 5 minutes
- News headlines: Every 5 minutes
- Economic data: Hourly or when published

---

## Architecture

### System Overview

```
Your App → Global-Fi Ultra → 6 External APIs
         ↓
    MongoDB + Redis
```

**Data Flow:**
1. Request received
2. Check Redis cache
3. If cached, return immediately
4. If not, call external APIs (with circuit breaker protection)
5. Normalize and cache results
6. Stream to WebSocket clients
7. Return to HTTP client

### Project Structure

```
src/
├── config/              # Environment, database, Redis
├── infrastructure/      # API clients, caching, WebSockets
│   ├── http/            # API client wrappers
│   ├── cache/           # Redis caching layer
│   ├── resilience/      # Circuit breakers, retry logic
│   └── websocket/       # Socket.io manager
├── application/         # Business logic
│   ├── use-cases/       # Orchestration
│   └── dto/             # Validation schemas
├── domain/              # Core concepts
│   └── value-objects/   # Money, Percentage classes
├── presentation/        # HTTP layer
│   ├── routes/          # Express routes
│   ├── controllers/     # Request handlers
│   └── middleware/      # Auth, errors, rate limiting
├── models/              # MongoDB schemas
└── server.js            # Entry point
```

### Circuit Breaker Pattern

**Closed (working)** - Requests flow normally

**Open (broken)** - After failures, block requests temporarily

**Half-Open (testing)** - After timeout, try one request to check recovery

Check status: `GET /api/v1/status/circuit-breakers`

---

## API Keys Setup

### Alpha Vantage (Stocks & Forex)

**Sign up:** https://www.alphavantage.co/support/#api-key

- Free tier: 25 requests/day, 5 per minute
- Paid tier: $49.99/month for 75 requests/minute

```env
ALPHA_VANTAGE_API_KEY=your_key_here
```

### NewsAPI (Headlines)

**Sign up:** https://newsapi.org/register

- Free tier: 100 requests/day
- Paid tier: $449/month

```env
NEWS_API_KEY=your_key_here
```

### FRED (Economic Data)

**Sign up:** https://fred.stlouisfed.org/docs/api/api_key.html

- Free and unlimited

```env
FRED_API_KEY=your_key_here
```

### Finnhub (Market Data)

**Sign up:** https://finnhub.io/register

- Free tier: 60 calls/minute
- Paid tier: $39.99/month for 300 calls/minute

```env
FINNHUB_API_KEY=your_key_here
```

### CoinGecko & ExchangeRate-API

- CoinGecko: Works without a key (Pro: $129/month)
- ExchangeRate-API: 1,500 free requests/month, no key needed

### Testing API Keys

```bash
# Alpha Vantage
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY"

# NewsAPI
curl "https://newsapi.org/v2/top-headlines?category=business&apiKey=YOUR_KEY"

# FRED
curl "https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=YOUR_KEY&file_type=json"

# Finnhub
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY"
```

---

## Deployment

### Render.com (Recommended)

The repository includes `render.yaml` for automated deployment.

**Steps:**
1. Push code to GitHub
2. Create Render.com account
3. New → Blueprint
4. Connect your repository
5. Add API keys as environment variables
6. Click "Apply"

Render creates MongoDB, Redis, and deploys your app automatically.

URL: `https://your-app-name.onrender.com`

**Free tier:**
- Spins down after 15 minutes inactivity
- 750 hours/month
- Limited storage

### Heroku

```bash
heroku create globalfi-ultra
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:mini
heroku config:set ALPHA_VANTAGE_API_KEY=your_key
# Set other environment variables
git push heroku main
```

### Docker

```bash
docker-compose up -d
```

### Production Configuration

**Environment Variables:**
- `NODE_ENV=production`
- `LOG_LEVEL=warn`
- MongoDB production URI
- Redis production URL
- CORS configured for your domain
- Rate limiting enabled
- SSL/TLS certificates

---

## Performance Optimization

### Caching Strategy

- Stock data: 60 second TTL
- Crypto: 60 second TTL
- Forex: 5 minute TTL
- News: 5 minute TTL
- Economic indicators: 1 hour TTL

### Rate Limiting

**Best Practices:**
- Use cached endpoints when possible
- Implement exponential backoff
- Batch requests where supported
- Monitor circuit breaker status
- Consider paid tiers for production

### WebSocket Optimization

- Subscribe to specific assets only
- Throttle updates on client side if needed
- Disconnect inactive clients automatically
- Use compression for large payloads

---

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:** Start MongoDB first

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker-compose up -d
```

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:** Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker-compose up -d
```

### Circuit Breaker Open

```
Error: Circuit breaker is OPEN for service: alphavantage
```

**Solutions:**
- Wait 60 seconds for automatic retry
- Verify API key is valid
- Check rate limits not exceeded
- View status: `/api/v1/status/circuit-breakers`

### Rate Limit Exceeded

**Solution:** Wait 15 minutes or upgrade API plan

### Invalid API Key

**Solution:** Double-check `.env` file for correct keys (no quotes needed)

### WebSocket Not Connecting

**Solutions:**
- Verify server is running
- Check firewall rules
- Ensure port is accessible
- Check browser console for errors

---

## Development

### Available Scripts

```bash
npm start          # Production mode
npm run dev        # Development with hot reload
npm test           # Run tests
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature-name`)
5. Open Pull Request

**Guidelines:**
- Follow existing code style
- Run tests before submitting
- Update documentation as needed

---

## Security

### Best Practices

**For Developers:**
- Never commit API keys to version control
- Use environment variables for sensitive data
- Enable CORS for specific domains only
- Implement rate limiting
- Use HTTPS in production

**For Users:**
- Use strong passwords
- Enable two-factor authentication
- Don't share API keys
- Log out on public devices
- Review login history regularly

---

## License

MIT License - use this code however you want.

---

## Support

- Open an issue on GitHub
- Check `/health` endpoint for server status
- Review circuit breaker status at `/api/v1/status/circuit-breakers`

---

**Built with:** Node.js, Express, Socket.io, MongoDB, Redis  
**Data from:** Alpha Vantage, CoinGecko, NewsAPI, FRED, Finnhub, ExchangeRate-API

---

Made by a developer tired of managing multiple financial APIs. ⭐