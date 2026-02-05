/**
 * Global-Fi Ultra - Socket.io Manager
 * 
 * Manages Socket.io connections, rooms, and event broadcasting.
 */

import { logger } from '../../config/logger.js';

/**
 * Socket.io manager for real-time connections
 */
export class SocketManager {
    /**
     * @param {import('socket.io').Server} io - Socket.io server instance
     */
    constructor(io) {
        this.io = io;
        this.LIVE_STREAM_ROOM = 'live-stream';
        this._setupEventHandlers();
    }

    /**
     * Set up Socket.io event handlers
     * @private
     */
    _setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger.info('Socket connected', { socketId: socket.id });

            // Send connection acknowledgment
            socket.emit('connection-acknowledged', {
                socketId: socket.id,
                timestamp: new Date().toISOString(),
            });

            // Handle join live stream
            socket.on('join-live-stream', (payload) => {
                socket.join(this.LIVE_STREAM_ROOM);
                logger.debug('Socket joined live-stream', {
                    socketId: socket.id,
                    userId: payload?.userId,
                });
            });

            // Handle leave live stream
            socket.on('leave-live-stream', (payload) => {
                socket.leave(this.LIVE_STREAM_ROOM);
                logger.debug('Socket left live-stream', {
                    socketId: socket.id,
                    userId: payload?.userId,
                });
            });

            // Handle request current data
            socket.on('request-current-data', () => {
                logger.debug('Current data requested', { socketId: socket.id });
                // This will be handled by the controller
                socket.emit('data-request-acknowledged', {
                    message: 'Request received, fetching data...',
                });
            });

            // Handle disconnect
            socket.on('disconnect', (reason) => {
                logger.info('Socket disconnected', {
                    socketId: socket.id,
                    reason,
                });
            });

            // Handle errors
            socket.on('error', (error) => {
                logger.error('Socket error', {
                    socketId: socket.id,
                    error: error.message,
                });
            });
        });
    }

    /**
     * Broadcast financial data update to live-stream room
     * @param {Object} data - Global-Fi schema data
     */
    broadcastFinancialData(data) {
        this.io.to(this.LIVE_STREAM_ROOM).emit('financial-data-update', data);
        logger.debug('Financial data broadcast', {
            room: this.LIVE_STREAM_ROOM,
            requestId: data.requestId,
        });
    }

    /**
     * Broadcast system warning
     * @param {Object} warning
     * @param {string} warning.service - Service name
     * @param {string} warning.message - Warning message
     * @param {string} [warning.severity='warning'] - Severity level
     */
    broadcastSystemWarning(warning) {
        const payload = {
            service: warning.service,
            message: warning.message,
            severity: warning.severity || 'warning',
            timestamp: new Date().toISOString(),
        };
        this.io.to(this.LIVE_STREAM_ROOM).emit('system-warning', payload);
        logger.warn('System warning broadcast', payload);
    }

    /**
     * Broadcast circuit breaker state change
     * @param {Object} stateChange
     * @param {string} stateChange.service - Service name
     * @param {string} stateChange.newState - New state
     */
    broadcastCircuitBreakerStateChange(stateChange) {
        const payload = {
            service: stateChange.service,
            state: stateChange.newState,
            timestamp: new Date().toISOString(),
        };
        this.io.to(this.LIVE_STREAM_ROOM).emit('circuit-breaker-state-change', payload);
        logger.info('Circuit breaker state change broadcast', payload);
    }

    /**
     * Send error to specific socket
     * @param {string} socketId - Socket ID
     * @param {string} code - Error code
     * @param {string} message - Error message
     */
    sendError(socketId, code, message) {
        this.io.to(socketId).emit('error', { code, message });
    }

    /**
     * Get count of clients in live-stream room
     * @returns {Promise<number>}
     */
    async getLiveStreamClientCount() {
        const sockets = await this.io.in(this.LIVE_STREAM_ROOM).fetchSockets();
        return sockets.length;
    }

    /**
     * Close all connections gracefully
     * @returns {Promise<void>}
     */
    async close() {
        return new Promise((resolve) => {
            this.io.close(() => {
                logger.info('Socket.io server closed');
                resolve();
            });
        });
    }
}

export default SocketManager;
