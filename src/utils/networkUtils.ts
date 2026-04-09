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
  baseDelay: 800,
  maxDelay: 10000,
  backoffFactor: 2,
};

// Enhanced retry options for regional/international users
export const regionalRetryOptions: RetryOptions = {
  maxAttempts: 5,
  baseDelay: 1500,
  maxDelay: 15000,
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
    errorMessage.includes('access denied') ||
    errorMessage.includes('cors') ||
    errorMessage.includes('blocked') ||
    errorMessage.includes('refused') ||
    errorMessage.includes('unreachable') ||
    errorCode.includes('network') ||
    errorCode.includes('connection') ||
    errorCode.includes('cors') ||
    error?.name === 'TypeError' && errorMessage.includes('failed') ||
    error?.status === 0 || // Often indicates CORS or network issues
    error?.status === 403 || // Access denied
    error?.status === 502 || // Bad gateway
    error?.status === 503 || // Service unavailable
    error?.status === 504    // Gateway timeout
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
    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('cors') || errorMessage.includes('access denied')) {
      return `Regional access restriction detected. This content might be blocked in your location. Try using a VPN or contact support for alternative access methods.`;
    }
    
    if (errorMessage.includes('timeout') || error?.status === 504) {
      return `Connection timeout detected. This might be due to slow internet or regional network issues. Please try again with a stable connection.`;
    }
    
    return `Network connectivity issue detected. This might be due to regional restrictions, firewall settings, or temporary service disruption. Please check your connection and try again.`;
  }
  
  return error?.message || 'An unexpected error occurred';
}

// New function to detect if user might be in a restricted region
export function isLikelyRegionalIssue(error: any): boolean {
  if (!isNetworkError(error)) return false;
  
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('cors') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('blocked') ||
    error?.status === 403 ||
    error?.status === 0
  );
}

// Enhanced audio-specific error detection
export function isAudioLoadError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    isNetworkError(error) ||
    errorMessage.includes('could not load') ||
    errorMessage.includes('media') ||
    errorMessage.includes('audio') ||
    errorMessage.includes('decode') ||
    error?.code === 'MEDIA_ERR_NETWORK' ||
    error?.code === 'MEDIA_ERR_SRC_NOT_SUPPORTED'
  );
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