import bcrypt from 'bcryptjs';
import { PrismaClient, User, Role, Status } from '@prisma/client';
import { prisma } from '../models';
import { config } from '../config/config';
import { AppError } from '../types/error.types';
import {
  UserCreateInput,
  UserUpdateInput,
  UserResponse,
  PaginationParams,
} from '../types';
import { PaginatedResponse } from '../utils/response.utils';

/**
 * Service for user-related operations
 */
export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new user
   */
  async createUser(userData: UserCreateInput): Promise<UserResponse> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          fullName: userData.fullName,
          birthDate: userData.birthDate,
          email: userData.email,
          password: hashedPassword,
          role: userData.role || Role.USER,
          status: Status.ACTIVE,
        },
      });

      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create user', 500);
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      throw new AppError('Failed to find user', 500);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw new AppError('Failed to find user by email', 500);
    }
  }

  /**
   * Get all users with pagination
   */
  async findAll(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<UserResponse>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count(),
      ]);

      const sanitizedUsers = users.map(user => this.sanitizeUser(user));
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: sanitizedUsers,
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new AppError('Failed to retrieve users', 500);
    }
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    updateData: UserUpdateInput
  ): Promise<UserResponse> {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // If email is being updated, check for uniqueness
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailExists) {
          throw new AppError('Email already exists', 409);
        }
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user', 500);
    }
  }

  /**
   * Update user status (block/unblock)
   */
  async updateUserStatus(id: string, status: Status): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { status },
      });

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user status', 500);
    }
  }

  /**
   * Block user
   */
  async blockUser(id: string): Promise<UserResponse> {
    return this.updateUserStatus(id, Status.INACTIVE);
  }

  /**
   * Unblock user
   */
  async unblockUser(id: string): Promise<UserResponse> {
    return this.updateUserStatus(id, Status.ACTIVE);
  }

  /**
   * Delete user (soft delete by setting status to INACTIVE)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Soft delete by setting status to INACTIVE
      await this.prisma.user.update({
        where: { id },
        data: { status: Status.INACTIVE },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete user', 500);
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new AppError('Failed to verify password', 500);
    }
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, config.bcryptRounds);
    } catch (error) {
      throw new AppError('Failed to hash password', 500);
    }
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): UserResponse {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
  }> {
    try {
      const [total, active, inactive, admins, users] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: Status.ACTIVE } }),
        this.prisma.user.count({ where: { status: Status.INACTIVE } }),
        this.prisma.user.count({ where: { role: Role.ADMIN } }),
        this.prisma.user.count({ where: { role: Role.USER } }),
      ]);

      return {
        total,
        active,
        inactive,
        admins,
        users,
      };
    } catch (error) {
      throw new AppError('Failed to get user statistics', 500);
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(
    query: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<UserResponse>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;

      const searchCondition = {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      };

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: searchCondition,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where: searchCondition }),
      ]);

      const sanitizedUsers = users.map(user => this.sanitizeUser(user));
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Users found successfully',
        data: sanitizedUsers,
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new AppError('Failed to search users', 500);
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
