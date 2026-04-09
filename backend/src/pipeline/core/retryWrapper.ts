import type { PipelineError } from './contracts/PipelineTypes.js';

/**
 * Check whether an error is a structured PipelineError
 * with an explicit non-retryable flag.
 */
function isNonRetryable(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'retryable' in error &&
    (error as PipelineError).retryable === false
  ) {
    return true;
  }
  // Wrapped PipelineError inside a generic Error
  if (error instanceof Error && 'retryable' in error && (error as unknown as PipelineError).retryable === false) {
    return true;
  }
  return false;
}

/**
 * Generic retry wrapper for agent calls in the pipeline orchestrator.
 * Respects PipelineError.retryable flag — non-retryable errors are
 * thrown immediately without consuming retry budget.
 * Uses progressive backoff: 2 s, 4 s, 6 s …
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: {
    maxAttempts?: number;
    onError?: (error: unknown, attempt: number) => void;
  } = {},
): Promise<T> {
  const { maxAttempts = 3, onError } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      onError?.(error, attempt);

      // Non-retryable errors should not be retried
      if (isNonRetryable(error)) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw new Error(
          `${maxAttempts} denemeden sonra başarısız: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const delay = attempt * 2000; // progressive: 2s, 4s, 6s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}
