# Quick Start: AI Features

Get up and running with AI features in 5 minutes.

## Step 1: Install Dependencies

Already done! The following packages are installed:
- `groq-sdk` - Groq AI client
- `chalk` - Terminal colors
- `cli-table3` - Pretty tables
- `inquirer` - Interactive prompts
- `ora` - Spinners
- `commander` - CLI framework

## Step 2: Get Groq API Key

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up (free, no credit card required)
3. Click "Create API Key"
4. Copy your key (starts with `gsk_`)

## Step 3: Configure Environment

Create or update `.env` file:

```bash
# Copy from example
cp .env.example .env

# Edit .env and add your Groq API key
GROQ_API_KEY=gsk_your_actual_key_here
```

## Step 4: Test Redis Monitor

Make sure Redis is running, then:

```bash
# Interactive mode
npm run redis:monitor

# Or watch mode (auto-refresh)
npm run redis:watch

# Or just view stats
npm run redis:stats
```

## Step 5: Test AI Client

Create a test file `test-ai.js`:

```javascript
import { GroqClient } from './src/infrastructure/ai/groqClient.js';
import { RedisCache } from './src/infrastructure/cache/RedisCache.js';
import { logger } from './src/config/logger.js';
import { config } from './src/config/environment.js';

const testAI = async () => {
  // Initialize
  const groqClient = new GroqClient({
    apiKey: config.ai.groqApiKey,
    cacheService: new RedisCache(),
    logger
  });

  // Test 1: Simple query (fast model)
  console.log('\n🧪 Test 1: Simple sentiment analysis...');
  const sentiment = await groqClient.generateContent(
    'Is this positive or negative: "Stock market hits record high"',
    { complex: false }
  );
  console.log('Result:', sentiment);

  // Test 2: Complex analysis (70B model)
  console.log('\n🧪 Test 2: Complex market analysis...');
  const analysis = await groqClient.generateContent(
    'Explain the relationship between interest rates and stock prices in 2 sentences',
    { complex: true }
  );
  console.log('Result:', analysis);

  // Test 3: JSON output
  console.log('\n🧪 Test 3: Structured JSON output...');
  const json = await groqClient.generateJSON(
    'Analyze this: "Bitcoin surges 10%". Return JSON with: sentiment, confidence (0-100), summary',
    { sentiment: '', confidence: 0, summary: '' },
    { complex: false }
  );
  console.log('Result:', JSON.stringify(json, null, 2));

  console.log('\n✅ All tests passed!');
};

testAI().catch(console.error);
```

Run it:

```bash
node test-ai.js
```

## Available Commands

### Redis Monitoring

```bash
npm run redis:monitor    # Interactive mode
npm run redis:watch      # Auto-refresh mode
npm run redis:keys       # List all keys
npm run redis:stats      # Show statistics
npm run redis:health     # Health check
npm run redis:export     # Export to JSON
```

### Development

```bash
npm run dev              # Start dev server
npm run test             # Run tests
npm run lint             # Check code style
```

## Common Issues

### "Invalid API key"

- Check your `.env` file has `GROQ_API_KEY=gsk_...`
- Make sure the key is valid at [https://console.groq.com/keys](https://console.groq.com/keys)

### "Redis connection failed"

- Make sure Redis is running: `docker-compose up redis`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### "Rate limit exceeded"

- Free tier: 300K tokens/min, 1K requests/min
- Wait 60 seconds or upgrade to paid tier
- Enable caching to reduce API calls

## Next Steps

1. **Read full documentation**: `docs/AI_FEATURES.md`
2. **Explore Redis monitor**: `npm run redis:monitor`
3. **Build AI services**: Create use cases in `src/application/use-cases/`
4. **Add tests**: Write tests in `__tests__/unit/`

## Need Help?

- Groq Docs: [https://console.groq.com/docs](https://console.groq.com/docs)
- Redis Docs: [https://redis.io/docs](https://redis.io/docs)
- Project Issues: [GitHub Issues](https://github.com/web-dev-vishal/Global_Fi_Ultra/issues)

Happy coding! 🚀
