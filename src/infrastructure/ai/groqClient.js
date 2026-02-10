/**
 * Groq AI Client Wrapper
 * 
 * High-performance AI client for Global-Fi Ultra using Groq's inference platform.
 * Handles model selection, retries, caching, streaming, and error recovery.
 * 
 * Features:
 * - Automatic model selection based on task complexity
 * - Exponential backoff retry logic
 * - Response caching to save API quota
 * - Token streaming for real-time chat
 * - Comprehensive error handling
 * 
 * @module infrastructure/ai/groqClient
 */

import Groq from 'groq-sdk';
import crypto from 'crypto';
import { AI_CONFIG } from './aiConfig.js';

// Custom error classes
export class AIServiceError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'AIServiceError';
    this.originalError = originalError;
  }
}

export class AIRateLimitError extends AIServiceError {
  constructor(retryAfter = 60) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    this.name = 'AIRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AIAuthError extends AIServiceError {
  constructor() {
    super('Invalid Groq API key. Please check GROQ_API_KEY environment variable');
    this.name = 'AIAuthError';
  }
}

export class AITimeoutError extends AIServiceError {
  constructor(timeout) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'AITimeoutError';
    this.timeout = timeout;
  }
}

/**
 * Groq AI Client
 * 
 * @class
 * @example
 * const client = new GroqClient({
 *   apiKey: process.env.GROQ_API_KEY,
 *   cacheService: redisCache,
 *   logger: winston
 * });
 * 
 * const response = await client.generateContent(prompt, { complex: true });
 */
export class GroqClient {
  /**
   * Initialize Groq client with dependencies
   * 
   * @param {Object} dependencies
   * @param {string} dependencies.apiKey - Groq API key
   * @param {Object} dependencies.cacheService - Redis cache service
   * @param {Object} dependencies.logger - Logger instance
   * @throws {Error} If API key is missing
   */
  constructor({ apiKey, cacheService, logger }) {
    // Validate API key
    if (!apiKey) {
      throw new Error('Groq API key is required');
    }

    this.apiKey = apiKey;
    this.cacheService = cacheService;
    this.logger = logger || console;

    // Initialize Groq SDK
    this.client = new Groq({
      apiKey: this.apiKey
    });

    this.config = AI_CONFIG;

    this.logger.info('GroqClient initialized', {
      models: this.config.models
    });
  }

  /**
   * Select appropriate model based on task complexity
   * 
   * @private
   * @param {boolean} complex - Whether task is complex
   * @returns {string} Model identifier
   */
  _selectModel(complex = false) {
    return complex 
      ? this.config.models.primary   // Llama 3.3 70B for complex tasks
      : this.config.models.fast;     // Llama 3.1 8B for simple tasks
  }

  /**
   * Generate cache key from prompt
   * 
   * @private
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @returns {string} Cache key
   */
  _generateCacheKey(prompt, options = {}) {
    const hash = crypto
      .createHash('md5')
      .update(prompt + JSON.stringify(options))
      .digest('hex');
    return `ai:response:${hash}`;
  }

  /**
   * Sleep utility for retry backoff
   * 
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute request with retry logic
   * 
   * @private
   * @param {Function} requestFn - Async function to execute
   * @param {number} attempt - Current attempt number
   * @returns {Promise<any>} Response
   */
  async _withRetry(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      // Check if we should retry
      const shouldRetry = 
        attempt < this.config.retries.maxAttempts &&
        (error.status === 429 || error.status >= 500);

      if (!shouldRetry) {
        throw error;
      }

      // Calculate backoff
      const backoff = Math.min(
        this.config.retries.initialBackoffMs * 
        Math.pow(this.config.retries.backoffMultiplier, attempt - 1),
        this.config.retries.maxBackoffMs
      );

      this.logger.warn('Retrying request', {
        attempt,
        backoffMs: backoff,
        error: error.message
      });

      await this._sleep(backoff);
      return this._withRetry(requestFn, attempt + 1);
    }
  }

  /**
   * Validate API key
   * 
   * @returns {Promise<boolean>} True if key is valid
   * @throws {AIAuthError} If key is invalid
   */
  async validateApiKey() {
    try {
      // Simple test request
      await this.client.chat.completions.create({
        model: this.config.models.fast,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        throw new AIAuthError();
      }
      throw new AIServiceError('API key validation failed', error);
    }
  }

  /**
   * Generate content using appropriate model
   * 
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @param {boolean} options.complex - Use 70B model for complex tasks
   * @param {number} options.maxTokens - Max response tokens
   * @param {number} options.temperature - Randomness (0-2)
   * @param {boolean} options.cache - Enable caching
   * @returns {Promise<string>} Generated text
   * @throws {AIServiceError} If generation fails
   */
  async generateContent(prompt, options = {}) {
    const {
      complex = false,
      maxTokens = this.config.generation.maxTokens,
      temperature = this.config.generation.temperature,
      cache = this.config.cache.enabled
    } = options;

    // Check cache first
    if (cache && this.cacheService) {
      const cacheKey = this._generateCacheKey(prompt, options);
      const cached = await this.cacheService.get(cacheKey);
      
      if (cached) {
        this.logger.info('AI cache hit', { cacheKey });
        return cached;
      }
    }

    // Select model
    const model = this._selectModel(complex);

    this.logger.info('Generating AI content', {
      model,
      promptLength: prompt.length,
      maxTokens
    });

    try {
      // Execute with retry logic
      const response = await this._withRetry(async () => {
        return await this.client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
          top_p: this.config.generation.topP
        });
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new AIServiceError('Empty response from Groq API');
      }

      // Cache successful response
      if (cache && this.cacheService) {
        const cacheKey = this._generateCacheKey(prompt, options);
        const ttl = this.config.cache.ttl.standard;
        await this.cacheService.set(cacheKey, content, ttl);
      }

      this.logger.info('AI generation successful', {
        model,
        outputLength: content.length,
        tokensUsed: response.usage?.total_tokens
      });

      return content;
    } catch (error) {
      this.logger.error('AI generation failed', {
        error: error.message,
        model,
        prompt: prompt.substring(0, 100)
      });

      // Handle specific errors
      if (error.status === 429) {
        throw new AIRateLimitError();
      }
      if (error.status === 401 || error.status === 403) {
        throw new AIAuthError();
      }

      throw new AIServiceError('Content generation failed', error);
    }
  }

  /**
   * Stream content token-by-token
   * 
   * @param {string} prompt - Input prompt
   * @param {Function} onChunk - Callback for each token chunk
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Complete response
   * @throws {AIServiceError} If streaming fails
   */
  async streamContent(prompt, onChunk, options = {}) {
    const {
      complex = true, // Usually use 70B for interactive chat
      maxTokens = this.config.generation.maxTokens,
      temperature = this.config.generation.temperature
    } = options;

    const model = this._selectModel(complex);

    this.logger.info('Starting AI stream', {
      model,
      promptLength: prompt.length
    });

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
        stream: true
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          await onChunk(content);
        }
      }

      this.logger.info('AI stream complete', {
        model,
        outputLength: fullResponse.length
      });

      return fullResponse;
    } catch (error) {
      this.logger.error('AI streaming failed', {
        error: error.message,
        model
      });

      throw new AIServiceError('Content streaming failed', error);
    }
  }

  /**
   * Generate structured JSON output
   * 
   * @param {string} prompt - Prompt with JSON schema instructions
   * @param {Object} schema - Expected JSON structure (for validation)
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {AIServiceError} If generation or parsing fails
   */
  async generateJSON(prompt, schema = null, options = {}) {
    // Add JSON formatting instructions
    const jsonPrompt = `${prompt}

CRITICAL: Respond with ONLY valid JSON. No markdown, no code blocks, no explanations.
Output format must match the specified schema exactly.`;

    const response = await this.generateContent(jsonPrompt, options);

    try {
      // Remove any markdown code blocks
      const cleaned = response
        .replace(/```json\n?|\n?```/g, '')
        .trim();

      // Parse JSON
      const parsed = JSON.parse(cleaned);

      // Basic schema validation if provided
      if (schema && typeof schema === 'object') {
        const requiredKeys = Object.keys(schema);
        const missingKeys = requiredKeys.filter(key => !(key in parsed));

        if (missingKeys.length > 0) {
          this.logger.warn('JSON response missing keys', {
            missingKeys,
            receivedKeys: Object.keys(parsed)
          });
        }
      }

      return parsed;
    } catch (error) {
      this.logger.error('JSON parsing failed', {
        error: error.message,
        response: response.substring(0, 200)
      });

      throw new AIServiceError('Invalid JSON response from AI', error);
    }
  }

  /**
   * Get usage statistics (if tracking)
   * 
   * @returns {Object} Usage stats
   */
  getUsageStats() {
    // TODO: Implement token usage tracking
    return {
      tokensUsed: 0,
      requestsToday: 0,
      cacheHitRate: 0
    };
  }
}

export default GroqClient;
