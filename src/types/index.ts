// Common types and interfaces

// Export error types
export * from './error.types';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User related types
export interface UserCreateInput {
  fullName: string;
  birthDate: Date;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface UserUpdateInput {
  fullName?: string;
  birthDate?: Date;
  email?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UserResponse {
  id: string;
  fullName: string;
  birthDate: Date;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

// Auth related types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  birthDate: Date;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

// Task related types
export interface TaskCreateInput {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  userId: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  userId: string;
  user?: UserResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilterParams {
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  userId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

// Request extensions
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
