/**
 * AI Stream Handler for WebSocket
 * 
 * Handles real-time AI response streaming to WebSocket clients.
 * Supports chat-style interactions and live market analysis.
 * 
 * @module infrastructure/websocket/AIStreamHandler
 */

import { logger } from '../../config/logger.js';

/**
 * AI Stream Handler
 * 
 * @class
 * @example
 * const handler = new AIStreamHandler({
 *   io: socketServer,
 *   groqClient,
 *   aiNewsService,
 *   aiMarketService
 * });
 * 
 * handler.initialize();
 */
export class AIStreamHandler {
  /**
   * Initialize handler with dependencies
   * 
   * @param {Object} dependencies
   * @param {Object} dependencies.io - Socket.io server instance
   * @param {GroqClient} dependencies.groqClient - AI client
   * @param {AINewsService} dependencies.aiNewsService - News service
   * @param {AIMarketService} dependencies.aiMarketService - Market service
   */
  constructor({ io, groqClient, aiNewsService, aiMarketService }) {
    if (!io) {
      throw new Error('Socket.io server is required');
    }
    if (!groqClient) {
      throw new Error('GroqClient is required');
    }

    this.io = io;
    this.groqClient = groqClient;
    this.aiNewsService = aiNewsService;
    this.aiMarketService = aiMarketService;
    this.logger = logger;

    // Track active streams
    this.activeStreams = new Map();
  }

  /**
   * Initialize WebSocket event handlers
   */
  initialize() {
    this.io.on('connection', (socket) => {
      this.logger.info('AI client connected', {
        socketId: socket.id,
        clientIp: socket.handshake.address
      });

      // Register event handlers
      socket.on('ai:chat', (data) => this.handleChat(socket, data));
      socket.on('ai:analyze', (data) => this.handleAnalyze(socket, data));
      socket.on('ai:sentiment', (data) => this.handleSentiment(socket, data));
      socket.on('ai:recommend', (data) => this.handleRecommend(socket, data));
      socket.on('ai:stream:stop', () => this.handleStopStream(socket));

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    this.logger.info('AI stream handler initialized');
  }

  /**
   * Handle chat message with streaming response
   * 
   * @param {Object} socket - Socket instance
   * @param {Object} data - Message data
   */
  async handleChat(socket, data) {
    const { message, sessionId } = data;

    if (!message) {
      socket.emit('ai:error', { error: 'Message is required' });
      return;
    }

    this.logger.info('AI chat request', {
      socketId: socket.id,
      sessionId,
      messageLength: message.length
    });

    try {
      // Mark stream as active
      this.activeStreams.set(socket.id, true);

      // Send start event
      socket.emit('ai:stream:start', { sessionId });

      let fullResponse = '';

      // Stream response
      await this.groqClient.streamContent(
        message,
        (chunk) => {
          // Check if stream was stopped
          if (!this.activeStreams.get(socket.id)) {
            throw new Error('Stream stopped by client');
          }

          fullResponse += chunk;
          socket.emit('ai:stream:chunk', {
            sessionId,
            chunk,
            timestamp: Date.now()
          });
        },
        { complex: true }
      );

      // Send completion event
      socket.emit('ai:stream:complete', {
        sessionId,
        fullResponse,
        timestamp: Date.now()
      });

      this.logger.info('AI chat complete', {
        socketId: socket.id,
        sessionId,
        responseLength: fullResponse.length
      });
    } catch (error) {
      this.logger.error('AI chat failed', {
        error: error.message,
        socketId: socket.id,
        sessionId
      });

      socket.emit('ai:error', {
        sessionId,
        error: error.message
      });
    } finally {
      this.activeStreams.delete(socket.id);
    }
  }

  /**
   * Handle asset analysis request
   * 
   * @param {Object} socket - Socket instance
   * @param {Object} data - Analysis data
   */
  async handleAnalyze(socket, data) {
    const { symbol, priceData } = data;

    if (!symbol || !priceData) {
      socket.emit('ai:error', { error: 'Symbol and price data are required' });
      return;
    }

    this.logger.info('AI analysis request', {
      socketId: socket.id,
      symbol
    });

    try {
      socket.emit('ai:analyzing', { symbol });

      const analysis = await this.aiMarketService.analyzeAsset(symbol, priceData);

      socket.emit('ai:analysis:complete', {
        symbol,
        analysis,
        timestamp: Date.now()
      });

      this.logger.info('AI analysis complete', {
        socketId: socket.id,
        symbol,
        trend: analysis.trend
      });
    } catch (error) {
      this.logger.error('AI analysis failed', {
        error: error.message,
        socketId: socket.id,
        symbol
      });

      socket.emit('ai:error', {
        symbol,
        error: error.message
      });
    }
  }

  /**
   * Handle sentiment analysis request
   * 
   * @param {Object} socket - Socket instance
   * @param {Object} data - Sentiment data
   */
  async handleSentiment(socket, data) {
    const { text, type } = data;

    if (!text) {
      socket.emit('ai:error', { error: 'Text is required' });
      return;
    }

    this.logger.info('AI sentiment request', {
      socketId: socket.id,
      type,
      textLength: text.length
    });

    try {
      socket.emit('ai:analyzing', { type: 'sentiment' });

      let result;

      if (type === 'news') {
        result = await this.aiNewsService.analyzeSentiment(text);
      } else {
        // Generic sentiment analysis
        const prompt = `Analyze the sentiment of this text: "${text}"
        
Return JSON: { "sentiment": "positive|negative|neutral", "confidence": 85 }`;

        result = await this.groqClient.generateJSON(
          prompt,
          { sentiment: '', confidence: 0 },
          { complex: false }
        );
      }

      socket.emit('ai:sentiment:complete', {
        result,
        timestamp: Date.now()
      });

      this.logger.info('AI sentiment complete', {
        socketId: socket.id,
        sentiment: result.sentiment
      });
    } catch (error) {
      this.logger.error('AI sentiment failed', {
        error: error.message,
        socketId: socket.id
      });

      socket.emit('ai:error', {
        error: error.message
      });
    }
  }

  /**
   * Handle recommendation request
   * 
   * @param {Object} socket - Socket instance
   * @param {Object} data - Recommendation data
   */
  async handleRecommend(socket, data) {
    const { userProfile, marketData } = data;

    if (!userProfile || !marketData) {
      socket.emit('ai:error', { error: 'User profile and market data are required' });
      return;
    }

    this.logger.info('AI recommendation request', {
      socketId: socket.id,
      riskTolerance: userProfile.riskTolerance
    });

    try {
      socket.emit('ai:analyzing', { type: 'recommendation' });

      const recommendation = await this.aiMarketService.generateRecommendation(
        userProfile,
        marketData
      );

      socket.emit('ai:recommendation:complete', {
        recommendation,
        timestamp: Date.now()
      });

      this.logger.info('AI recommendation complete', {
        socketId: socket.id,
        recommendationsCount: recommendation.recommendations?.length || 0
      });
    } catch (error) {
      this.logger.error('AI recommendation failed', {
        error: error.message,
        socketId: socket.id
      });

      socket.emit('ai:error', {
        error: error.message
      });
    }
  }

  /**
   * Handle stream stop request
   * 
   * @param {Object} socket - Socket instance
   */
  handleStopStream(socket) {
    this.logger.info('AI stream stop requested', {
      socketId: socket.id
    });

    this.activeStreams.set(socket.id, false);
    socket.emit('ai:stream:stopped');
  }

  /**
   * Handle client disconnect
   * 
   * @param {Object} socket - Socket instance
   */
  handleDisconnect(socket) {
    this.logger.info('AI client disconnected', {
      socketId: socket.id
    });

    // Clean up active streams
    this.activeStreams.delete(socket.id);
  }

  /**
   * Broadcast market insight to all connected clients
   * 
   * @param {Object} insight - Market insight data
   */
  broadcastInsight(insight) {
    this.io.emit('ai:insight', {
      insight,
      timestamp: Date.now()
    });

    this.logger.info('Market insight broadcasted', {
      type: insight.type,
      clientsCount: this.io.sockets.sockets.size
    });
  }

  /**
   * Get active connections count
   * 
   * @returns {number} Active connections
   */
  getActiveConnections() {
    return this.io.sockets.sockets.size;
  }

  /**
   * Get active streams count
   * 
   * @returns {number} Active streams
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.values()).filter(Boolean).length;
  }
}

export default AIStreamHandler;
