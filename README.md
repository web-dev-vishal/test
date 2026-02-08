# Global-Fi Ultra

Real-time financial data aggregator that pulls from 6+ APIs and streams market data via WebSockets. Built for traders, developers, and anyone who needs reliable market data without the headache of managing multiple API integrations.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why This Exists

I got tired of juggling multiple API keys, dealing with rate limits, and writing the same error handling code repeatedly. Global-Fi Ultra solves this by:

- **Aggregating everything** - stocks, crypto, forex, and news into one clean API
- **Handling the hard parts** - circuit breakers and retry logic built-in
- **Real-time updates** - WebSocket streaming, no polling needed
- **Financial precision** - Big.js eliminates floating-point errors

It's the API wrapper I wish existed when I started building trading tools.

---

## Dashboard Preview

The platform provides a clean, responsive interface for monitoring markets:

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

## What You Get

### Six Data Sources, One API

**Alpha Vantage** - Stock quotes and forex data (15min delayed on free tier)

**CoinGecko** - Cryptocurrency prices for 10,000+ coins, completely free

**ExchangeRate-API** - 160+ currency pairs with daily updates

**NewsAPI** - Financial news headlines from major publications

**FRED** - US economic data straight from the Federal Reserve

**Finnhub** - Real-time market data for stocks and crypto

### The Good Stuff

**WebSocket Streaming**
Connect once, get updates pushed to you. No more hammering APIs with polling requests. Updates arrive within seconds of market changes.

**Circuit Breakers**
When an API goes down (and they do), the system automatically stops sending requests and tries again later. Your app won't crash because Alpha Vantage is having a bad day.

**Precision Math**
Financial calculations use Big.js instead of JavaScript's janky floating-point math. No more `0.1 + 0.2 = 0.30000000000000004` nonsense.

**Smart Caching**
Redis caching with different TTLs per API. Stock data cached for 60s, news for 5min, etc. Saves your API quota and speeds everything up.

**Production Ready**
Health checks, graceful shutdown, Docker setup, rate limiting. I run this in production, so it's battle-tested.

---

## Installation Guide

### What You'll Need

- Node.js version 18 or higher
- MongoDB database (version 5+)
- Redis cache server (version 6+)
- Docker (optional but makes everything easier)

### Quick Setup

**Step 1: Get the Code**

Download or clone the repository to your computer. Extract it to a folder and open a terminal in that directory.

Install all dependencies by running the npm install command.

**Step 2: Configure Your Environment**

Copy the example environment file to create your own configuration. You'll need to edit this file with your actual API keys and database connections.

Important settings to configure:
- API keys for the six data sources
- MongoDB connection string
- Redis server address
- Server port (default is 3000)
- CORS origins for your frontend

**Step 3: Get Your API Keys**

Visit each provider's website and sign up for free API keys:
- Alpha Vantage for stock data
- NewsAPI for financial news
- FRED for economic indicators  
- Finnhub for market data
- CoinGecko works without a key
- ExchangeRate-API works without a key

**Step 4: Start the Server**

**Using Docker (Recommended):**

Run the Docker compose command. This automatically starts MongoDB, Redis, and the application server. Everything is configured and ready to use.

Open your browser to localhost:3000/health to verify it's running.

**Without Docker:**

Start MongoDB and Redis manually first. Then run the development server command. The application will connect to your local databases.

**Step 5: Verify Everything Works**

Visit the health endpoint in your browser. You should see a JSON response showing the server is operational.

Try accessing the financial data endpoint. If you see market data, congratulations - you're all set!

---

## API Endpoints Overview

Base URL: `http://localhost:3000/api/v1`

### System Health

**Health Check** - GET /health  
Returns basic server status and uptime. Use this for monitoring tools.

**Readiness Check** - GET /readiness  
Verifies database connections. Use this before sending traffic to the server.

### Market Data

**Live Financial Data** - GET /api/v1/financial/live  
Fetches fresh data from all six external APIs. Slower but guaranteed current.

**Cached Financial Data** - GET /api/v1/financial/cached  
Returns data from Redis cache. Much faster, might be up to 60 seconds old.

Response includes stocks, cryptocurrency, forex rates, news headlines, and economic indicators.

### User Management

**List Users** - GET /api/v1/users  
Get all users with pagination support. Query parameters: page, limit

**Get User** - GET /api/v1/users/:id  
Retrieve specific user information by ID.

**Create User** - POST /api/v1/users  
Register new user account. Requires email and name.

**Update User** - PATCH /api/v1/users/:id  
Modify user preferences or profile information.

**Delete User** - DELETE /api/v1/users/:id  
Remove user account (soft delete, can be recovered).

### Watchlists

**List Watchlists** - GET /api/v1/watchlists  
Get all watchlists. Filter by userId to get user-specific lists.

**Create Watchlist** - POST /api/v1/watchlists  
Create new watchlist with name, description, and initial assets.

**Add Asset** - POST /api/v1/watchlists/:id/assets  
Add new asset to existing watchlist.

**Remove Asset** - DELETE /api/v1/watchlists/:id/assets/:symbol  
Remove specific asset from watchlist.

### Price Alerts

**List Alerts** - GET /api/v1/alerts  
Get all alerts. Supports filtering by userId, symbol, and active status.

**Create Alert** - POST /api/v1/alerts  
Set up new price alert with conditions and thresholds.

**Activate Alert** - PATCH /api/v1/alerts/:id/activate  
Enable a previously disabled alert.

**Deactivate Alert** - PATCH /api/v1/alerts/:id/deactivate  
Temporarily disable an alert without deleting it.

Alert types: price (specific value), change (percentage), volume (unusual activity)  
Conditions: above, below, crosses (triggers either direction)

### Administration

**Clear Cache** - POST /api/v1/admin/cache/clear  
Flush all Redis cache. Use when APIs return incorrect data.

**System Metrics** - GET /api/v1/admin/metrics  
View memory usage, request statistics, and cache performance.

**Circuit Breaker Status** - GET /api/v1/status/circuit-breakers  
Check which external APIs are currently operational or blocked.

States: closed (working), open (blocked), half-open (testing recovery)

---

## Real-Time Updates

### WebSocket Connection

The application uses WebSockets to push live market data to connected clients. Instead of your frontend repeatedly asking for updates (polling), the server sends new data whenever it becomes available.

**Connection Flow:**
1. Client connects to the WebSocket server
2. Server acknowledges the connection
3. Client subscribes to specific assets or all data
4. Server pushes updates as they arrive
5. Connection automatically reconnects if dropped

**Data Update Frequency:**
- Stock prices: Every 30-60 seconds
- Crypto prices: Every 30-60 seconds
- Forex rates: Every 5 minutes
- News headlines: Every 5 minutes
- Economic data: Hourly or when published

### Frontend Integration

**Connection Status Display:**

Show users their connection state with a colored indicator:
- Green indicator: Connected and receiving updates
- Yellow indicator: Connecting or reconnecting  
- Red indicator: Disconnected, using cached data
- Gray indicator: Not connected (offline mode)

**Handling Updates:**

When new data arrives, update the UI smoothly:
- Fade in the new price
- Flash the price card briefly
- Animate the change percentage
- Update charts with new data point
- Play sound alert if enabled

**Connection Management:**

Best practices for WebSocket connections:
- Connect when user opens the app
- Disconnect when user closes or minimizes
- Reconnect automatically if connection drops
- Show reconnection progress to user
- Fall back to polling if WebSocket fails

**User Controls:**

Give users control over real-time features:
- Toggle for auto-refresh on/off
- Pause/resume data updates
- Adjust update frequency
- Enable/disable sound notifications
- Choose which assets to track

---

## UI Components & Integration

### Frontend Integration

The API is designed to work with any frontend framework. Here's what you need to know:

**Real-time Price Display**
Updates arrive via WebSocket every 30-60 seconds. Use these to update your price cards, tickers, or charts immediately.

**Status Indicators**
Show connection status (connected/disconnected) and circuit breaker states to users. When an API is down, display a warning banner.

**Error Handling**
Display user-friendly messages when:
- WebSocket disconnects (show "Reconnecting...")
- API returns errors (show "Data temporarily unavailable")
- Rate limits hit (show "Too many requests, please wait")

### Recommended UI Flow

**Dashboard Layout:**
- Top bar: Navigation, user menu, connection status
- Left sidebar: Watchlists, market categories
- Main area: Price cards, charts, alerts
- Right sidebar: News feed, economic calendar

**Mobile Responsive:**
- Collapse sidebar into hamburger menu
- Stack price cards vertically
- Swipeable tabs for different asset types
- Bottom navigation bar

**Dark Mode:**
- Provide light/dark theme toggle
- Store preference in user settings
- Use appropriate chart colors for each theme

---

## System Architecture

### How It Works

```
Your App → Global-Fi Ultra → 6 External APIs
         ↓
    MongoDB + Redis
```

Data flow:
1. Request comes in
2. Check Redis cache first
3. If cached, return immediately
4. If not, call external APIs (with circuit breaker protection)
5. Normalize and cache the results
6. Stream to WebSocket clients
7. Return to HTTP client

### File Organization

```
src/
├── config/              Environment, DB, Redis
├── infrastructure/      API clients, caching, WebSockets
├── application/         Business logic and orchestration
├── domain/              Core financial math (Money, Percentage)
├── presentation/        HTTP routes and controllers
├── models/              MongoDB schemas
└── server.js            Entry point
```

The codebase follows clean architecture principles with dependency injection for easier testing.

### Circuit Breaker Pattern

Protects against cascading failures:

**Closed (working)** - Requests flow normally

**Open (broken)** - After too many failures, block all requests temporarily

**Half-Open (testing)** - After timeout, try one request to check recovery

Check status: `GET /api/v1/status/circuit-breakers`

---

## Getting API Keys

You need keys for 4 services (the other 2 work without keys). All have free tiers.

### Alpha Vantage (Stocks & Forex)

Visit: https://www.alphavantage.co/support/#api-key

Free tier: 25 requests/day, 5 per minute (not much, but free)
Paid: $49.99/month for 75 requests/minute

### NewsAPI (Headlines)

Visit: https://newsapi.org/register

Free: 100 requests/day
Paid: $449/month (you probably don't need this)

### FRED (Economic Data)

Visit: https://fred.stlouisfed.org/docs/api/api_key.html

Actually unlimited and free. Love the Fed.

### Finnhub (Market Data)

Visit: https://finnhub.io/register

Free: 60 calls/minute
Paid: $39.99/month for 300 calls/minute

### The Free Ones

**CoinGecko** - Works without a key. Pro features: $129/month

**ExchangeRate-API** - 1,500 free requests/month, no key needed

### Testing Your Keys

Verify they work before running the app. Each API has a test endpoint - check their documentation for quick validation requests.

---

## Deployment

### Render.com (Easiest)

The repo includes `render.yaml` for automatic setup.

1. Push code to GitHub
2. Go to Render Dashboard
3. New → Blueprint
4. Connect your repo
5. Add API keys
6. Click Apply

Render creates MongoDB, Redis, and deploys your app. Free tier works for testing.

Your app: `https://your-app-name.onrender.com`

### Heroku

```bash
heroku create globalfi-ultra
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:mini
heroku config:set ALPHA_VANTAGE_API_KEY=your_key
# ... set other keys
git push heroku main
```

### Docker

```bash
docker-compose up -d
```

That's it. Everything runs in containers.

### Production Environment

Important settings for production:

- `NODE_ENV=production`
- `LOG_LEVEL=warn`
- Set your MongoDB URI to production database
- Set Redis URL to production instance
- Configure CORS for your frontend domain
- Enable rate limiting
- Set up SSL/TLS certificates

---

## Common Problems

**Can't connect to MongoDB**
Start MongoDB first or use Docker. Default port is 27017.

**Can't connect to Redis**
Start Redis first or use Docker. Default port is 6379.

**Circuit breaker keeps opening**
Check your API key is valid and you haven't hit rate limits. Wait 60 seconds for automatic retry.

**Too many requests error**
You hit the rate limiter. Wait 15 minutes or increase your limits.

**Invalid API key**
Double-check your `.env` file. Make sure keys are the actual strings without quotes.

**WebSocket not connecting**
Verify the server is running and check firewall rules. WebSocket runs on the same port as HTTP.

---

## Performance Tips

### Caching Strategy

- Stock data: 60 second TTL
- Crypto: 60 second TTL  
- Forex: 5 minute TTL
- News: 5 minute TTL
- Economic indicators: 1 hour TTL

Adjust these in the cache configuration based on your needs.

### Rate Limiting

Free API tiers are limited. To maximize efficiency:
- Use cached endpoints when possible
- Batch requests where supported
- Implement request queuing on high-volume apps
- Monitor circuit breaker status
- Consider upgrading to paid tiers for production

### WebSocket Optimization

- Limit updates to subscribed assets only
- Throttle updates on client side if needed
- Disconnect inactive clients automatically
- Use compression for large data payloads

---

## Contributing

Found a bug? Want to add features? PRs welcome!

1. Fork the repo
2. Create feature branch
3. Make your changes
4. Run tests
5. Submit PR

Follow the existing code style and run `npm test` before submitting.

---

## Available Scripts

```bash
npm start          Production mode
npm run dev        Development with hot reload
npm test           Run tests
npm run lint       Check code style
npm run docker:run Start with Docker
```

---

## License

MIT - use this however you want.

---

## Credits

Built with Node.js, Express, Socket.io, MongoDB, and Redis.

Data from Alpha Vantage, CoinGecko, NewsAPI, FRED, Finnhub, and ExchangeRate-API.

---

## Get Help

- Open an issue on GitHub
- Check `/health` endpoint
- Review circuit breaker status

---

Made by a developer tired of writing the same API code repeatedly. Star it if it helps! ⭐

## Visual Design Guidelines

### Color Scheme

**Light Mode:**
- Background: Clean white (#FFFFFF) with light gray sections (#F5F7FA)
- Primary: Professional blue (#2563EB) for buttons and links
- Success: Green (#10B981) for positive price changes
- Danger: Red (#EF4444) for negative price changes
- Text: Dark gray (#1F2937) for readability

**Dark Mode:**
- Background: Deep navy (#0F172A) with slightly lighter panels (#1E293B)
- Primary: Bright blue (#3B82F6) that pops on dark background
- Success: Bright green (#22C55E) visible in dark theme
- Danger: Vibrant red (#F87171) for warnings
- Text: Light gray (#E2E8F0) for comfortable reading

### Typography

**Headings:**
- Use clear, modern sans-serif fonts (Inter, Roboto, or system fonts)
- Large headings for asset prices (32px-48px)
- Medium headings for section titles (24px-32px)
- Keep everything readable at a glance

**Numbers:**
- Monospaced fonts for prices and percentages
- Large, bold for primary price display
- Color-coded change indicators
- Clear decimal alignment

**Body Text:**
- Standard 16px for comfortable reading
- Line height 1.5 for better readability
- Proper contrast ratios (WCAG AA compliant)

### Component Library

**Price Cards:**
Each card displays:
- Asset symbol and name
- Current price (large, prominent)
- Change percentage (color-coded)
- 24h high/low range
- Volume indicator
- Mini sparkline chart

**Alert Badge:**
- Position in top-right of screen
- Slide-in animation when triggered
- Auto-dismiss after 5 seconds
- Click to view alert details
- Different colors for different alert types

**Chart Container:**
- Full-width responsive canvas
- Time period selector buttons
- Drawing tools toggle
- Fullscreen mode option
- Export chart functionality

**News Card:**
- Headline with source logo
- Timestamp (relative time)
- Category tag
- Thumbnail image (optional)
- Read more link

### Responsive Breakpoints

**Mobile (< 640px):**
- Single column layout
- Stacked price cards
- Bottom navigation bar
- Simplified charts
- Collapsible news feed

**Tablet (640px - 1024px):**
- Two-column grid
- Sidebar overlay menu
- Medium-sized charts
- Condensed watchlists

**Desktop (> 1024px):**
- Multi-column dashboard
- Persistent sidebar
- Large interactive charts
- Full feature set

## User Experience Patterns

### Dashboard Interactions

**First-Time User Flow:**
1. Welcome screen with quick tour option
2. Connect API keys setup wizard
3. Create first watchlist prompt
4. Set up initial price alerts
5. Enable notifications permission

**Returning User Flow:**
1. Auto-login with saved session
2. Dashboard loads with cached data immediately
3. WebSocket connects in background
4. Data refreshes as new updates arrive
5. Alerts check against current prices

### Data Loading States

**Initial Load:**
- Show skeleton screens while fetching
- Display "Connecting to markets..." message
- Animate loading indicators
- Progressive enhancement (show cached first, then live)

**Live Updates:**
- Smooth transitions when prices change
- Flash animation on update
- No jarring reloads or jumps
- Maintain scroll position

**Error States:**
- Friendly error messages (not technical jargon)
- Retry button when APIs fail
- Offline mode indicator
- Degraded functionality notice

### Notification System

**Alert Triggers:**
- Browser push notifications (with permission)
- In-app toast notifications
- Sound alerts (toggleable)
- Email notifications (optional)
- SMS alerts (premium feature)

**Notification Types:**
- Price alerts (target reached)
- Change alerts (percentage moved)
- Volume alerts (unusual activity)
- News alerts (breaking stories)
- System alerts (API issues)

### Search and Filtering

**Asset Search:**
- Instant search as you type
- Search by symbol or company name
- Recent searches saved
- Popular assets suggested
- Category filters (stocks, crypto, forex)

**Watchlist Filtering:**
- Filter by asset type
- Sort by price, change, volume
- Group by category
- Hide/show columns
- Custom sort order

### Chart Interactions

**Time Periods:**
- Quick select buttons (1H, 4H, 1D, 1W, 1M, 3M, 1Y, ALL)
- Custom date range picker
- Remember last selected period
- Smooth transitions between timeframes

**Drawing Tools:**
- Trendlines
- Support/resistance levels
- Fibonacci retracements
- Annotations and notes
- Save drawings for later

**Chart Types:**
- Candlestick (default for stocks)
- Line chart (cleaner for trends)
- Area chart (good for portfolios)
- Bar chart (volume visualization)

### Mobile Experience

**Touch Gestures:**
- Swipe between watchlists
- Pull to refresh data
- Pinch to zoom charts
- Long-press for quick actions
- Swipe to delete alerts

**Mobile Navigation:**
- Bottom tab bar for main sections
- Hamburger menu for settings
- Floating action button for quick add
- Back button navigation support

**Performance:**
- Lazy load images and charts
- Infinite scroll for news feed
- Optimize for 3G connections
- Cache aggressively on mobile
- Reduce animation on low-end devices

---

## Integration Examples

### Frontend Frameworks

**React Integration:**
Use hooks for WebSocket connection, state management with Redux or Context, real-time updates with useEffect, chart libraries like Recharts or TradingView

**Vue Integration:**
Composables for data fetching, Vuex for global state, reactive data binding, chart components with Vue-chartjs

**Angular Integration:**
Services for API calls, RxJS observables for streams, NgRx for state management, component-based architecture

**Next.js/Nuxt:**
Server-side rendering for initial load, API routes for backend proxy, static generation for marketing pages, incremental static regeneration

### UI Component Libraries

Works great with:
- Material-UI (React)
- Ant Design (React)
- Vuetify (Vue)
- PrimeNG (Angular)
- Tailwind CSS (any framework)
- Bootstrap (classic but effective)

### Chart Libraries

Recommended options:
- TradingView Lightweight Charts (best for financial)
- Recharts (React-friendly)
- Chart.js (simple and clean)
- D3.js (ultimate customization)
- ApexCharts (beautiful out of box)

---

## Authentication & Security UI

### Login/Signup Flow

**Registration:**
- Email/password or OAuth (Google, GitHub)
- Email verification required
- Strong password requirements shown
- Terms of service acceptance
- Welcome email sent

**Login:**
- Remember me checkbox
- Forgot password link
- Show/hide password toggle
- Failed login attempts counter
- Two-factor authentication option

**Account Settings:**
- Profile information editor
- API key management panel
- Notification preferences
- Privacy settings
- Delete account option

### Security Indicators

**Connection Status:**
- Green dot: Secure connection active
- Yellow dot: Connecting or reconnecting
- Red dot: Connection lost
- SSL certificate badge
- Last sync timestamp

**Data Privacy:**
- Clear privacy policy link
- Cookie consent banner
- Data export functionality
- Account deletion process
- GDPR compliance notices

---

## Feature Highlights

### Watchlist Management

**Creating Watchlists:**
- Click "New Watchlist" button
- Enter name and description
- Search and add assets
- Set custom weights (optional)
- Choose color theme for list
- Save and view immediately

**Managing Assets:**
- Drag and drop to reorder
- Click to view detailed info
- Quick remove with swipe gesture
- Bulk actions (add/remove multiple)
- Share watchlist via link

**Watchlist Display:**
- Grid or list view toggle
- Sort by various metrics
- Filter by asset type
- Performance summary at top
- Export to CSV option

### Alert System

**Setting Up Alerts:**
- Click on any asset price
- Select "Create Alert"
- Choose condition (above/below/crosses)
- Set target price
- Optional: Add custom message
- Choose notification method

**Alert Types:**
- Price alerts (specific value)
- Percentage change (daily/weekly)
- Volume spikes (unusual activity)
- News mentions (keyword based)
- Technical indicators (RSI, MACD)

**Alert Management:**
- List all active alerts
- Toggle on/off individually
- Edit alert conditions
- View alert history
- Bulk disable/enable

### News Integration

**News Feed Display:**
- Latest headlines at top
- Categorized by topic
- Source attribution
- Reading time estimate
- Related assets linked

**News Filtering:**
- Filter by category
- Search by keyword
- Filter by source
- Date range selector
- Relevance sorting

**News Interactions:**
- Click to read full article
- Save for later
- Share via social media
- Mark as read
- Hide source option

---

## Data Visualization

### Price Charts

**Chart Features:**
- Real-time price updates
- Historical data overlays
- Volume bars below price
- Multiple indicators
- Comparison mode (overlay assets)

**Customization:**
- Color schemes
- Line thickness
- Grid opacity
- Background style
- Save custom layouts

**Technical Analysis:**
- Moving averages (SMA, EMA)
- Bollinger Bands
- RSI indicator
- MACD histogram
- Volume profile

### Portfolio Tracking

**Portfolio View:**
- Total value display
- Daily/weekly/monthly gain
- Asset allocation pie chart
- Performance graph over time
- Cost basis tracking

**Holdings List:**
- Current price vs. buy price
- Profit/loss per asset
- Percentage of portfolio
- Action buttons (buy/sell)
- Notes field

**Performance Metrics:**
- Return on investment (ROI)
- Sharpe ratio
- Maximum drawdown
- Win/loss ratio
- Average holding period

---

## Settings & Customization

### User Preferences

**Display Settings:**
- Light/dark mode toggle
- Currency preference (USD, EUR, etc.)
- Date format preference
- Time zone selection
- Language selection

**Notification Settings:**
- Push notifications on/off
- Sound alerts toggle
- Email frequency
- Alert priority levels
- Quiet hours schedule

**Data Settings:**
- Refresh interval
- Cache duration
- API data sources toggle
- Historical data retention
- Export data format

### Theme Customization

**Color Schemes:**
- Default (blue theme)
- Dark professional
- Light minimal
- High contrast
- Custom colors

**Layout Options:**
- Compact mode
- Comfortable spacing
- Wide charts
- Sidebar position
- Widget arrangement

---

## Admin Dashboard

### System Monitoring

**Health Overview:**
- API status indicators
- Database connection status
- Redis cache health
- Active users count
- Request rate graph

**Performance Metrics:**
- Average response time
- Cache hit ratio
- Error rate
- Memory usage
- CPU utilization

**API Usage:**
- Requests per API
- Rate limit status
- Circuit breaker states
- Failed request log
- Peak usage times

### User Management

**User List:**
- Search users
- Filter by status
- Sort by join date
- View user activity
- User permissions

**User Details:**
- Account information
- Watchlists count
- Active alerts
- API usage
- Login history

### System Controls

**Cache Management:**
- Clear all cache button
- Clear specific API cache
- View cache statistics
- Set TTL values
- Preload cache option

**API Configuration:**
- Enable/disable APIs
- Set rate limits
- Circuit breaker thresholds
- Retry configurations
- Timeout settings

---

## Onboarding Experience

### Welcome Tour

**Step 1: Overview**
- Brief introduction
- Key features highlight
- Navigation preview
- Skip tour option

**Step 2: API Setup**
- Importance of API keys
- Link to get keys
- Paste keys interface
- Test connection button

**Step 3: First Watchlist**
- Create sample watchlist
- Add popular assets
- Explain watchlist features
- Save and continue

**Step 4: Alerts**
- Demo alert creation
- Show notification types
- Set first alert
- Complete tour

### Quick Start Guide

**Getting Data:**
- View live prices immediately
- Understand color indicators
- Read the news feed
- Check economic calendar

**Setting Up:**
- Add favorite assets
- Create watchlists
- Set price alerts
- Customize dashboard

**Advanced Features:**
- Chart technical analysis
- Portfolio tracking
- API customization
- Export data

---

## Best Practices

### For Developers

**API Integration:**
- Use cached endpoints when possible
- Implement exponential backoff
- Handle WebSocket disconnections
- Show loading states
- Cache on client side

**Error Handling:**
- Display user-friendly messages
- Provide retry options
- Log errors properly
- Show offline indicators
- Graceful degradation

**Performance:**
- Lazy load components
- Optimize images
- Debounce search inputs
- Virtual scrolling for long lists
- Code splitting

### For Users

**Efficient Usage:**
- Use watchlists to organize
- Set relevant alerts only
- Check circuit breaker status
- Clear cache if data seems stale
- Report issues via feedback

**Security:**
- Use strong passwords
- Enable two-factor auth
- Don't share API keys
- Log out on public devices
- Review login history

---

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

## Deployment Options

### Render.com (Easiest)

The repository includes a render.yaml configuration file that automates the entire deployment process.

**Steps:**
1. Push your code to GitHub repository
2. Create account on Render.com (free tier available)
3. Click "New" then select "Blueprint"
4. Connect your GitHub repository
5. Render detects the yaml file automatically
6. Add your API keys in environment variables
7. Click "Apply" to deploy

Render automatically creates:
- MongoDB database instance
- Redis cache instance
- Web service for the application
- Health check monitoring
- Auto-deploy on git push

Your application will be live at: `https://your-app-name.onrender.com`

Free tier limitations:
- Spins down after 15 minutes of inactivity
- 750 hours per month
- Limited database storage

Paid tier benefits:
- Always-on service
- More database storage
- Better performance
- Custom domains

### Heroku

Traditional platform-as-a-service option with good documentation.

**Setup Process:**
1. Install Heroku CLI tools
2. Login to your account
3. Create new application
4. Add MongoDB addon (mLab sandbox tier)
5. Add Redis addon (Heroku Redis mini)
6. Configure environment variables with API keys
7. Deploy via git push

**Configuration:**
Set all environment variables through Heroku dashboard or CLI. Include all API keys, database URLs, and application settings.

**Deployment:**
Push your main branch to Heroku remote. The platform automatically detects Node.js and installs dependencies.

### Docker Deployment

Container-based deployment for any cloud provider or self-hosted server.

**Local Testing:**
Use docker-compose to test the full stack locally. This runs MongoDB, Redis, and the application in isolated containers.

**Production Deployment:**
Build the Docker image and push to Docker Hub or your container registry. Deploy to Kubernetes, AWS ECS, Google Cloud Run, or any container platform.

**Container Features:**
- Consistent environment across development and production
- Easy scaling and load balancing
- Automatic restarts on failure
- Resource limits and monitoring

### Environment Configuration

**Development Settings:**
- Detailed logging for debugging
- CORS enabled for local development
- Hot reload for code changes
- Swagger documentation enabled

**Staging Settings:**
- Moderate logging level
- CORS configured for staging domain
- API documentation accessible
- Testing with production-like data

**Production Settings:**
- Minimal logging (errors and warnings)
- Strict CORS policy
- API documentation disabled
- Performance optimizations enabled
- Rate limiting enforced
- Security headers active

### Post-Deployment Checklist

**Verification Steps:**
- Test health endpoint responds correctly
- Verify database connections work
- Check Redis cache is operational
- Test API calls return data
- Confirm WebSocket connections establish
- Review logs for errors

**Monitoring Setup:**
- Configure uptime monitoring
- Set up error alerting
- Enable performance tracking
- Monitor API usage and quotas
- Track database performance

**Security Measures:**
- Enable HTTPS/SSL certificates
- Configure firewall rules
- Set up rate limiting
- Enable CORS properly
- Secure API keys in environment
- Regular security updates

---

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

I'll see you in the next one! 🚀
