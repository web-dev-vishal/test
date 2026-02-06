/**
 * Global-Fi Ultra - Manage User Use Case
 * 
 * Business logic for user management operations.
 */

import { logger } from '../../config/logger.js';

/**
 * Manage User Use Case
 */
export class ManageUser {
    /**
     * @param {Object} dependencies
     * @param {import('../../infrastructure/repositories/UserRepository.js').UserRepository} dependencies.userRepository
     */
    constructor({ userRepository }) {
        this.userRepository = userRepository;
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            // Check if email already exists
            const exists = await this.userRepository.emailExists(userData.email);
            if (exists) {
                throw new Error('Email already in use');
            }

            const user = await this.userRepository.create(userData);
            logger.info('User created successfully', { userId: user._id });

            return user;
        } catch (error) {
            logger.error('Error in createUser use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User
     */
    async getUser(userId) {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error('Error in getUser use case', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * List users with pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Users and pagination info
     */
    async listUsers(options = {}) {
        try {
            return await this.userRepository.findAll(options);
        } catch (error) {
            logger.error('Error in listUsers use case', { error: error.message });
            throw error;
        }
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, updateData) {
        try {
            // If email is being updated, check if it's already in use
            if (updateData.email) {
                const exists = await this.userRepository.emailExists(updateData.email, userId);
                if (exists) {
                    throw new Error('Email already in use');
                }
            }

            const user = await this.userRepository.update(userId, updateData);

            if (!user) {
                throw new Error('User not found');
            }

            logger.info('User updated successfully', { userId });
            return user;
        } catch (error) {
            logger.error('Error in updateUser use case', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Delete user (soft delete)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deleted user
     */
    async deleteUser(userId) {
        try {
            const user = await this.userRepository.delete(userId);

            if (!user) {
                throw new Error('User not found');
            }

            logger.info('User deleted successfully', { userId });
            return user;
        } catch (error) {
            logger.error('Error in deleteUser use case', { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Hard delete user (admin only)
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async hardDeleteUser(userId) {
        try {
            const success = await this.userRepository.hardDelete(userId);

            if (!success) {
                throw new Error('User not found');
            }

            logger.warn('User hard deleted', { userId });
            return success;
        } catch (error) {
            logger.error('Error in hardDeleteUser use case', { userId, error: error.message });
            throw error;
        }
    }
}

export default ManageUser;
