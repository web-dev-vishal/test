/**
 * Global-Fi Ultra - User Controller
 * 
 * HTTP request handlers for user management endpoints.
 */

import { logger } from '../../config/logger.js';

/**
 * User Controller
 */
export class UserController {
    /**
     * @param {Object} dependencies
     * @param {import('../../application/use-cases/ManageUser.js').ManageUser} dependencies.manageUser
     */
    constructor({ manageUser }) {
        this.manageUser = manageUser;
    }

    /**
     * GET /users - List all users
     */
    async listUsers(req, res, next) {
        try {
            const { page, limit, isActive, sort } = req.query;

            const filter = {};
            if (isActive !== undefined) {
                filter.isActive = isActive;
            }

            const result = await this.manageUser.listUsers({
                page: page || 1,
                limit: limit || 20,
                filter,
                sort: sort || '-createdAt',
            });

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /users/:id - Get user by ID
     */
    async getUser(req, res, next) {
        try {
            const user = await this.manageUser.getUser(req.params.id);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                user,
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    error: {
                        code: 'E2001',
                        message: 'User not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * POST /users - Create new user
     */
    async createUser(req, res, next) {
        try {
            const user = await this.manageUser.createUser(req.body);

            res.status(201).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'User created successfully',
                user,
            });
        } catch (error) {
            if (error.message === 'Email already in use') {
                return res.status(409).json({
                    error: {
                        code: 'E2002',
                        message: 'Email already in use',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * PUT /users/:id - Update user (full update)
     */
    async updateUser(req, res, next) {
        try {
            const user = await this.manageUser.updateUser(req.params.id, req.body);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'User updated successfully',
                user,
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    error: {
                        code: 'E2001',
                        message: 'User not found',
                    },
                    requestId: req.requestId,
                });
            }
            if (error.message === 'Email already in use') {
                return res.status(409).json({
                    error: {
                        code: 'E2002',
                        message: 'Email already in use',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }

    /**
     * PATCH /users/:id - Partial update user
     */
    async patchUser(req, res, next) {
        // Reuse updateUser logic for PATCH
        return this.updateUser(req, res, next);
    }

    /**
     * DELETE /users/:id - Delete user (soft delete)
     */
    async deleteUser(req, res, next) {
        try {
            await this.manageUser.deleteUser(req.params.id);

            res.status(200).json({
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                message: 'User deleted successfully',
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    error: {
                        code: 'E2001',
                        message: 'User not found',
                    },
                    requestId: req.requestId,
                });
            }
            next(error);
        }
    }
}

export default UserController;
