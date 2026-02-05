/**
 * Global-Fi Ultra - Request ID Middleware
 * 
 * Injects unique request ID into all requests for tracing.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Add request ID to all requests
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requestIdMiddleware = (req, res, next) => {
    // Use existing request ID from header or generate new one
    const requestId = req.headers['x-request-id'] || uuidv4();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
};

export default requestIdMiddleware;
