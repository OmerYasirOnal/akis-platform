/**
 * Generic retry wrapper for agent calls in the pipeline orchestrator.
 * Provides an outer retry layer with progressive backoff.
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
      if (attempt === maxAttempts) {
        throw new Error(
          `${maxAttempts} denemeden sonra başarısız: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const delay = attempt * 2000; // progressive: 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}
