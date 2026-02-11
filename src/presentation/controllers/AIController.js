/**
 * AI Controller
 * 
 * HTTP endpoints for AI-powered features including sentiment analysis,
 * market insights, and investment recommendations.
 * 
 * @module presentation/controllers/AIController
 */

import { logger } from '../../config/logger.js';
import { sanitizeAIInput } from '../../utils/sanitizer.js';

/**
 * AI Controller
 * 
 * @class
 */
export class AIController {
  /**
   * Initialize controller with dependencies
   * 
   * @param {Object} dependencies
   * @param {AINewsService} dependencies.aiNewsService - News service
   * @param {AIMarketService} dependencies.aiMarketService - Market service
   * @param {AIJobQueue} dependencies.aiJobQueue - Job queue (optional)
   */
  constructor({ aiNewsService, aiMarketService, aiJobQueue }) {
    if (!aiNewsService || !aiMarketService) {
      throw new Error('AI services are required');
    }

    this.aiNewsService = aiNewsService;
    this.aiMarketService = aiMarketService;
    this.aiJobQueue = aiJobQueue;
    this.logger = logger;
  }

  /**
   * Analyze sentiment of text
   * 
   * POST /api/v1/ai/sentiment
   * Body: { text: string, type?: 'news' | 'general' }
   */
  analyzeSentiment = async (req, res) => {
    try {
      const { text, type = 'general' } = req.body;

      // Sanitize user input before passing to AI
      const sanitizedText = sanitizeAIInput(text);

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }

      this.logger.info('Sentiment analysis request', {
        requestId: req.id,
        type,
        textLength: text.length
      });

      const result = await this.aiNewsService.analyzeSentiment(sanitizedText);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('Sentiment analysis failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Sentiment analysis failed'
      });
    }
  };

  /**
   * Analyze asset with AI
   * 
   * POST /api/v1/ai/analyze
   * Body: { symbol: string, priceData: object }
   */
  analyzeAsset = async (req, res) => {
    try {
      const { symbol, priceData } = req.body;

      if (!symbol || !priceData) {
        return res.status(400).json({
          success: false,
          error: 'Symbol and price data are required'
        });
      }

      this.logger.info('Asset analysis request', {
        requestId: req.id,
        symbol
      });

      const result = await this.aiMarketService.analyzeAsset(symbol, priceData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('Asset analysis failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Asset analysis failed'
      });
    }
  };

  /**
   * Compare multiple assets
   * 
   * POST /api/v1/ai/compare
   * Body: { assets: array }
   */
  compareAssets = async (req, res) => {
    try {
      const { assets } = req.body;

      if (!assets || !Array.isArray(assets) || assets.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 assets are required'
        });
      }

      this.logger.info('Asset comparison request', {
        requestId: req.id,
        assetsCount: assets.length
      });

      const result = await this.aiMarketService.compareAssets(assets);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('Asset comparison failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Asset comparison failed'
      });
    }
  };

  /**
   * Generate investment recommendation
   * 
   * POST /api/v1/ai/recommend
   * Body: { userProfile: object, marketData: array }
   */
  generateRecommendation = async (req, res) => {
    try {
      const { userProfile, marketData } = req.body;

      if (!userProfile || !marketData) {
        return res.status(400).json({
          success: false,
          error: 'User profile and market data are required'
        });
      }

      this.logger.info('Recommendation request', {
        requestId: req.id,
        riskTolerance: userProfile.riskTolerance
      });

      const result = await this.aiMarketService.generateRecommendation(
        userProfile,
        marketData
      );

      res.json({
        success: true,
        data: result,
        disclaimer: 'This is not financial advice. Always do your own research.'
      });
    } catch (error) {
      this.logger.error('Recommendation generation failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Recommendation generation failed'
      });
    }
  };

  /**
   * Analyze portfolio
   * 
   * POST /api/v1/ai/portfolio
   * Body: { holdings: array, marketConditions: object }
   */
  analyzePortfolio = async (req, res) => {
    try {
      const { holdings, marketConditions } = req.body;

      if (!holdings || !Array.isArray(holdings)) {
        return res.status(400).json({
          success: false,
          error: 'Holdings array is required'
        });
      }

      this.logger.info('Portfolio analysis request', {
        requestId: req.id,
        holdingsCount: holdings.length
      });

      const result = await this.aiMarketService.analyzePortfolio(
        holdings,
        marketConditions || {}
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('Portfolio analysis failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Portfolio analysis failed'
      });
    }
  };

  /**
   * Predict price movement
   * 
   * POST /api/v1/ai/predict
   * Body: { symbol: string, historicalData: array, daysAhead?: number }
   */
  predictPrice = async (req, res) => {
    try {
      const { symbol, historicalData, daysAhead = 7 } = req.body;

      if (!symbol || !historicalData) {
        return res.status(400).json({
          success: false,
          error: 'Symbol and historical data are required'
        });
      }

      this.logger.info('Price prediction request', {
        requestId: req.id,
        symbol,
        daysAhead
      });

      const result = await this.aiMarketService.predictPrice(
        symbol,
        historicalData,
        daysAhead
      );

      res.json({
        success: true,
        data: result,
        disclaimer: 'Predictions are for educational purposes only. Not financial advice.'
      });
    } catch (error) {
      this.logger.error('Price prediction failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Price prediction failed'
      });
    }
  };

  /**
   * Explain market movement
   * 
   * POST /api/v1/ai/explain
   * Body: { symbol: string, changePercent: number, recentNews?: array }
   */
  explainMovement = async (req, res) => {
    try {
      const { symbol, changePercent, recentNews = [] } = req.body;

      if (!symbol || changePercent === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Symbol and change percent are required'
        });
      }

      this.logger.info('Movement explanation request', {
        requestId: req.id,
        symbol,
        changePercent
      });

      const explanation = await this.aiMarketService.explainMovement(
        symbol,
        changePercent,
        recentNews
      );

      res.json({
        success: true,
        data: { explanation }
      });
    } catch (error) {
      this.logger.error('Movement explanation failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Movement explanation failed'
      });
    }
  };

  /**
   * Analyze market impact of news
   * 
   * POST /api/v1/ai/news/impact
   * Body: { newsArticles: array }
   */
  analyzeNewsImpact = async (req, res) => {
    try {
      const { newsArticles } = req.body;

      if (!newsArticles || !Array.isArray(newsArticles)) {
        return res.status(400).json({
          success: false,
          error: 'News articles array is required'
        });
      }

      this.logger.info('News impact analysis request', {
        requestId: req.id,
        articlesCount: newsArticles.length
      });

      const result = await this.aiNewsService.analyzeMarketImpact(newsArticles);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('News impact analysis failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'News impact analysis failed'
      });
    }
  };

  /**
   * Generate news summary
   * 
   * POST /api/v1/ai/news/summary
   * Body: { newsArticles: array, maxLength?: number }
   */
  generateNewsSummary = async (req, res) => {
    try {
      const { newsArticles, maxLength = 100 } = req.body;

      if (!newsArticles || !Array.isArray(newsArticles)) {
        return res.status(400).json({
          success: false,
          error: 'News articles array is required'
        });
      }

      this.logger.info('News summary request', {
        requestId: req.id,
        articlesCount: newsArticles.length
      });

      const summary = await this.aiNewsService.generateSummary(
        newsArticles,
        maxLength
      );

      res.json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      this.logger.error('News summary generation failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'News summary generation failed'
      });
    }
  };

  /**
   * Submit async job to queue
   * 
   * POST /api/v1/ai/jobs
   * Body: { jobType: string, data: object, priority?: number }
   */
  submitJob = async (req, res) => {
    try {
      if (!this.aiJobQueue) {
        return res.status(503).json({
          success: false,
          error: 'Job queue not available'
        });
      }

      const { jobType, data, priority = 0 } = req.body;

      if (!jobType || !data) {
        return res.status(400).json({
          success: false,
          error: 'Job type and data are required'
        });
      }

      this.logger.info('Job submission request', {
        requestId: req.id,
        jobType
      });

      const success = await this.aiJobQueue.publishJob(jobType, data, { priority });

      if (success) {
        res.json({
          success: true,
          message: 'Job submitted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to submit job'
        });
      }
    } catch (error) {
      this.logger.error('Job submission failed', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get queue statistics
   * 
   * GET /api/v1/ai/jobs/stats
   */
  getQueueStats = async (req, res) => {
    try {
      if (!this.aiJobQueue) {
        return res.status(503).json({
          success: false,
          error: 'Job queue not available'
        });
      }

      const stats = await this.aiJobQueue.getQueueStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.logger.error('Failed to get queue stats', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get queue stats'
      });
    }
  };
}

export default AIController;
