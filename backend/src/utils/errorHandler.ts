import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { JobNotFoundError, InvalidStateTransitionError, DatabaseError } from '../core/errors.js';

/**
 * Phase 7.E: Unified error model
 * Standard error envelope: { error: { code, message, details? }, requestId }
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_STATE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

/**
 * Map known errors to stable error codes
 */
function mapErrorToCode(error: unknown): { code: ErrorCode; message: string; details?: unknown } {
  if (error instanceof ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.errors,
    };
  }

  if (error instanceof JobNotFoundError) {
    return {
      code: 'NOT_FOUND',
      message: error.message,
    };
  }

  if (error instanceof InvalidStateTransitionError) {
    return {
      code: 'INVALID_STATE',
      message: error.message,
    };
  }

  if (error instanceof DatabaseError) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
      // Don't leak internal DB details
    };
  }

  // Unknown error - sanitize message
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    // Don't leak stack traces or internal details
  };
}

/**
 * Format error response with requestId
 */
export function formatErrorResponse(request: FastifyRequest, error: unknown): ErrorEnvelope {
  const { code, message, details } = mapErrorToCode(error);
  return {
    error: {
      code,
      message,
      details,
    },
    requestId: request.id,
  };
}

/**
 * Get HTTP status code for error code
 */
export function getStatusCodeForError(code: ErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'INVALID_STATE':
      return 409;
    case 'DATABASE_ERROR':
      return 500;
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

