/**
 * Global-Fi Ultra - Environment Configuration
 * 
 * Zod-validated environment variables with type-safe defaults.
 * All configuration is loaded from environment variables.
 */

import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/globalfi'),
  MONGODB_POOL_SIZE: z.string().transform(Number).default('10'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_TTL_DEFAULT: z.string().transform(Number).default('300'),

  // API Keys
  ALPHA_VANTAGE_API_KEY: z.string().default('demo'),
  COINGECKO_API_KEY: z.string().optional().default(''),
  NEWS_API_KEY: z.string().default(''),
  FRED_API_KEY: z.string().default(''),
  FINNHUB_API_KEY: z.string().default(''),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Circuit Breaker
  CIRCUIT_BREAKER_THRESHOLD: z.string().transform(Number).default('3'),
  CIRCUIT_BREAKER_TIMEOUT: z.string().transform(Number).default('30000'),
  CIRCUIT_BREAKER_RESET_TIMEOUT: z.string().transform(Number).default('30000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),

  // Socket.io
  SOCKET_IO_CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),

  // Feature Flags
  ENABLE_CACHE_WARMING: z.string().transform(v => v === 'true').default('false'),
  ENABLE_METRICS_COLLECTION: z.string().transform(v => v === 'true').default('true'),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
};

/**
 * Validated environment configuration
 */
export const env = parseEnv();

/**
 * Configuration object with structured access
 */
export const config = {
  server: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  
  database: {
    uri: env.MONGODB_URI,
    poolSize: env.MONGODB_POOL_SIZE,
  },
  
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    ttlDefault: env.REDIS_TTL_DEFAULT,
  },
  
  apiKeys: {
    alphaVantage: env.ALPHA_VANTAGE_API_KEY,
    coinGecko: env.COINGECKO_API_KEY,
    newsApi: env.NEWS_API_KEY,
    fred: env.FRED_API_KEY,
    finnhub: env.FINNHUB_API_KEY,
  },
  
  security: {
    corsOrigins: env.CORS_ORIGIN.split(',').map(s => s.trim()),
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  circuitBreaker: {
    threshold: env.CIRCUIT_BREAKER_THRESHOLD,
    timeout: env.CIRCUIT_BREAKER_TIMEOUT,
    resetTimeout: env.CIRCUIT_BREAKER_RESET_TIMEOUT,
  },
  
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },
  
  socketIo: {
    corsOrigins: env.SOCKET_IO_CORS_ORIGIN.split(',').map(s => s.trim()),
  },
  
  features: {
    cacheWarming: env.ENABLE_CACHE_WARMING,
    metricsCollection: env.ENABLE_METRICS_COLLECTION,
  },

  /** Cache TTLs per API source (in seconds) */
  cacheTTL: {
    alphaVantage: 60,
    coinGecko: 30,
    exchangeRate: 300,
    newsApi: 600,
    fred: 1800,
    finnhub: 600,
  },
};

export default config;
