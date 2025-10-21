import { toast } from "sonner";

export type ErrorType = 'NETWORK' | 'AUTH' | 'VALIDATION' | 'SERVER' | 'UNKNOWN';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
}

/**
 * Central error handling utility for the application
 */
export class ErrorHandler {
  /**
   * Handles and displays errors to the user
   */
  static handle(error: unknown, fallbackMessage?: string): AppError {
    const appError = this.parse(error);
    
    // Display error to user
    toast.error(appError.message, {
      description: appError.details,
      duration: 5000,
    });

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', appError);
    }

    return appError;
  }

  /**
   * Parses unknown error into structured AppError
   */
  static parse(error: unknown): AppError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'NETWORK',
        message: 'Network connection failed',
        details: 'Please check your internet connection and try again.',
      };
    }

    // API errors with status codes
    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      
      if (err.status || err.statusCode) {
        const statusCode = err.status || err.statusCode;
        
        if (statusCode === 401 || statusCode === 403) {
          return {
            type: 'AUTH',
            message: 'Authentication failed',
            details: 'Please sign in again to continue.',
            statusCode,
          };
        }
        
        if (statusCode === 400 || statusCode === 422) {
          return {
            type: 'VALIDATION',
            message: err.message || 'Invalid input',
            details: err.details || 'Please check your input and try again.',
            statusCode,
          };
        }
        
        if (statusCode >= 500) {
          return {
            type: 'SERVER',
            message: 'Server error',
            details: 'Something went wrong on our end. Please try again later.',
            statusCode,
          };
        }
      }
      
      // Custom error objects
      if (err.message) {
        return {
          type: 'UNKNOWN',
          message: err.message,
          details: err.details,
        };
      }
    }

    // Error instances
    if (error instanceof Error) {
      return {
        type: 'UNKNOWN',
        message: error.message,
        details: error.stack,
      };
    }

    // Fallback for unknown errors
    return {
      type: 'UNKNOWN',
      message: 'An unexpected error occurred',
      details: String(error),
    };
  }

  /**
   * Displays success toast notification
   */
  static success(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 3000,
    });
  }

  /**
   * Displays info toast notification
   */
  static info(message: string, description?: string) {
    toast.info(message, {
      description,
      duration: 3000,
    });
  }

  /**
   * Displays warning toast notification
   */
  static warning(message: string, description?: string) {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  }
}

/**
 * Helper function to handle async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: AppError) => void;
    successMessage?: string;
    fallbackMessage?: string;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    
    if (options?.successMessage) {
      ErrorHandler.success(options.successMessage);
    }
    
    if (options?.onSuccess) {
      options.onSuccess(result);
    }
    
    return result;
  } catch (error) {
    const appError = ErrorHandler.handle(error, options?.fallbackMessage);
    
    if (options?.onError) {
      options.onError(appError);
    }
    
    return null;
  }
}

/**
 * Validates required fields in an object
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${String(field)} is required`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private lastCall: number = 0;
  private minInterval: number;

  constructor(callsPerSecond: number) {
    this.minInterval = 1000 / callsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    
    this.lastCall = Date.now();
  }
}
