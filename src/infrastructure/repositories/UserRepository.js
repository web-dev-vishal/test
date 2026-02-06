/**
 * Global-Fi Ultra - User Repository
 * 
 * Database operations for User model.
 */

import { User } from '../../models/index.js';
import { logger } from '../../config/logger.js';

/**
 * User Repository
 */
export class UserRepository {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async create(userData) {
        try {
            const user = new User(userData);
            await user.save();
            logger.info('User created', { userId: user._id, email: user.email });
            return user;
        } catch (error) {
            logger.error('Error creating user', { error: error.message });
            throw error;
        }
    }

    /**
     * Find user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object|null>} User or null
     */
    async findById(id) {
        try {
            return await User.findById(id);
        } catch (error) {
            logger.error('Error finding user by ID', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User or null
     */
    async findByEmail(email) {
        try {
            return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
            logger.error('Error finding user by email', { email, error: error.message });
            throw error;
        }
    }

    /**
     * Find all users with pagination
     * @param {Object} options - Query options
     * @param {number} options.page - Page number
     * @param {number} options.limit - Items per page
     * @param {Object} options.filter - Filter criteria
     * @param {string} options.sort - Sort criteria
     * @returns {Promise<Object>} Users and pagination info
     */
    async findAll({ page = 1, limit = 20, filter = {}, sort = '-createdAt' } = {}) {
        try {
            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                User.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(filter),
            ]);

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error finding users', { error: error.message });
            throw error;
        }
    }

    /**
     * Update user by ID
     * @param {string} id - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object|null>} Updated user or null
     */
    async update(id, updateData) {
        try {
            const user = await User.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (user) {
                logger.info('User updated', { userId: id });
            }

            return user;
        } catch (error) {
            logger.error('Error updating user', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Delete user by ID (soft delete)
     * @param {string} id - User ID
     * @returns {Promise<Object|null>} Deleted user or null
     */
    async delete(id) {
        try {
            const user = await User.findByIdAndUpdate(
                id,
                { $set: { isActive: false } },
                { new: true }
            );

            if (user) {
                logger.info('User soft deleted', { userId: id });
            }

            return user;
        } catch (error) {
            logger.error('Error deleting user', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Hard delete user by ID
     * @param {string} id - User ID
     * @returns {Promise<boolean>} Success status
     */
    async hardDelete(id) {
        try {
            const result = await User.findByIdAndDelete(id);

            if (result) {
                logger.warn('User hard deleted', { userId: id });
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error hard deleting user', { id, error: error.message });
            throw error;
        }
    }

    /**
     * Check if email exists
     * @param {string} email - Email to check
     * @param {string} excludeId - User ID to exclude from check
     * @returns {Promise<boolean>} True if exists
     */
    async emailExists(email, excludeId = null) {
        try {
            const query = { email: email.toLowerCase() };
            if (excludeId) {
                query._id = { $ne: excludeId };
            }

            const count = await User.countDocuments(query);
            return count > 0;
        } catch (error) {
            logger.error('Error checking email existence', { email, error: error.message });
            throw error;
        }
    }
}

export default UserRepository;
