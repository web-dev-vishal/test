/**
 * AI Routes
 * 
 * HTTP routes for AI-powered features
 * 
 * @module presentation/routes/aiRoutes
 */

import { Router } from 'express';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  validateRequest,
  sentimentSchema,
  analyzeSchema,
  compareSchema,
  recommendSchema,
  portfolioSchema,
  predictSchema,
  explainSchema,
  newsImpactSchema,
  newsSummarySchema,
  jobSchema,
} from '../../application/dto/aiSchemas.js';

/**
 * Create AI routes
 * 
 * @param {AIController} aiController - AI controller instance
 * @returns {Router} Express router
 */
export const createAIRoutes = (aiController) => {
  const router = Router();

  // Apply AI-specific rate limiter to all AI routes
  router.use(aiRateLimiter);

  // Sentiment analysis
  router.post('/sentiment', validateRequest(sentimentSchema), aiController.analyzeSentiment);

  // Asset analysis
  router.post('/analyze', validateRequest(analyzeSchema), aiController.analyzeAsset);
  router.post('/compare', validateRequest(compareSchema), aiController.compareAssets);

  // Recommendations
  router.post('/recommend', validateRequest(recommendSchema), aiController.generateRecommendation);
  router.post('/portfolio', validateRequest(portfolioSchema), aiController.analyzePortfolio);

  // Predictions
  router.post('/predict', validateRequest(predictSchema), aiController.predictPrice);
  router.post('/explain', validateRequest(explainSchema), aiController.explainMovement);

  // News analysis
  router.post('/news/impact', validateRequest(newsImpactSchema), aiController.analyzeNewsImpact);
  router.post('/news/summary', validateRequest(newsSummarySchema), aiController.generateNewsSummary);

  // Job queue (if available)
  router.post('/jobs', validateRequest(jobSchema), aiController.submitJob);
  router.get('/jobs/stats', aiController.getQueueStats);

  return router;
};

export default createAIRoutes;

