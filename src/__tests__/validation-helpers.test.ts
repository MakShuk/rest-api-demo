/**
 * Тесты для вспомогательных функций валидации
 */

import {
  calculatePasswordStrength,
  validatePhoneNumber,
  validateDateRange,
  validateSchema,
} from '../utils/validation-helpers.utils';

describe('Validation Helper Functions', () => {
  
  describe('Password Strength Calculator', () => {
    test('should calculate weak password strength', () => {
      const result = calculatePasswordStrength('weak');
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
    
    test('should calculate strong password strength', () => {
      const result = calculatePasswordStrength('StrongPass123!@#');
      expect(result.score).toBeGreaterThan(6);
      expect(result.feedback.length).toBe(0);
    });
    
    test('should detect repeating characters', () => {
      const result = calculatePasswordStrength('Passsssword123!');
      expect(result.feedback).toContain('Avoid repeating characters');
    });
    
    test('should provide feedback for missing character types', () => {
      const result = calculatePasswordStrength('lowercase');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add numbers');
      expect(result.feedback).toContain('Add special characters');
    });
  });
  
  describe('Phone Number Validation', () => {
    test('should validate international phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('+7 (999) 123-45-67')).toBe(true);
      expect(validatePhoneNumber('+44 20 7946 0958')).toBe(true);
    });
    
    test('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('invalid-phone')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
    
    test('should handle phone numbers with formatting', () => {
      expect(validatePhoneNumber('+1 (555) 123-4567')).toBe(true);
      expect(validatePhoneNumber('+7-999-123-45-67')).toBe(true);
    });
  });
  
  describe('Date Range Validation', () => {
    test('should validate correct date ranges', () => {
      expect(validateDateRange('2023-01-01', '2023-12-31')).toBe(true);
      expect(validateDateRange('2023-06-15', '2023-06-15')).toBe(true); // Same date
    });
    
    test('should reject incorrect date ranges', () => {
      expect(validateDateRange('2023-12-31', '2023-01-01')).toBe(false);
      expect(validateDateRange('2024-01-01', '2023-12-31')).toBe(false);
    });
  });
  
  describe('Schema Validation', () => {
    test('should validate object against schema', () => {
      const schema = {
        name: { required: true, type: 'string', minLength: 2 },
        age: { required: true, type: 'number' },
        email: { required: false, type: 'string', pattern: /\S+@\S+\.\S+/ }
      };
      
      const validData = { name: 'John', age: 25, email: 'john@example.com' };
      const result = validateSchema(validData, schema);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should detect schema violations', () => {
      const schema = {
        name: { required: true, type: 'string', minLength: 2 },
        age: { required: true, type: 'number' }
      };
      
      const invalidData = { name: 'J', age: 'not-a-number' };
      const result = validateSchema(invalidData, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('should handle missing required fields', () => {
      const schema = {
        name: { required: true, type: 'string' },
        email: { required: true, type: 'string' }
      };
      
      const incompleteData = { name: 'John' }; // Missing email
      const result = validateSchema(incompleteData, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required');
    });
    
    test('should handle optional fields', () => {
      const schema = {
        name: { required: true, type: 'string' },
        nickname: { required: false, type: 'string', maxLength: 20 }
      };
      
      const dataWithoutOptional = { name: 'John' };
      const result1 = validateSchema(dataWithoutOptional, schema);
      expect(result1.isValid).toBe(true);
      
      const dataWithOptional = { name: 'John', nickname: 'Johnny' };
      const result2 = validateSchema(dataWithOptional, schema);
      expect(result2.isValid).toBe(true);
    });
  });
});

describe('Edge Cases and Performance', () => {
  test('should handle edge cases', () => {
    // Empty values
    expect(validatePhoneNumber('')).toBe(false);
    expect(calculatePasswordStrength('').score).toBe(0);
    
    // Null/undefined handling in schema validation
    const schema = { name: { required: true, type: 'string' } };
    const nullData = { name: null };
    const undefinedData = { name: undefined };
    const emptyStringData = { name: '' };
    
    expect(validateSchema(nullData, schema).isValid).toBe(false);
    expect(validateSchema(undefinedData, schema).isValid).toBe(false);
    expect(validateSchema(emptyStringData, schema).isValid).toBe(false);
  });
  
  test('should handle large datasets efficiently', () => {
    const startTime = Date.now();
    
    // Test with many password strength calculations
    for (let i = 0; i < 100; i++) {
      calculatePasswordStrength(`TestPassword${i}!`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time
    expect(duration).toBeLessThan(1000);
  });
});
