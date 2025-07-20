import { UserController } from '../../controllers/user.controller';
import { UserService } from '../../services/user.service';
import { AppError } from '../../types/error.types';

// Mock dependencies
jest.mock('../../services/user.service');

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userController = new UserController();
    mockUserService = new MockedUserService() as jest.Mocked<UserService>;
    (userController as any).userService = mockUserService;
  });

  describe('Constructor', () => {
    it('should create UserController instance', () => {
      expect(userController).toBeInstanceOf(UserController);
      expect(userController).toBeDefined();
    });

    it('should have userService property', () => {
      expect((userController as any).userService).toBeDefined();
    });
  });

  describe('Methods existence', () => {
    it('should have all required methods', () => {
      expect(typeof userController.getById).toBe('function');
      expect(typeof userController.getAll).toBe('function');
      expect(typeof userController.updateUser).toBe('function');
      expect(typeof userController.blockUser).toBe('function');
      expect(typeof userController.unblockUser).toBe('function');
      expect(typeof userController.searchUsers).toBe('function');
      expect(typeof userController.deleteUser).toBe('function');
      expect(typeof userController.getUserStats).toBe('function');
    });
  });

  describe('UserService integration', () => {
    it('should use UserService instance', () => {
      expect((userController as any).userService).toBeInstanceOf(UserService);
    });

    it('should have access to UserService methods', () => {
      const userService = (userController as any).userService;
      expect(typeof userService.findById).toBe('function');
      expect(typeof userService.findAll).toBe('function');
      expect(typeof userService.updateUser).toBe('function');
      expect(typeof userService.blockUser).toBe('function');
      expect(typeof userService.unblockUser).toBe('function');
      expect(typeof userService.searchUsers).toBe('function');
      expect(typeof userService.deleteUser).toBe('function');
      expect(typeof userService.getUserStats).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should handle AppError instances', () => {
      const error = new AppError('Test error', 400);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Controller structure', () => {
    it('should be properly structured', () => {
      // Check that controller has the expected structure
      expect(userController).toHaveProperty('getById');
      expect(userController).toHaveProperty('getAll');
      expect(userController).toHaveProperty('updateUser');
      expect(userController).toHaveProperty('blockUser');
      expect(userController).toHaveProperty('unblockUser');
      expect(userController).toHaveProperty('searchUsers');
      expect(userController).toHaveProperty('deleteUser');
      expect(userController).toHaveProperty('getUserStats');
    });

    it('should have methods as arrow functions', () => {
      // Arrow functions are bound to the instance
      const { getById, getAll, updateUser, blockUser } = userController;
      expect(typeof getById).toBe('function');
      expect(typeof getAll).toBe('function');
      expect(typeof updateUser).toBe('function');
      expect(typeof blockUser).toBe('function');
    });
  });

  describe('Integration with existing architecture', () => {
    it('should follow the same pattern as AuthController', () => {
      // UserController should follow the same architectural patterns
      expect(userController.constructor.name).toBe('UserController');

      // Should have private userService property
      expect((userController as any).userService).toBeDefined();

      // Methods should be arrow functions (bound to instance)
      expect(typeof userController.getById).toBe('function');
      expect(userController.getById.name).toBe(''); // Arrow functions are anonymous
    });

    it('should be compatible with middleware architecture', () => {
      // All controller methods should be compatible with asyncHandler middleware
      const methods = [
        'getById',
        'getAll',
        'updateUser',
        'blockUser',
        'unblockUser',
        'searchUsers',
        'deleteUser',
        'getUserStats',
      ];

      methods.forEach(methodName => {
        const method = (userController as any)[methodName];
        expect(typeof method).toBe('function');
        expect(method.length).toBeGreaterThanOrEqual(2); // req, res parameters
      });
    });
  });
});
