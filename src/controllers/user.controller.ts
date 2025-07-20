import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../types/error.types';
import {
  UserResponse,
  UserUpdateInput,
  ApiResponse,
  PaginationParams,
} from '../types';
import { asyncHandler, AuthenticatedRequest } from '../middleware';
import { createError, ErrorFactory } from '../utils/error.utils';
import { sendSuccess } from '../utils/response.utils';

/**
 * Controller for user management operations
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get user by ID
   * GET /users/:id
   * Accessible by: Admin (any user), User (own profile only)
   */
  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      throw createError.authentication();
    }

    if (!id) {
      throw ErrorFactory.badRequest('User ID is required');
    }

    // Check if user is trying to access their own profile or is admin
    if (currentUser.role !== 'ADMIN' && currentUser.userId !== id) {
      throw createError.insufficientPermissions('view user profile');
    }

    const user = await this.userService.findById(id);
    if (!user) {
      throw createError.userNotFound(id);
    }

    sendSuccess(res, user, 'User retrieved successfully');
  });

  /**
   * Get all users with pagination
   * GET /users
   * Accessible by: Admin only
   */
  getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentication required', 401);
    }

    // Only admins can view all users
    if (currentUser.role !== 'ADMIN') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    try {
      const paginationParams: PaginationParams = {
        page: req.query['page'] ? parseInt(req.query['page'] as string, 10) : 1,
        limit: req.query['limit']
          ? parseInt(req.query['limit'] as string, 10)
          : 10,
      };

      const result = await this.userService.findAll(paginationParams);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve users', 500);
    }
  });

  /**
   * Update user
   * PATCH /users/:id
   * Accessible by: Admin (any user), User (own profile only, limited fields)
   */
  updateUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const updateData: UserUpdateInput = req.body;
      const currentUser = req.user;

      if (!currentUser) {
        throw new AppError('Authentication required', 401);
      }

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      try {
        // Check if user is trying to update their own profile or is admin
        if (currentUser.role !== 'ADMIN' && currentUser.userId !== id) {
          throw new AppError(
            'Access denied. You can only update your own profile.',
            403
          );
        }

        // If user is not admin, restrict what they can update
        if (currentUser.role !== 'ADMIN') {
          // Regular users can only update their own fullName, birthDate, and email
          const allowedFields = ['fullName', 'birthDate', 'email'];
          const updateFields = Object.keys(updateData);
          const restrictedFields = updateFields.filter(
            field => !allowedFields.includes(field)
          );

          if (restrictedFields.length > 0) {
            throw new AppError(
              `Access denied. You cannot update the following fields: ${restrictedFields.join(', ')}`,
              403
            );
          }
        }

        const updatedUser = await this.userService.updateUser(id, updateData);

        const response: ApiResponse<UserResponse> = {
          success: true,
          message: 'User updated successfully',
          data: updatedUser,
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to update user', 500);
      }
    }
  );

  /**
   * Block user
   * PATCH /users/:id/block
   * Accessible by: Admin only
   */
  blockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      throw new AppError('Authentication required', 401);
    }

    // Only admins can block users
    if (currentUser.role !== 'ADMIN') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    if (!id) {
      throw new AppError('User ID is required', 400);
    }

    try {
      // Prevent admin from blocking themselves
      if (currentUser.userId === id) {
        throw new AppError('You cannot block yourself', 400);
      }

      const blockedUser = await this.userService.blockUser(id);

      const response: ApiResponse<UserResponse> = {
        success: true,
        message: 'User blocked successfully',
        data: blockedUser,
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to block user', 500);
    }
  });

  /**
   * Unblock user
   * PATCH /users/:id/unblock
   * Accessible by: Admin only
   */
  unblockUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const currentUser = req.user;

      if (!currentUser) {
        throw new AppError('Authentication required', 401);
      }

      // Only admins can unblock users
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Access denied. Admin privileges required.', 403);
      }

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      try {
        const unblockedUser = await this.userService.unblockUser(id);

        const response: ApiResponse<UserResponse> = {
          success: true,
          message: 'User unblocked successfully',
          data: unblockedUser,
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to unblock user', 500);
      }
    }
  );

  /**
   * Search users
   * GET /users/search
   * Accessible by: Admin only
   */
  searchUsers = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const currentUser = req.user;
      const query = req.query['q'] as string;

      if (!currentUser) {
        throw new AppError('Authentication required', 401);
      }

      // Only admins can search users
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Access denied. Admin privileges required.', 403);
      }

      if (!query || query.trim().length === 0) {
        throw new AppError('Search query is required', 400);
      }

      try {
        const paginationParams: PaginationParams = {
          page: req.query['page']
            ? parseInt(req.query['page'] as string, 10)
            : 1,
          limit: req.query['limit']
            ? parseInt(req.query['limit'] as string, 10)
            : 10,
        };

        const result = await this.userService.searchUsers(
          query.trim(),
          paginationParams
        );

        res.status(200).json(result);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to search users', 500);
      }
    }
  );

  /**
   * Delete user (soft delete)
   * DELETE /users/:id
   * Accessible by: Admin only
   */
  deleteUser = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const currentUser = req.user;

      if (!currentUser) {
        throw new AppError('Authentication required', 401);
      }

      // Only admins can delete users
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Access denied. Admin privileges required.', 403);
      }

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      try {
        // Prevent admin from deleting themselves
        if (currentUser.userId === id) {
          throw new AppError('You cannot delete yourself', 400);
        }

        await this.userService.deleteUser(id);

        const response: ApiResponse<null> = {
          success: true,
          message: 'User deleted successfully',
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to delete user', 500);
      }
    }
  );

  /**
   * Get user statistics
   * GET /users/stats
   * Accessible by: Admin only
   */
  getUserStats = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const currentUser = req.user;

      if (!currentUser) {
        throw new AppError('Authentication required', 401);
      }

      // Only admins can view user statistics
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Access denied. Admin privileges required.', 403);
      }

      try {
        const stats = await this.userService.getUserStats();

        const response: ApiResponse<typeof stats> = {
          success: true,
          message: 'User statistics retrieved successfully',
          data: stats,
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to retrieve user statistics', 500);
      }
    }
  );
}

// Export singleton instance
export default new UserController();
