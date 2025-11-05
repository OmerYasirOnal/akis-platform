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

