import { AuthController } from '../../controllers/auth.controller';
import { UserService } from '../../services/user.service';
import { generateToken, createTokenPayload } from '../../utils/jwt.utils';
import { AppError } from '../../types/error.types';

// Mock dependencies
jest.mock('../../services/user.service');
jest.mock('../../utils/jwt.utils');
jest.mock('../../middleware', () => ({
  asyncHandler: (fn: any) => fn, // Simplified mock for testing
}));

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;
const mockedGenerateToken = generateToken as jest.MockedFunction<
  typeof generateToken
>;
const mockedCreateTokenPayload = createTokenPayload as jest.MockedFunction<
  typeof createTokenPayload
>;

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserService: jest.Mocked<UserService>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = new AuthController();
    mockUserService = new MockedUserService() as jest.Mocked<UserService>;
    (authController as any).userService = mockUserService;
    mockNext = jest.fn();
  });

  describe('register', () => {
    const mockRegisterData = {
      fullName: 'John Doe',
      birthDate: new Date('1990-01-01'),
      email: 'john@example.com',
      password: 'Password123!',
      role: 'USER' as const,
    };

    const mockUser = {
      id: 'user-id-123',
      fullName: 'John Doe',
      birthDate: new Date('1990-01-01'),
      email: 'john@example.com',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user successfully', async () => {
      // Arrange
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockedCreateTokenPayload.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      mockedGenerateToken.mockReturnValue('mock-jwt-token');

      const mockReq = {
        body: mockRegisterData,
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act
      await authController.register(mockReq, mockRes, mockNext);

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(mockRegisterData);
      expect(mockedCreateTokenPayload).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(mockedGenerateToken).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
        },
      });
    });

    it('should handle registration errors', async () => {
      // Arrange
      const error = new AppError('User with this email already exists', 409);
      mockUserService.createUser.mockRejectedValue(error);

      const mockReq = {
        body: mockRegisterData,
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act & Assert
      await expect(
        authController.register(mockReq, mockRes, mockNext)
      ).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    const mockUserWithPassword = {
      id: 'user-id-123',
      fullName: 'John Doe',
      birthDate: new Date('1990-01-01'),
      email: 'john@example.com',
      password: 'hashed-password',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login user successfully', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUserWithPassword);
      mockUserService.verifyPassword.mockResolvedValue(true);
      mockedCreateTokenPayload.mockReturnValue({
        userId: mockUserWithPassword.id,
        email: mockUserWithPassword.email,
        role: mockUserWithPassword.role,
      });
      mockedGenerateToken.mockReturnValue('mock-jwt-token');

      const mockReq = {
        body: mockLoginData,
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act
      await authController.login(mockReq, mockRes, mockNext);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        mockLoginData.email
      );
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith(
        mockLoginData.password,
        mockUserWithPassword.password
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: expect.not.objectContaining({ password: expect.anything() }),
          token: 'mock-jwt-token',
        },
      });
    });

    it('should reject login with invalid email', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(null);

      const mockReq = {
        body: mockLoginData,
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act & Assert
      await expect(
        authController.login(mockReq, mockRes, mockNext)
      ).rejects.toThrow(new AppError('Invalid email or password', 401));
    });

    it('should reject login with invalid password', async () => {
      // Arrange
      mockUserService.findByEmail.mockResolvedValue(mockUserWithPassword);
      mockUserService.verifyPassword.mockResolvedValue(false);

      const mockReq = {
        body: mockLoginData,
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act & Assert
      await expect(
        authController.login(mockReq, mockRes, mockNext)
      ).rejects.toThrow(new AppError('Invalid email or password', 401));
    });

    it('should reject login for inactive user', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUserWithPassword,
        status: 'INACTIVE' as const,
      };
      mockUserService.findByEmail.mockResolvedValue(inactiveUser);

      const mockReq = {
        body: mockLoginData,
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act & Assert
      await expect(
        authController.login(mockReq, mockRes, mockNext)
      ).rejects.toThrow(
        new AppError('Account is inactive. Please contact support.', 403)
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act
      await authController.logout(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('me', () => {
    const mockUser = {
      id: 'user-id-123',
      fullName: 'John Doe',
      birthDate: new Date('1990-01-01'),
      email: 'john@example.com',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should get current user profile successfully', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(mockUser);

      const mockReq = {
        user: { userId: 'user-id-123' },
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act
      await authController.me(mockReq, mockRes, mockNext);

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith('user-id-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User profile retrieved successfully',
        data: mockUser,
      });
    });

    it('should reject request without authentication', async () => {
      // Arrange
      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act & Assert
      await expect(
        authController.me(mockReq, mockRes, mockNext)
      ).rejects.toThrow(new AppError('User not authenticated', 401));
    });
  });
});
