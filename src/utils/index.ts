// Utility functions

// Export response utilities
export * from './response.utils';

// Export validation utilities
export * from './validation.utils';
export * from './validation-helpers.utils';

// Export JWT utilities
export * from './jwt.utils';

// Export error utilities
export * from './error.utils';

// Legacy utilities (will be replaced by new ones)
export const asyncHandler =
  (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const generateResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
) => {
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};
