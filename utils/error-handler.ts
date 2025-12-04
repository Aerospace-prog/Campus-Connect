/**
 * Centralized Error Handler Utility
 * 
 * Provides consistent error handling across the application including:
 * - Firebase error code mapping to user-friendly messages
 * - Error logging with context
 * - Retry mechanisms with exponential backoff
 */

/**
 * Interface for Firebase-like errors with a code property
 */
interface FirebaseLikeError extends Error {
  code: string;
}

/**
 * Check if an error has a code property (Firebase-like error)
 */
function hasErrorCode(error: unknown): error is FirebaseLikeError {
  return typeof error === 'object' && 
         error !== null && 
         'code' in error && 
         typeof (error as any).code === 'string';
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: string;
  screen?: string;
  operation?: string;
  networkStatus?: 'online' | 'offline' | 'unknown';
  additionalData?: Record<string, any>;
}

/**
 * Structured error for the application
 */
export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  originalError?: Error;
  context?: ErrorContext;
  timestamp: number;
  isRetryable: boolean;
}

/**
 * Firebase Auth error codes mapped to user-friendly messages
 */
const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'auth/credential-already-in-use': 'This credential is already associated with another account.',
};

/**
 * Firestore error codes mapped to user-friendly messages
 */
const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested item was not found.',
  'already-exists': 'This item already exists.',
  'resource-exhausted': 'Too many requests. Please wait a moment and try again.',
  'failed-precondition': 'Operation failed. Please try again.',
  'aborted': 'Operation was cancelled. Please try again.',
  'out-of-range': 'Invalid data provided.',
  'unimplemented': 'This feature is not available.',
  'internal': 'An internal error occurred. Please try again.',
  'unavailable': 'Service is temporarily unavailable. Please try again later.',
  'data-loss': 'Data may have been lost. Please try again.',
  'unauthenticated': 'Please sign in to continue.',
  'cancelled': 'Operation was cancelled.',
  'unknown': 'An unknown error occurred. Please try again.',
  'invalid-argument': 'Invalid data provided. Please check your input.',
  'deadline-exceeded': 'Request timed out. Please try again.',
};


/**
 * Retryable error codes - operations with these codes can be retried
 */
const RETRYABLE_ERROR_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  'resource-exhausted',
  'aborted',
  'internal',
  'auth/network-request-failed',
  'auth/too-many-requests',
]);

/**
 * Get user-friendly message for Firebase error
 */
export function getFirebaseErrorMessage(error: Error): string {
  if (hasErrorCode(error)) {
    const code = error.code;
    
    // Check auth errors
    if (code.startsWith('auth/')) {
      return FIREBASE_AUTH_ERROR_MESSAGES[code] || 'Authentication error. Please try again.';
    }
    
    // Check Firestore errors
    const firestoreCode = code.replace('firestore/', '');
    if (FIRESTORE_ERROR_MESSAGES[firestoreCode]) {
      return FIRESTORE_ERROR_MESSAGES[firestoreCode];
    }
    
    // Check for network-related errors in message
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('offline') || message.includes('connection')) {
      return 'Network error. Please check your connection and try again.';
    }
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (hasErrorCode(error)) {
    const code = error.code;
    return RETRYABLE_ERROR_CODES.has(code) || RETRYABLE_ERROR_CODES.has(code.replace('firestore/', ''));
  }
  
  const message = error.message.toLowerCase();
  return message.includes('network') || 
         message.includes('timeout') || 
         message.includes('unavailable') ||
         message.includes('connection');
}

/**
 * Create a structured AppError from any error
 */
export function createAppError(
  error: Error,
  context?: ErrorContext
): AppError {
  const code = hasErrorCode(error) ? error.code : 'unknown';
  const userMessage = getFirebaseErrorMessage(error);
  
  return {
    code,
    message: error.message,
    userMessage,
    originalError: error,
    context,
    timestamp: Date.now(),
    isRetryable: isRetryableError(error),
  };
}

/**
 * Log error with context
 */
export function logError(error: AppError | Error, context?: ErrorContext): void {
  const appError = error instanceof Error && !('userMessage' in error)
    ? createAppError(error, context)
    : error as AppError;
  
  const logData = {
    code: appError.code,
    message: appError.message,
    userMessage: appError.userMessage,
    context: appError.context || context,
    timestamp: appError.timestamp || Date.now(),
    isRetryable: appError.isRetryable,
  };
  
  // Log to console
  console.error('[ErrorHandler]', logData);
}


/**
 * Exponential backoff configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Calculate delay for exponential backoff
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with exponential backoff retry
 * 
 * @param operation - The async operation to execute
 * @param context - Error context for logging
 * @param config - Retry configuration (optional)
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Log the error
      logError(lastError, {
        ...context,
        additionalData: {
          ...context?.additionalData,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
        },
      });
      
      // Don't retry if error is not retryable or we've exhausted retries
      if (!isRetryableError(lastError) || attempt === retryConfig.maxRetries) {
        break;
      }
      
      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.log(`[ErrorHandler] Retrying in ${Math.round(delay)}ms (attempt ${attempt + 2}/${retryConfig.maxRetries + 1})`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Wrap an async function with retry logic
 * 
 * @param fn - The async function to wrap
 * @param contextProvider - Function to generate context from arguments
 * @param config - Retry configuration (optional)
 * @returns A wrapped function with retry logic
 */
export function withRetryWrapper<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  contextProvider?: (...args: TArgs) => ErrorContext,
  config?: Partial<RetryConfig>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const context = contextProvider ? contextProvider(...args) : undefined;
    return withRetry(() => fn(...args), context, config);
  };
}

/**
 * Handle error and return user-friendly message
 * Use this in catch blocks to get consistent error messages
 */
export function handleError(error: unknown, context?: ErrorContext): string {
  const err = error instanceof Error ? error : new Error(String(error));
  logError(err, context);
  return getFirebaseErrorMessage(err);
}

/**
 * Type guard to check if error is a Firebase error
 */
export function isFirebaseError(error: unknown): error is FirebaseLikeError {
  return hasErrorCode(error);
}
