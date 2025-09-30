
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler.js';

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'email' | 'date' | 'boolean' | 'array';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[];
  };
}

export const validateSchema = (schema: ValidationSchema, location: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[location];
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      if (rules.type) {
        switch (rules.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${field} must be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${field} must be a number`);
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`${field} must be a valid email address`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push(`${field} must be a valid date`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
              errors.push(`${field} must be a boolean`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${field} must be an array`);
            }
            break;
        }
      }

      // String length validation
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }

      // Number range validation
      const numValue = Number(value);
      if (rules.min && !isNaN(numValue) && numValue < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max && !isNaN(numValue) && numValue > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`);
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  user: {
    username: { required: true, type: 'string' as const, minLength: 3, maxLength: 50 },
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 8 },
    role: { required: true, type: 'string' as const, enum: ['admin', 'manager', 'user', 'accountant', 'inventory_manager'] },
  },
  product: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    description: { type: 'string' as const, maxLength: 1000 },
    price: { required: true, type: 'number' as const, min: 0 },
    stock: { required: true, type: 'number' as const, min: 0 },
    category: { required: true, type: 'string' as const },
    unit: { required: true, type: 'string' as const },
  },
  customer: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    email: { type: 'email' as const },
    phone: { type: 'string' as const, maxLength: 20 },
    address: { type: 'string' as const, maxLength: 500 },
  },
  order: {
    customerId: { required: true, type: 'number' as const },
    items: { required: true, type: 'array' as const },
    status: { type: 'string' as const, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
  },
  expense: {
    description: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    amount: { required: true, type: 'number' as const, min: 0.01 },
    category: { required: true, type: 'string' as const },
    date: { required: true, type: 'date' as const },
  },
};
