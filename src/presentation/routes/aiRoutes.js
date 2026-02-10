/**
 * AI Routes
 * 
 * HTTP routes for AI-powered features
 * 
 * @module presentation/routes/aiRoutes
 */

import { Router } from 'express';

/**
 * Create AI routes
 * 
 * @param {AIController} aiController - AI controller instance
 * @returns {Router} Express router
 */
export const createAIRoutes = (aiController) => {
  const router = Router();

  // Sentiment analysis
  router.post('/sentiment', aiController.analyzeSentiment);

  // Asset analysis
  router.post('/analyze', aiController.analyzeAsset);
  router.post('/compare', aiController.compareAssets);

  // Recommendations
  router.post('/recommend', aiController.generateRecommendation);
  router.post('/portfolio', aiController.analyzePortfolio);

  // Predictions
  router.post('/predict', aiController.predictPrice);
  router.post('/explain', aiController.explainMovement);

  // News analysis
  router.post('/news/impact', aiController.analyzeNewsImpact);
  router.post('/news/summary', aiController.generateNewsSummary);

  // Job queue (if available)
  router.post('/jobs', aiController.submitJob);
  router.get('/jobs/stats', aiController.getQueueStats);

  return router;
};

export default createAIRoutes;
