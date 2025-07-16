// Models and database related exports
export { default as prisma } from './prisma';

// Re-export Prisma types for convenience
export type {
  User,
  Task,
  Role,
  Status,
  TaskStatus,
  Priority,
} from '@prisma/client';
