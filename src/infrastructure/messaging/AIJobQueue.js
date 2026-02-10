/**
 * AI Job Queue using RabbitMQ
 * 
 * Handles asynchronous AI analysis jobs using message queues.
 * Useful for batch processing and background tasks.
 * 
 * @module infrastructure/messaging/AIJobQueue
 */

import amqplib from 'amqplib';
import { logger } from '../../config/logger.js';
import { config } from '../../config/environment.js';

/**
 * AI Job Queue
 * 
 * @class
 * @example
 * const queue = new AIJobQueue({
 *   aiNewsService,
 *   aiMarketService
 * });
 * 
 * await queue.connect();
 * await queue.publishJob('analyze_sentiment', { text: '...' });
 */
export class AIJobQueue {
  /**
   * Initialize queue with dependencies
   * 
   * @param {Object} dependencies
   * @param {AINewsService} dependencies.aiNewsService - News service
   * @param {AIMarketService} dependencies.aiMarketService - Market service
   */
  constructor({ aiNewsService, aiMarketService }) {
    this.aiNewsService = aiNewsService;
    this.aiMarketService = aiMarketService;
    this.logger = logger;

    this.connection = null;
    this.channel = null;
    this.isConnected = false;

    // Queue names
    this.queues = {
      sentiment: `${config.rabbitmq.queuePrefix}_ai_sentiment`,
      analysis: `${config.rabbitmq.queuePrefix}_ai_analysis`,
      recommendation: `${config.rabbitmq.queuePrefix}_ai_recommendation`,
      batch: `${config.rabbitmq.queuePrefix}_ai_batch`
    };
  }

  /**
   * Connect to RabbitMQ
   */
  async connect() {
    try {
      this.logger.info('Connecting to RabbitMQ...', {
        url: config.rabbitmq.url.replace(/:[^:@]+@/, ':****@') // Hide password
      });

      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Assert queues
      for (const [name, queueName] of Object.entries(this.queues)) {
        await this.channel.assertQueue(queueName, {
          durable: true,
          arguments: {
            'x-message-ttl': 3600000, // 1 hour TTL
            'x-max-length': 10000      // Max 10k messages
          }
        });

        this.logger.info(`Queue asserted: ${queueName}`);
      }

      // Set prefetch to process one message at a time
      await this.channel.prefetch(1);

      this.isConnected = true;

      // Handle connection events
      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', { error: error.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.logger.info('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Publish job to queue
   * 
   * @param {string} jobType - Type of job (sentiment, analysis, recommendation, batch)
   * @param {Object} data - Job data
   * @param {Object} options - Publishing options
   * @returns {Promise<boolean>} Success status
   */
  async publishJob(jobType, data, options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    const queueName = this.queues[jobType];
    if (!queueName) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    try {
      const message = {
        id: this._generateJobId(),
        type: jobType,
        data,
        timestamp: Date.now(),
        priority: options.priority || 0
      };

      const sent = this.channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          priority: options.priority || 0
        }
      );

      if (sent) {
        this.logger.info('Job published', {
          jobId: message.id,
          type: jobType,
          queue: queueName
        });
      }

      return sent;
    } catch (error) {
      this.logger.error('Failed to publish job', {
        error: error.message,
        jobType
      });
      throw error;
    }
  }

  /**
   * Start consuming jobs from queues
   */
  async startConsumers() {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    // Sentiment analysis consumer
    await this.channel.consume(
      this.queues.sentiment,
      (msg) => this._handleSentimentJob(msg),
      { noAck: false }
    );

    // Market analysis consumer
    await this.channel.consume(
      this.queues.analysis,
      (msg) => this._handleAnalysisJob(msg),
      { noAck: false }
    );

    // Recommendation consumer
    await this.channel.consume(
      this.queues.recommendation,
      (msg) => this._handleRecommendationJob(msg),
      { noAck: false }
    );

    // Batch processing consumer
    await this.channel.consume(
      this.queues.batch,
      (msg) => this._handleBatchJob(msg),
      { noAck: false }
    );

    this.logger.info('AI job consumers started');
  }

  /**
   * Handle sentiment analysis job
   * 
   * @private
   * @param {Object} msg - RabbitMQ message
   */
  async _handleSentimentJob(msg) {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());

    this.logger.info('Processing sentiment job', {
      jobId: job.id
    });

    try {
      const { text, type } = job.data;

      let result;
      if (type === 'news') {
        result = await this.aiNewsService.analyzeSentiment(text);
      } else {
        // Generic sentiment
        result = { sentiment: 'neutral', confidence: 0 };
      }

      // Acknowledge message
      this.channel.ack(msg);

      this.logger.info('Sentiment job complete', {
        jobId: job.id,
        sentiment: result.sentiment
      });

      // Publish result to results queue if needed
      await this._publishResult(job.id, result);
    } catch (error) {
      this.logger.error('Sentiment job failed', {
        jobId: job.id,
        error: error.message
      });

      // Reject and requeue if not too many attempts
      this.channel.nack(msg, false, job.attempts < 3);
    }
  }

  /**
   * Handle market analysis job
   * 
   * @private
   * @param {Object} msg - RabbitMQ message
   */
  async _handleAnalysisJob(msg) {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());

    this.logger.info('Processing analysis job', {
      jobId: job.id,
      symbol: job.data.symbol
    });

    try {
      const { symbol, priceData } = job.data;

      const result = await this.aiMarketService.analyzeAsset(symbol, priceData);

      this.channel.ack(msg);

      this.logger.info('Analysis job complete', {
        jobId: job.id,
        symbol,
        trend: result.trend
      });

      await this._publishResult(job.id, result);
    } catch (error) {
      this.logger.error('Analysis job failed', {
        jobId: job.id,
        error: error.message
      });

      this.channel.nack(msg, false, job.attempts < 3);
    }
  }

  /**
   * Handle recommendation job
   * 
   * @private
   * @param {Object} msg - RabbitMQ message
   */
  async _handleRecommendationJob(msg) {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());

    this.logger.info('Processing recommendation job', {
      jobId: job.id
    });

    try {
      const { userProfile, marketData } = job.data;

      const result = await this.aiMarketService.generateRecommendation(
        userProfile,
        marketData
      );

      this.channel.ack(msg);

      this.logger.info('Recommendation job complete', {
        jobId: job.id,
        recommendationsCount: result.recommendations?.length || 0
      });

      await this._publishResult(job.id, result);
    } catch (error) {
      this.logger.error('Recommendation job failed', {
        jobId: job.id,
        error: error.message
      });

      this.channel.nack(msg, false, job.attempts < 3);
    }
  }

  /**
   * Handle batch processing job
   * 
   * @private
   * @param {Object} msg - RabbitMQ message
   */
  async _handleBatchJob(msg) {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());

    this.logger.info('Processing batch job', {
      jobId: job.id,
      itemsCount: job.data.items?.length || 0
    });

    try {
      const { items, operation } = job.data;
      const results = [];

      for (const item of items) {
        let result;

        switch (operation) {
          case 'sentiment':
            result = await this.aiNewsService.analyzeSentiment(item.text);
            break;
          case 'analysis':
            result = await this.aiMarketService.analyzeAsset(item.symbol, item.priceData);
            break;
          default:
            result = { error: 'Unknown operation' };
        }

        results.push({ item, result });
      }

      this.channel.ack(msg);

      this.logger.info('Batch job complete', {
        jobId: job.id,
        itemsProcessed: results.length
      });

      await this._publishResult(job.id, { results });
    } catch (error) {
      this.logger.error('Batch job failed', {
        jobId: job.id,
        error: error.message
      });

      this.channel.nack(msg, false, job.attempts < 3);
    }
  }

  /**
   * Publish job result
   * 
   * @private
   * @param {string} jobId - Job ID
   * @param {Object} result - Job result
   */
  async _publishResult(jobId, result) {
    const resultsQueue = `${config.rabbitmq.queuePrefix}_ai_results`;

    try {
      await this.channel.assertQueue(resultsQueue, { durable: true });

      const message = {
        jobId,
        result,
        timestamp: Date.now()
      };

      this.channel.sendToQueue(
        resultsQueue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      this.logger.error('Failed to publish result', {
        error: error.message,
        jobId
      });
    }
  }

  /**
   * Generate unique job ID
   * 
   * @private
   * @returns {string} Job ID
   */
  _generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   * 
   * @returns {Promise<Object>} Queue stats
   */
  async getQueueStats() {
    if (!this.isConnected) {
      return null;
    }

    const stats = {};

    for (const [name, queueName] of Object.entries(this.queues)) {
      try {
        const info = await this.channel.checkQueue(queueName);
        stats[name] = {
          messages: info.messageCount,
          consumers: info.consumerCount
        };
      } catch (error) {
        stats[name] = { error: error.message };
      }
    }

    return stats;
  }

  /**
   * Purge queue
   * 
   * @param {string} jobType - Queue type to purge
   * @returns {Promise<number>} Number of messages purged
   */
  async purgeQueue(jobType) {
    if (!this.isConnected) {
      throw new Error('Not connected to RabbitMQ');
    }

    const queueName = this.queues[jobType];
    if (!queueName) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    try {
      const result = await this.channel.purgeQueue(queueName);

      this.logger.info('Queue purged', {
        queue: queueName,
        messagesPurged: result.messageCount
      });

      return result.messageCount;
    } catch (error) {
      this.logger.error('Failed to purge queue', {
        error: error.message,
        queue: queueName
      });
      throw error;
    }
  }

  /**
   * Close connection
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }

      this.isConnected = false;
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', {
        error: error.message
      });
    }
  }
}

export default AIJobQueue;
