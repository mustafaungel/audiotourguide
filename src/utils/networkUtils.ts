/**
 * Network utility functions for handling connectivity issues
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly isNetworkError: boolean = true,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: any): boolean {
  if (error instanceof NetworkError) return error.isNetworkError;
  
  // Check for common network error patterns
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('load failed') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('network') ||
    errorCode.includes('connection') ||
    error?.name === 'TypeError' && errorMessage.includes('failed')
  );
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, backoffFactor } = {
    ...defaultRetryOptions,
    ...options,
  };

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      console.log(`[RETRY] Attempt ${attempt} failed:`, {
        error: lastError.message,
        isNetworkError: isNetworkError(lastError),
        attempt,
        maxAttempts
      });

      // Don't retry if it's not a network error or if we've reached max attempts
      if (!isNetworkError(lastError) || attempt >= maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      console.log(`[RETRY] Waiting ${delay}ms before retry ${attempt + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export function getRegionalErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return `Connection issue detected. This might be due to regional network restrictions or temporary connectivity problems. Please check your internet connection and try again.`;
  }
  
  return error?.message || 'An unexpected error occurred';
}

export function getErrorRecoveryActions(error: any): Array<{
  label: string;
  action: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}> {
  if (isNetworkError(error)) {
    return [
      { label: 'Retry Connection', action: 'retry', variant: 'default' },
      { label: 'Check Connection', action: 'diagnose', variant: 'outline' },
    ];
  }
  
  return [
    { label: 'Try Again', action: 'retry', variant: 'outline' },
  ];
}