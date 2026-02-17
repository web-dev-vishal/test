// Health checks for monitoring tools (Render, K8s, etc.)

import { isDatabaseConnected } from '../config/database.js';
import { isRedisConnected } from '../config/redis.js';
import { getContainer } from '../di/container.js';

export class HealthController {
    // Basic liveness check - just returns 200 if server is running
    async health(req, res) {
        const container = getContainer();
        const aiEnabled = container.isAIEnabled();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
            features: {
                ai: aiEnabled,
            }
        });
    }

    // Detailed readiness check - verifies all dependencies are connected
    async readiness(req, res) {
        const container = getContainer();
        const aiEnabled = container.isAIEnabled();
        const aiStreamHandler = container.getAIStreamHandler();

        const checks = {
            database: isDatabaseConnected(),
            redis: isRedisConnected(),
            ai: {
                enabled: aiEnabled,
                websocket: aiStreamHandler !== null,
                jobQueue: container.get('aiJobQueue') !== null
            }
        };

        // We need at least DB and Redis to be ready
        const isReady = checks.database && checks.redis;
        const statusCode = isReady ? 200 : 503;

        res.status(statusCode).json({
            status: isReady ? 'ready' : 'not_ready',
            checks,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        });
    }
}

export default HealthController;
