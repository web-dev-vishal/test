# Global-Fi Ultra

Real-time financial data aggregator that pulls from 6+ APIs and streams market data via WebSockets. Built for traders, developers, and anyone who needs reliable market data without the headache of managing multiple API integrations.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why I Built This

I was tired of juggling multiple API keys, dealing with rate limits, and writing the same error handling code over and over. Global-Fi Ultra solves this by:

- Aggregating stocks, crypto, forex, and news into one clean API
- Handling all the circuit breakers and retry logic so you don't have to
- Streaming real-time updates through WebSockets (no more polling!)
- Using Big.js to avoid those nasty floating-point errors in financial calculations

It's basically the API wrapper I wish existed when I started building trading tools.

## What You Get

### Real-Time Data From 6 Sources

I've integrated these APIs so you don't have to:

- **Alpha Vantage** - Stock quotes and forex (15min delayed on free tier, but it works)
- **CoinGecko** - Crypto prices for 10,000+ coins, completely free
- **ExchangeRate-API** - 160+ currency pairs
- **NewsAPI** - Financial news headlines
- **FRED** - US economic data straight from the Federal Reserve
- **Finnhub** - Real-time market data (great for stocks and crypto)

### The Good Stuff

**WebSocket Streaming** - Connect once, get updates pushed to you. No more hammering APIs with polling requests.

**Circuit Breakers** - When an API goes down (and they do), the system automatically stops sending requests and tries again later. Your app won't crash because Alpha Vantage is having a bad day.

**Precision Math** - Financial calculations use Big.js instead of JavaScript's janky floating-point math. No more `0.1 + 0.2 = 0.30000000000000004` nonsense.

**Smart Caching** - Redis caching with different TTLs per API. Stock data gets cached for 60s, news for 5min, etc. Saves your API quota and makes everything faster.

**Actually Production Ready** - Health checks, graceful shutdown, Docker setup, rate limiting. I run this in production, so it's battle-tested.

## Getting Started

You'll need Node.js 18+, MongoDB, and Redis. If you have Docker, just skip to step 4 - it's way easier.

### 1. Clone This Thing

```bash
git clone https://github.com/yourusername/globalfi-ultra.git
cd globalfi-ultra
npm install
```

### 2. Set Up Your Environment

```bash
cp .env.example .env
```

Now open `.env` and add your API keys. Don't have them yet? Check the [API Keys](#getting-api-keys) section below.

```env
# The important ones
ALPHA_VANTAGE_API_KEY=get_this_from_alphavantage_co
NEWS_API_KEY=newsapi_org_has_this
FRED_API_KEY=fred_stlouisfed_org
FINNHUB_API_KEY=finnhub_io

# Database stuff
MONGODB_URI=mongodb://localhost:27017/globalfi-ultra
REDIS_HOST=localhost
REDIS_PORT=6379

# You can tweak these if you want
PORT=3000
NODE_ENV=development
```

### 3. Run It

**With Docker (recommended, seriously):**

```bash
npm run docker:run
```

This starts everything - MongoDB, Redis, and the app. Go to `http://localhost:3000/health` and you should see `{"status":"ok"}`.

**Without Docker (you'll need MongoDB and Redis running):**

```bash
# Make sure MongoDB is running on port 27017
# Make sure Redis is running on port 6379
npm run dev
```

### 4. Test It Out

```bash
# Basic health check
curl http://localhost:3000/health

# Get live financial data (this actually calls the APIs)
curl http://localhost:3000/api/v1/financial/live

# Get cached data (faster, doesn't call APIs)
curl http://localhost:3000/api/v1/financial/cached
```

If you see JSON data coming back, you're good to go!

## API Reference

Everything runs on `http://localhost:3000/api/v1` (or your deployed URL).

### Basic Endpoints

**Health Check** - `GET /health`

Just tells you the server is alive. Useful for load balancers and Kubernetes.

```json
{ "status": "ok", "uptime": 3600 }
```

**Readiness Check** - `GET /readiness`

Actually checks if MongoDB and Redis are connected. Use this for deployment health checks.

```json
{
  "status": "ok",
  "checks": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

### Financial Data

**Get Live Data** - `GET /api/v1/financial/live`

This hits all the external APIs and gives you fresh data. It's slower but guaranteed current.

```bash
curl http://localhost:3000/api/v1/financial/live
```

Response:
```json
{
  "success": true,
  "data": {
    "stocks": {
      "AAPL": { "price": "175.50", "change": "+2.3%" }
    },
    "crypto": {
      "BTC": { "price": "45000.00", "change": "+5.1%" }
    },
    "forex": {
      "EURUSD": { "rate": "1.0850" }
    },
    "news": [...],
    "economicIndicators": {...}
  },
  "metadata": {
    "timestamp": "2024-02-07T10:30:00.000Z",
    "cached": false
  }
}
```

**Get Cached Data** - `GET /api/v1/financial/cached`

Pulls from Redis cache only. Super fast, but might be slightly stale (60s-5min depending on the data type).

### Users

Standard REST stuff here:

- `GET /api/v1/users` - List users (supports pagination)
- `GET /api/v1/users/:id` - Get one user
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Soft delete

Example creating a user:
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "name": "Jane Trader",
    "preferences": {
      "currency": "USD",
      "timezone": "America/New_York"
    }
  }'
```

### Watchlists

Because everyone needs to track their favorite assets.

- `GET /api/v1/watchlists?userId=123` - Get watchlists for a user
- `POST /api/v1/watchlists` - Create new watchlist
- `POST /api/v1/watchlists/:id/assets` - Add asset to watchlist
- `DELETE /api/v1/watchlists/:id/assets/:symbol` - Remove asset

Example watchlist:
```json
{
  "userId": "user123",
  "name": "My Tech Stocks",
  "assets": [
    { "symbol": "AAPL", "type": "stock" },
    { "symbol": "BTC", "type": "crypto" }
  ]
}
```

### Alerts

Set price alerts and get notified when they trigger.

- `GET /api/v1/alerts?userId=123` - List your alerts
- `POST /api/v1/alerts` - Create new alert
- `PATCH /api/v1/alerts/:id/activate` - Turn on an alert
- `PATCH /api/v1/alerts/:id/deactivate` - Turn off an alert

Create an alert:
```json
{
  "userId": "user123",
  "symbol": "AAPL",
  "type": "price",
  "condition": "above",
  "threshold": "180.00",
  "message": "AAPL hit $180!"
}
```

Alert types: `price`, `change` (percentage), or `volume`
Conditions: `above`, `below`, or `crosses`

### Admin Stuff

**Clear Cache** - `POST /api/v1/admin/cache/clear`

Nukes all Redis cache. Useful when APIs have been returning bad data.

**System Metrics** - `GET /api/v1/admin/metrics`

Memory usage, request counts, cache hit rates, etc.

**Circuit Breaker Status** - `GET /api/v1/status/circuit-breakers`

Shows which APIs are currently blocked due to failures:
```json
{
  "alphavantage": "closed",  // working fine
  "coingecko": "open",       // blocked, too many errors
  "newsapi": "half-open"     // testing if it's back up
}
```

## WebSocket Streaming

The REST API is cool, but WebSockets are where this really shines. Connect once and get pushed updates whenever market data changes.

### Quick Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected!');
  
  // Start receiving live data
  socket.emit('join-live-stream', {
    userId: 'optional-user-id',
    assets: ['AAPL', 'BTC']  // Only get updates for these
  });
});

// Market data updates
socket.on('financial-data-update', (data) => {
  console.log('Price update:', data);
  // Update your UI here
});

// System warnings (like when an API goes down)
socket.on('system-warning', (warning) => {
  console.warn('Warning:', warning.message);
});

// Circuit breaker changes
socket.on('circuit-breaker-state-change', (state) => {
  console.log(`${state.service} is now ${state.state}`);
});
```

### Events You Can Send

**Join the stream:**
```javascript
socket.emit('join-live-stream', {
  userId: 'user123',      // optional
  assets: ['AAPL', 'BTC'] // optional filter
});
```

**Leave the stream:**
```javascript
socket.emit('leave-live-stream', {});
```

**Get current data immediately:**
```javascript
socket.emit('request-current-data', {
  symbols: ['AAPL', 'GOOGL']
});
```

### Events You'll Receive

**financial-data-update** - New market data
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

**system-warning** - Something's wrong
```javascript
{
  type: 'circuit-breaker-open',
  service: 'alphavantage',
  message: 'Alpha Vantage temporarily unavailable'
}
```

**circuit-breaker-state-change** - API status changed
```javascript
{
  service: 'newsapi',
  state: 'open',           // or 'closed' or 'half-open'
  failureCount: 5,
  nextAttemptIn: 30000     // milliseconds
}
```

### Full Client Example

Here's a more complete example with reconnection and error handling:

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
    // Update your UI, trigger alerts, whatever you need
    console.log('Market update:', data);
  }
  
  handleWarning(warning) {
    // Show a notification to the user
    console.warn('System warning:', warning.message);
  }
  
  disconnect() {
    this.socket.emit('leave-live-stream', {});
    this.socket.disconnect();
  }
}

// Use it
const client = new MarketDataClient();
client.userId = 'user-123';
```

## How It Works

### The Big Picture

```
Your App → Global-Fi Ultra → 6 External APIs
         ↓
    MongoDB + Redis
```

When you request data:
1. Check Redis cache first (fast path)
2. If not cached, hit the external APIs (slow path)
3. Circuit breaker protects against failing APIs
4. Retry logic handles temporary failures
5. Results get normalized and cached
6. Data streams to connected WebSocket clients

### Project Layout

```
src/
├── config/              # Environment, DB, Redis setup
├── infrastructure/      # The hard stuff
│   ├── http/            # API client wrappers (6 services)
│   ├── cache/           # Redis caching
│   ├── resilience/      # Circuit breakers and retry logic
│   └── websocket/       # Socket.io manager
├── application/         # Business logic
│   ├── use-cases/       # Orchestration (the main show)
│   └── dto/             # Validation schemas (using Zod)
├── domain/              # Core concepts
│   └── value-objects/   # Money and Percentage classes
├── presentation/        # HTTP layer
│   ├── routes/          # Express routes
│   ├── controllers/     # Request handlers
│   └── middleware/      # Auth, errors, rate limiting
├── models/              # MongoDB schemas
└── server.js            # Entry point
```

I tried to follow clean architecture principles, so:
- Infrastructure doesn't leak into business logic
- Everything is dependency-injected for easier testing
- Value objects handle all the tricky financial math

### Why Circuit Breakers?

When Alpha Vantage goes down (and it will), you don't want your app making 100 failed requests and burning through your quota. The circuit breaker pattern:

1. **Closed** (normal): Requests go through
2. **Open** (broken): After N failures, stop sending requests
3. **Half-Open** (testing): After a timeout, try one request to see if it's fixed

This is built into every API client. You can check the status at `/api/v1/status/circuit-breakers`.

## Getting API Keys

You'll need keys for 4 services (the other 2 work without keys). All of them have free tiers.

### Alpha Vantage (Stocks & Forex)
**Get it:** https://www.alphavantage.co/support/#api-key

Free tier gives you 25 requests per day and 5 per minute. That's... not much. But it's free.

If you're serious about this, their paid tier ($49.99/month) bumps you to 75 requests/minute.

```env
ALPHA_VANTAGE_API_KEY=your_key_here
```

### NewsAPI (Headlines)
**Get it:** https://newsapi.org/register

Free tier: 100 requests/day
Paid: $449/month for way more (you probably don't need this)

```env
NEWS_API_KEY=your_key_here
```

### FRED (Economic Data)
**Get it:** https://fred.stlouisfed.org/docs/api/api_key.html

This one's actually unlimited and free. Love the Fed.

```env
FRED_API_KEY=your_key_here
```

### Finnhub (Market Data)
**Get it:** https://finnhub.io/register

Free: 60 calls/minute
Paid: $39.99/month for 300 calls/minute

```env
FINNHUB_API_KEY=your_key_here
```

### The Free Ones

**CoinGecko** - Works without a key. If you want pro features, it's $129/month.

**ExchangeRate-API** - 1,500 free requests/month, no key needed. Paid tier is $9/month for 100k requests.

### Testing Your Keys

Make sure they work before running the app:

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

If you get JSON back instead of an error, you're good.

## Deploying This Thing

### Render.com (Easiest Option)

I've included a `render.yaml` file that sets everything up automatically.

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repo
5. Add your API keys in the environment variables section
6. Click "Apply"

Render will create MongoDB, Redis, and deploy your app. Free tier works fine for testing.

Your app will be at: `https://your-app-name.onrender.com`

### Heroku

```bash
# Install the CLI
npm install -g heroku

# Login and create app
heroku login
heroku create globalfi-ultra

# Add databases
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:mini

# Set your API keys
heroku config:set ALPHA_VANTAGE_API_KEY=your_key
heroku config:set NEWS_API_KEY=your_key
heroku config:set FRED_API_KEY=your_key
heroku config:set FINNHUB_API_KEY=your_key

# Deploy
git push heroku main
```

### Docker

```bash
# Build and run locally
docker-compose up -d

# Or push to Docker Hub
docker build -t yourusername/globalfi-ultra .
docker push yourusername/globalfi-ultra
```

### Environment Variables for Production

Don't forget to set these:

```env
NODE_ENV=production
LOG_LEVEL=warn
MONGODB_URI=your_production_mongodb_url
REDIS_URL=your_production_redis_url
CORS_ORIGIN=https://your-frontend.com
```

## Common Issues

**"Can't connect to MongoDB"**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Start MongoDB first: `mongod` or `brew services start mongodb-community` (Mac) or use Docker.

**"Can't connect to Redis"**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
Start Redis: `redis-server` or `brew services start redis` (Mac) or Docker.

**"Circuit breaker is OPEN"**
```
Error: Circuit breaker is OPEN for service: alphavantage
```
The API failed too many times. Either:
- Wait 60 seconds for it to try again
- Check your API key is valid
- Check you didn't hit rate limits
- Look at `/api/v1/status/circuit-breakers` for details

**"Too many requests"**
You hit the rate limiter. Wait 15 minutes or check your API quotas.

**"Invalid API key"**
Double-check your `.env` file. Keys should be the actual string, no quotes.

## Contributing

Found a bug? Want to add a feature? PRs welcome!

1. Fork it
2. Create your feature branch (`git checkout -b cool-feature`)
3. Commit your changes (`git commit -m 'Add cool feature'`)
4. Push to the branch (`git push origin cool-feature`)
5. Open a Pull Request

Try to follow the existing code style. Run `npm test` before submitting.

## Useful Scripts

```bash
npm start          # Run in production mode
npm run dev        # Development mode with hot reload
npm test           # Run tests
npm run lint       # Check code style
npm run lint:fix   # Fix code style issues
```

## License

MIT - do whatever you want with this code.

## Credits

Built with Node.js, Express, Socket.io, MongoDB, and Redis.

Data provided by Alpha Vantage, CoinGecko, NewsAPI, FRED, Finnhub, and ExchangeRate-API.

## Need Help?

- Open an issue on GitHub
- Check the `/health` endpoint to see if everything's running
- Check circuit breaker status at `/api/v1/status/circuit-breakers`

---

Made by a developer who got tired of writing the same API integration code over and over. Hope it helps! ⭐ Star this if you find it useful.