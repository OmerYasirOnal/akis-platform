/**
 * Structured error types for API boundaries
 */

export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} not found`);
    this.name = 'JobNotFoundError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(jobId: string, currentState: string, attemptedTransition: string) {
    super(`Cannot ${attemptedTransition} job ${jobId}: current state is ${currentState}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(`Database error: ${message}`);
    this.name = 'DatabaseError';
    this.cause = cause;
  }
}

/**
 * AI-related error codes for job error classification
 */
export type AIErrorCode =
  | 'AI_RATE_LIMITED'
  | 'AI_PROVIDER_ERROR'
  | 'AI_INVALID_RESPONSE'
  | 'AI_NETWORK_ERROR'
  | 'AI_AUTH_ERROR';

/**
 * AI Provider Error - base class for AI-related errors
 */
export class AIProviderError extends Error {
  readonly code: AIErrorCode;
  readonly provider: string;
  readonly statusCode?: number;
  readonly retryAfter?: number;

  constructor(
    code: AIErrorCode,
    message: string,
    provider: string,
    statusCode?: number,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.provider = provider;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * AI Rate Limited Error - thrown when AI provider returns 429
 */
export class AIRateLimitedError extends AIProviderError {
  constructor(provider: string, retryAfter?: number, rawMessage?: string) {
    const message = rawMessage 
      ? `AI provider ${provider} is rate limited: ${rawMessage}`
      : `AI provider ${provider} is temporarily rate limited. Please try again later.`;
    super('AI_RATE_LIMITED', message, provider, 429, retryAfter);
    this.name = 'AIRateLimitedError';
  }
}

