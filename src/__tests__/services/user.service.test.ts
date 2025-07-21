import { UserService } from '../../services/user.service';
import { AppError } from '../../types/error.types';
import { Role, Status, User } from '@prisma/client';
import {
  UserCreateInput,
  UserUpdateInput,
  PaginationParams,
} from '../../types';
// import bcrypt from 'bcryptjs'; // Mocked below

// Mock dependencies
jest.mock('../../models', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('../../config/config', () => ({
  config: {
    bcryptRounds: 12,
  },
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

// Get the mocked bcrypt functions
const bcrypt = require('bcryptjs');
const mockBcrypt = {
  hash: bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>,
  compare: bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>,
};

describe('UserService', () => {
  let userService: UserService;

  // Mock user data
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    fullName: 'John Doe',
    birthDate: new Date('1990-01-01'),
    email: 'john@example.com',
    password: 'hashedPassword123',
    role: Role.USER,
    status: Status.ACTIVE,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserCreateInput: UserCreateInput = {
    fullName: 'John Doe',
    birthDate: new Date('1990-01-01'),
    email: 'john@example.com',
    password: 'password123',
    role: Role.USER,
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();

    // Setup default mocks
    (userService as any).prisma = mockPrisma;

    // Reset bcrypt mocks
    mockBcrypt.hash.mockResolvedValue('hashedPassword123');
    mockBcrypt.compare.mockResolvedValue(true);
  });

  describe('Constructor', () => {
    it('should create UserService instance', () => {
      expect(userService).toBeInstanceOf(UserService);
    });

    it('should have all required methods', () => {
      const methods = [
        'createUser',
        'findById',
        'findByEmail',
        'findAll',
        'updateUser',
        'updateUserStatus',
        'blockUser',
        'unblockUser',
        'deleteUser',
        'verifyPassword',
        'getUserStats',
        'searchUsers',
      ];

      methods.forEach(method => {
        expect(userService).toHaveProperty(method);
        expect(typeof (userService as any)[method]).toBe('function');
      });
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      mockBcrypt.hash.mockResolvedValue('hashedPassword123');
    });

    it('should create a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(mockUserCreateInput);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUserCreateInput.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(
        mockUserCreateInput.password,
        12
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          fullName: mockUserCreateInput.fullName,
          birthDate: mockUserCreateInput.birthDate,
          email: mockUserCreateInput.email,
          password: 'hashedPassword123',
          role: Role.USER,
          status: Status.ACTIVE,
        },
      });

      expect(result).toEqual({
        id: mockUser.id,
        fullName: mockUser.fullName,
        birthDate: mockUser.birthDate,
        email: mockUser.email,
        role: mockUser.role,
        status: mockUser.status,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user with email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(userService.createUser(mockUserCreateInput)).rejects.toThrow(
        new AppError('User with this email already exists', 409)
      );

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should use default role USER if not provided', async () => {
      const inputWithoutRole = { ...mockUserCreateInput };
      delete inputWithoutRole.role;

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await userService.createUser(inputWithoutRole);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: Role.USER,
        }),
      });
    });

    it('should handle bcrypt hash error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockRejectedValue(new Error('Hash failed'));

      await expect(userService.createUser(mockUserCreateInput)).rejects.toThrow(
        new AppError('Failed to hash password', 500)
      );
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(mockUserCreateInput)).rejects.toThrow(
        new AppError('Failed to create user', 500)
      );
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findById(mockUser.id);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual({
        id: mockUser.id,
        fullName: mockUser.fullName,
        birthDate: mockUser.birthDate,
        email: mockUser.email,
        role: mockUser.role,
        status: mockUser.status,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(userService.findById(mockUser.id)).rejects.toThrow(
        new AppError('Failed to find user', 500)
      );
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(mockUser.email);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.findByEmail('non-existent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(userService.findByEmail(mockUser.email)).rejects.toThrow(
        new AppError('Failed to find user by email', 500)
      );
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      mockUser,
      { ...mockUser, id: 'user2', email: 'user2@example.com' },
    ];

    it('should find all users with default pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(2);

      const result = await userService.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Users retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).not.toHaveProperty('password');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('should find all users with custom pagination', async () => {
      const params: PaginationParams = { page: 2, limit: 5 };
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(10);

      const result = await userService.findAll(params);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 10,
        totalPages: 2,
      });
    });

    it('should handle database error', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(userService.findAll()).rejects.toThrow(
        new AppError('Failed to retrieve users', 500)
      );
    });
  });

  describe('updateUser', () => {
    const updateData: UserUpdateInput = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // Email check
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(mockUser.id, updateData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.updateUser('non-existent-id', updateData)
      ).rejects.toThrow(new AppError('User not found', 404));
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { ...mockUser, id: 'different-id' };
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      await expect(
        userService.updateUser(mockUser.id, updateData)
      ).rejects.toThrow(new AppError('Email already exists', 409));
    });

    it('should not check email uniqueness if email is not being updated', async () => {
      const updateDataWithoutEmail = { fullName: 'Jane Doe' };
      const updatedUser = { ...mockUser, fullName: 'Jane Doe' };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await userService.updateUser(mockUser.id, updateDataWithoutEmail);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        userService.updateUser(mockUser.id, updateData)
      ).rejects.toThrow(new AppError('Failed to update user', 500));
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      const updatedUser = { ...mockUser, status: Status.INACTIVE };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUserStatus(
        mockUser.id,
        Status.INACTIVE
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { status: Status.INACTIVE },
      });
      expect(result.status).toBe(Status.INACTIVE);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.updateUserStatus('non-existent-id', Status.INACTIVE)
      ).rejects.toThrow(new AppError('User not found', 404));
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        userService.updateUserStatus(mockUser.id, Status.INACTIVE)
      ).rejects.toThrow(new AppError('Failed to update user status', 500));
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      const blockedUser = { ...mockUser, status: Status.INACTIVE };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(blockedUser);

      const result = await userService.blockUser(mockUser.id);

      expect(result.status).toBe(Status.INACTIVE);
    });
  });

  describe('unblockUser', () => {
    it('should unblock user successfully', async () => {
      const unblockedUser = { ...mockUser, status: Status.ACTIVE };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(unblockedUser);

      const result = await userService.unblockUser(mockUser.id);

      expect(result.status).toBe(Status.ACTIVE);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully (soft delete)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        status: Status.INACTIVE,
      });

      await userService.deleteUser(mockUser.id);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { status: Status.INACTIVE },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent-id')).rejects.toThrow(
        new AppError('User not found', 404)
      );
    });

    it('should handle database error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(userService.deleteUser(mockUser.id)).rejects.toThrow(
        new AppError('Failed to delete user', 500)
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify password successfully', async () => {
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await userService.verifyPassword(
        'password123',
        'hashedPassword123'
      );

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123'
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await userService.verifyPassword(
        'wrongpassword',
        'hashedPassword123'
      );

      expect(result).toBe(false);
    });

    it('should handle bcrypt error', async () => {
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      await expect(
        userService.verifyPassword('password123', 'hashedPassword123')
      ).rejects.toThrow(new AppError('Failed to verify password', 500));
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics successfully', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(20) // inactive
        .mockResolvedValueOnce(5) // admins
        .mockResolvedValueOnce(95); // users

      const result = await userService.getUserStats();

      expect(mockPrisma.user.count).toHaveBeenCalledTimes(5);
      expect(result).toEqual({
        total: 100,
        active: 80,
        inactive: 20,
        admins: 5,
        users: 95,
      });
    });

    it('should handle database error', async () => {
      mockPrisma.user.count.mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserStats()).rejects.toThrow(
        new AppError('Failed to get user statistics', 500)
      );
    });
  });

  describe('searchUsers', () => {
    const mockUsers = [mockUser];

    it('should search users successfully with default pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await userService.searchUsers('John');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fullName: { contains: 'John', mode: 'insensitive' } },
            { email: { contains: 'John', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Users found successfully');
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).not.toHaveProperty('password');
    });

    it('should search users with custom pagination', async () => {
      const params: PaginationParams = { page: 2, limit: 5 };
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await userService.searchUsers('test', params);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fullName: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 0,
        totalPages: 0,
      });
    });

    it('should handle database error', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(userService.searchUsers('John')).rejects.toThrow(
        new AppError('Failed to search users', 500)
      );
    });
  });

  describe('Private methods', () => {
    describe('sanitizeUser', () => {
      it('should remove password from user object', () => {
        const sanitizedUser = (userService as any).sanitizeUser(mockUser);

        expect(sanitizedUser).not.toHaveProperty('password');
        expect(sanitizedUser).toEqual({
          id: mockUser.id,
          fullName: mockUser.fullName,
          birthDate: mockUser.birthDate,
          email: mockUser.email,
          role: mockUser.role,
          status: mockUser.status,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        });
      });
    });
  });
});
