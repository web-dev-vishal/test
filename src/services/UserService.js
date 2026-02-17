// User management - CRUD with email uniqueness enforcement

import { logger } from '../config/logger.js';

export class UserService {
    constructor({ userRepository }) {
        this.userRepository = userRepository;
    }

    // Create new user - enforces email uniqueness
    async createUser(userData) {
        try {
            // Check email uniqueness
            const exists = await this.userRepository.emailExists(userData.email);
            if (exists) {
                throw new Error('Email already in use');
            }

            const user = await this.userRepository.create(userData);
            logger.info('User created successfully', { userId: user._id });

            return user;
        } catch (error) {
            logger.error('Error in createUser', { error: error.message });
            throw error;
        }
    }

    // Get user by ID
    async getUser(userId) {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error('Error in getUser', { userId, error: error.message });
            throw error;
        }
    }

    // List users with pagination
    async listUsers(options = {}) {
        try {
            return await this.userRepository.findAll(options);
        } catch (error) {
            logger.error('Error in listUsers', { error: error.message });
            throw error;
        }
    }

    // Update user - checks email uniqueness if email is being changed
    async updateUser(userId, updateData) {
        try {
            // Check email uniqueness if changing email
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
            logger.error('Error in updateUser', { userId, error: error.message });
            throw error;
        }
    }

    // Soft delete - sets isActive = false
    async deleteUser(userId) {
        try {
            const user = await this.userRepository.delete(userId);

            if (!user) {
                throw new Error('User not found');
            }

            logger.info('User deleted successfully', { userId });
            return user;
        } catch (error) {
            logger.error('Error in deleteUser', { userId, error: error.message });
            throw error;
        }
    }

    // Hard delete - permanently removes user (admin only, GDPR compliance)
    async hardDeleteUser(userId) {
        try {
            const success = await this.userRepository.hardDelete(userId);

            if (!success) {
                throw new Error('User not found');
            }

            logger.warn('User hard deleted', { userId });
            return success;
        } catch (error) {
            logger.error('Error in hardDeleteUser', { userId, error: error.message });
            throw error;
        }
    }

    // Login user - validates credentials and returns user data
    async loginUser(email, password) {
        try {
            // Find user by email with password field included
            const user = await this.userRepository.findByEmailWithPassword(email);

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is inactive');
            }

            // Compare password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            logger.info('User logged in successfully', { userId: user._id, email });

            // Remove password hash from response
            const userObj = user.toObject();
            delete userObj.passwordHash;

            return userObj;
        } catch (error) {
            logger.error('Error in loginUser', { email, error: error.message });
            throw error;
        }
    }
}

export default UserService;
