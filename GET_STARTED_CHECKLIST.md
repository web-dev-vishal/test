# 🚀 Get Started Checklist

Follow this checklist to get AI features up and running in 10 minutes!

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Redis running (or Docker)
- [ ] MongoDB running (or Docker)
- [ ] Git repository cloned

## 📦 Step 1: Install Dependencies (2 min)

```bash
# Install all dependencies
npm install
```

**What gets installed:**
- `groq-sdk` - Groq AI client
- `chalk` - Terminal colors
- `cli-table3` - Pretty tables
- `inquirer` - Interactive prompts
- `ora` - Spinners
- `commander` - CLI framework

**Verify:**
```bash
npm list groq-sdk
# Should show: groq-sdk@x.x.x
```

## 🔑 Step 2: Get Groq API Key (3 min)

- [ ] Visit https://console.groq.com/keys
- [ ] Sign up (free, no credit card)
- [ ] Click "Create API Key"
- [ ] Copy your key (starts with `gsk_`)

**Free Tier Limits:**
- 300K tokens/min
- 1K requests/min
- No daily limits ✅

## ⚙️ Step 3: Configure Environment (1 min)

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your key
# GROQ_API_KEY=gsk_your_actual_key_here
```

**Required variables:**
```env
GROQ_API_KEY=gsk_your_key_here
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant
```

**Optional (for job queue):**
```env
RABBITMQ_URL=amqp://localhost:5672
```

## 🧪 Step 4: Test Redis Monitor (1 min)

```bash
# Start Redis (if not running)
docker-compose up -d redis

# Test monitor
npm run redis:monitor
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║           REDIS CACHE MONITOR v1.0                        ║
╚═══════════════════════════════════════════════════════════╝

📊 Cache Statistics
Total Keys: X        Memory Used: X MB
```

**Commands to try:**
- Press `R` to refresh
- Press `H` for health check
- Press `Q` to quit

## 🤖 Step 5: Test AI Features (2 min)

```bash
# Run AI demo
npm run ai:demo
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║         Global-Fi Ultra - AI Features Demo               ║
╚═══════════════════════════════════════════════════════════╝

🔌 Connecting to Redis...
✅ Redis connected

🤖 Initializing Groq AI client...
✅ AI client ready

📊 Demo 1: Sentiment Analysis
...
```

**If you see errors:**
- Check `GROQ_API_KEY` in `.env`
- Verify Redis is running
- Check logs in `logs/app.log`

## 🌐 Step 6: Test Integration Server (1 min)

```bash
# Start integration server
npm run ai:integrate
```

**Expected output:**
```
✅ Server started successfully!

🌐 HTTP Server: http://localhost:3000
🔌 WebSocket: ws://localhost:3000

📚 Available AI Endpoints:
  POST /api/v1/ai/sentiment
  POST /api/v1/ai/analyze
  ...
```

**Keep this running for next step!**

## 💬 Step 7: Test WebSocket Chat (Optional)

Open `examples/websocket-client.html` in your browser.

**Try these:**
- "Explain what causes inflation"
- "What factors affect stock prices?"
- "Compare Bitcoin vs Ethereum"

**Expected:**
- See streaming response
- Real-time token-by-token output
- Professional chat interface

## 🧪 Step 8: Test HTTP API

Open a new terminal and test endpoints:

```bash
# Test sentiment analysis
curl -X POST http://localhost:3000/api/v1/ai/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text":"Stock market hits all-time high"}'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "sentiment": "positive",
#     "confidence": 85,
#     "reasoning": "..."
#   }
# }
```

```bash
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

# Expected response:
# {
#   "success": true,
#   "data": {
#     "trend": "bullish",
#     "confidence": 75,
#     "support": 145.00,
#     "resistance": 155.00,
#     ...
#   }
# }
```

## 📊 Step 9: Monitor Cache

```bash
# Open new terminal
npm run redis:monitor

# Watch cache populate as you make requests
# You should see keys like:
# - ai:response:xxxxx
# - cache:stocks:AAPL
```

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Groq API key obtained
- [ ] `.env` configured
- [ ] Redis monitor works
- [ ] AI demo runs successfully
- [ ] Integration server starts
- [ ] WebSocket chat works
- [ ] HTTP endpoints respond
- [ ] Redis cache populates

## 🎉 Success!

If all checks pass, you're ready to integrate AI into your app!

## 📚 Next Steps

### Learn More
- [ ] Read `docs/AI_FEATURES.md` - Full documentation
- [ ] Read `docs/QUICK_START_AI.md` - Quick start guide
- [ ] Read `docs/INTEGRATION_GUIDE.md` - Integration steps

### Integrate
- [ ] Add AI routes to your Express app
- [ ] Initialize services in DI container
- [ ] Connect WebSocket handler
- [ ] Test with your data

### Customize
- [ ] Adjust cache TTLs in `aiConfig.js`
- [ ] Customize prompts in services
- [ ] Add your own AI endpoints
- [ ] Create custom analysis methods

## 🐛 Troubleshooting

### "Invalid API key"
```bash
# Check .env file
cat .env | grep GROQ_API_KEY

# Should show: GROQ_API_KEY=gsk_...
# If not, add it and restart
```

### "Redis connection failed"
```bash
# Start Redis
docker-compose up -d redis

# Or if using local Redis
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Rate limit exceeded"
```bash
# Wait 60 seconds
# Or enable caching to reduce API calls
# Caching is enabled by default
```

### "Port already in use"
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -ti:3000 | xargs kill
```

## 💡 Pro Tips

1. **Use Redis monitor** to debug caching issues
   ```bash
   npm run redis:watch
   ```

2. **Check logs** for detailed error messages
   ```bash
   tail -f logs/app.log
   ```

3. **Test with simple queries first**
   ```bash
   curl -X POST http://localhost:3000/api/v1/ai/sentiment \
     -H "Content-Type: application/json" \
     -d '{"text":"good"}'
   ```

4. **Monitor API usage** in Groq console
   - Visit https://console.groq.com/usage
   - Check tokens used
   - Monitor rate limits

5. **Enable caching** to save API quota
   - Already enabled by default
   - Check cache hits in Redis monitor
   - Adjust TTLs in `aiConfig.js`

## 📞 Get Help

### Documentation
- `docs/AI_FEATURES.md` - Full features
- `docs/QUICK_START_AI.md` - Quick start
- `docs/INTEGRATION_GUIDE.md` - Integration
- `AI_IMPLEMENTATION_COMPLETE.md` - Implementation details

### Examples
- `examples/test-ai-features.js` - Demo script
- `examples/integrate-ai.js` - Integration example
- `examples/websocket-client.html` - Chat UI

### Tests
- `__tests__/unit/AINewsService.test.js` - Unit tests
- Run with: `npm test`

### External Resources
- Groq Docs: https://console.groq.com/docs
- Redis Docs: https://redis.io/docs
- Socket.io Docs: https://socket.io/docs

## 🎯 Quick Commands Reference

```bash
# Redis monitoring
npm run redis:monitor    # Interactive mode
npm run redis:watch      # Auto-refresh
npm run redis:stats      # Statistics only
npm run redis:health     # Health check

# AI demos
npm run ai:demo          # Test AI features
npm run ai:integrate     # Run integration server

# Development
npm run dev              # Start dev server
npm test                 # Run tests
npm run lint             # Check code style
```

## ✨ You're All Set!

Everything is working? Great! 🎉

Now you can:
1. Integrate AI into your app
2. Build custom AI features
3. Deploy to production

Happy coding! 🚀

---

**Need help?** Check the documentation or create an issue on GitHub.

**Found a bug?** Please report it with steps to reproduce.

**Have a suggestion?** We'd love to hear it!
