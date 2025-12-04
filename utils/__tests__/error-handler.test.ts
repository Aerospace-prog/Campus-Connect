/**
 * Tests for error-handler utility
 */
import {
    createAppError,
    getFirebaseErrorMessage,
    handleError,
    isFirebaseError,
    isRetryableError,
    withRetry,
} from '../error-handler';

/**
 * Create a mock Firebase-like error for testing
 */
function createMockFirebaseError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

describe('error-handler', () => {
  describe('getFirebaseErrorMessage', () => {
    it('should return user-friendly message for auth/email-already-in-use', () => {
      const error = createMockFirebaseError('auth/email-already-in-use', 'Email already in use');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('already registered');
    });

    it('should return user-friendly message for auth/invalid-email', () => {
      const error = createMockFirebaseError('auth/invalid-email', 'Invalid email');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('valid email');
    });

    it('should return user-friendly message for auth/weak-password', () => {
      const error = createMockFirebaseError('auth/weak-password', 'Weak password');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('weak');
    });

    it('should return user-friendly message for auth/user-not-found', () => {
      const error = createMockFirebaseError('auth/user-not-found', 'User not found');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('No account found');
    });

    it('should return user-friendly message for permission-denied', () => {
      const error = createMockFirebaseError('permission-denied', 'Permission denied');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('permission');
    });

    it('should return user-friendly message for not-found', () => {
      const error = createMockFirebaseError('not-found', 'Not found');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('not found');
    });

    it('should return user-friendly message for unavailable', () => {
      const error = createMockFirebaseError('unavailable', 'Service unavailable');
      const message = getFirebaseErrorMessage(error);
      expect(message).toContain('unavailable');
    });

    it('should return original message for unknown errors', () => {
      const error = new Error('Custom error message');
      const message = getFirebaseErrorMessage(error);
      expect(message).toBe('Custom error message');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for unavailable error', () => {
      const error = createMockFirebaseError('unavailable', 'Service unavailable');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for deadline-exceeded error', () => {
      const error = createMockFirebaseError('deadline-exceeded', 'Deadline exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for resource-exhausted error', () => {
      const error = createMockFirebaseError('resource-exhausted', 'Resource exhausted');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for network errors', () => {
      const error = new Error('Network connection failed');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for permission-denied error', () => {
      const error = createMockFirebaseError('permission-denied', 'Permission denied');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for not-found error', () => {
      const error = createMockFirebaseError('not-found', 'Not found');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('createAppError', () => {
    it('should create AppError with correct properties', () => {
      const error = createMockFirebaseError('auth/invalid-email', 'Invalid email');
      const context = { screen: 'Login', operation: 'signIn' };
      const appError = createAppError(error, context);

      expect(appError.code).toBe('auth/invalid-email');
      expect(appError.message).toBe('Invalid email');
      expect(appError.userMessage).toContain('valid email');
      expect(appError.context).toEqual(context);
      expect(appError.timestamp).toBeDefined();
      expect(appError.isRetryable).toBe(false);
    });

    it('should mark retryable errors correctly', () => {
      const error = createMockFirebaseError('unavailable', 'Service unavailable');
      const appError = createAppError(error);

      expect(appError.isRetryable).toBe(true);
    });
  });

  describe('isFirebaseError', () => {
    it('should return true for error-like object with code', () => {
      const error = createMockFirebaseError('some-code', 'Some message');
      expect(isFirebaseError(error)).toBe(true);
    });

    it('should return true for plain object with code', () => {
      const error = { code: 'some-code', message: 'Some message' };
      expect(isFirebaseError(error)).toBe(true);
    });

    it('should return false for regular Error without code', () => {
      const error = new Error('Regular error');
      expect(isFirebaseError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isFirebaseError(null)).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should return user-friendly message', () => {
      const error = createMockFirebaseError('auth/invalid-email', 'Invalid email');
      const message = handleError(error);
      expect(message).toContain('valid email');
    });

    it('should handle non-Error objects', () => {
      const message = handleError('string error');
      expect(message).toBe('string error');
    });
  });

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await withRetry(operation, undefined, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error and succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(createMockFirebaseError('unavailable', 'Service unavailable'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, undefined, { 
        maxRetries: 3, 
        initialDelayMs: 10,
        maxDelayMs: 50 
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const error = createMockFirebaseError('permission-denied', 'Permission denied');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withRetry(operation, undefined, { maxRetries: 3 }))
        .rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      const error = createMockFirebaseError('unavailable', 'Service unavailable');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(withRetry(operation, undefined, { 
        maxRetries: 2, 
        initialDelayMs: 10,
        maxDelayMs: 50 
      })).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
