import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { generateToken, createTokenPayload } from '../utils/jwt.utils';
import { AppError } from '../types/error.types';
import {
  LoginInput,
  RegisterInput,
  AuthResponse,
  ApiResponse,
  UserResponse,
} from '../types';
import { asyncHandler } from '../middleware';

/**
 * Controller for authentication operations
 */
export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register a new user
   * POST /auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const registerData: RegisterInput = req.body;

    try {
      // Create user through UserService
      const user: UserResponse =
        await this.userService.createUser(registerData);

      // Generate JWT token
      const tokenPayload = createTokenPayload({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      const token = generateToken(tokenPayload);

      // Prepare response
      const authResponse: AuthResponse = {
        user,
        token,
      };

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'User registered successfully',
        data: authResponse,
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Registration failed', 500);
    }
  });

  /**
   * Login user
   * POST /auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginInput = req.body;

    try {
      // Find user by email
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new AppError('Account is inactive. Please contact support.', 403);
      }

      // Verify password
      const isPasswordValid = await this.userService.verifyPassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Remove password from user object for response
      const { password: _, ...userWithoutPassword } = user;

      // Generate JWT token
      const tokenPayload = createTokenPayload({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      const token = generateToken(tokenPayload);

      // Prepare response
      const authResponse: AuthResponse = {
        user: userWithoutPassword as UserResponse,
        token,
      };

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Login successful',
        data: authResponse,
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500);
    }
  });

  /**
   * Logout user (client-side token removal)
   * POST /auth/logout
   */
  logout = asyncHandler(async (_req: Request, res: Response) => {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // by removing the token from storage. This endpoint is for consistency
    // and can be extended for token blacklisting if needed.

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  });

  /**
   * Get current user profile
   * GET /auth/me
   */
  me = asyncHandler(async (req: Request, res: Response) => {
    // User is attached to request by auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse<UserResponse> = {
        success: true,
        message: 'User profile retrieved successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve user profile', 500);
    }
  });
}

// Export singleton instance
export default new AuthController();
