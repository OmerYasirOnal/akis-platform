import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { JobNotFoundError, InvalidStateTransitionError, DatabaseError, AIProviderError, ModelNotAllowedError, type AIErrorCode } from '../core/errors.js';

/**
 * Phase 7.E: Unified error model — AGT-6 standardization
 * Standard error envelope: { error: { code, message, details? }, requestId }
 *
 * ALL backend error responses MUST use this envelope.
 * Frontend parses via HttpClient.parseErrorResponse() which expects:
 *   { error: { code?: string; message?: string; details?: unknown } }
 * and reads requestId from the `request-id` response header.
 */

// ── Core error codes (agent/orchestrator) ──
export type CoreErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_STATE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'
  | AIErrorCode;

// ── Auth error codes ──
export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_IN_USE'
  | 'USER_NOT_FOUND'
  | 'EMAIL_NOT_VERIFIED'
  | 'ALREADY_VERIFIED'
  | 'INVALID_CODE'
  | 'RATE_LIMITED'
  | 'USER_DISABLED'
  | 'INVALID_PROVIDER'
  | 'OAUTH_NOT_CONFIGURED';

// ── Settings / config error codes ──
export type SettingsErrorCode =
  | 'ENCRYPTION_NOT_CONFIGURED'
  | 'DUPLICATE_KEY'
  | 'FORBIDDEN';

// ── Unified error code type ──
export type ErrorCode = CoreErrorCode | AuthErrorCode | SettingsErrorCode;

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

  // AI Provider errors - include code and user-friendly message
  if (error instanceof AIProviderError) {
    const details: Record<string, unknown> = {
      provider: error.provider,
      retryAfter: error.retryAfter,
    };
    if (error instanceof ModelNotAllowedError) {
      details.model = error.model;
      details.allowlist = error.allowlist;
    }

    return {
      code: error.code,
      message: error.message,
      details,
    };
  }

  // Unknown error - sanitize message
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
    // Core
    case 'VALIDATION_ERROR':
    case 'MODEL_NOT_ALLOWED':
    case 'INVALID_CODE':
    case 'INVALID_PROVIDER':
      return 400;
    case 'UNAUTHORIZED':
    case 'INVALID_CREDENTIALS':
      return 401;
    case 'FORBIDDEN':
    case 'ALREADY_VERIFIED':
    case 'EMAIL_NOT_VERIFIED':
    case 'USER_DISABLED':
      return 403;
    case 'NOT_FOUND':
    case 'USER_NOT_FOUND':
      return 404;
    case 'INVALID_STATE':
    case 'EMAIL_IN_USE':
    case 'DUPLICATE_KEY':
      return 409;
    case 'AI_KEY_MISSING':
      return 412; // Precondition failed - missing required key
    case 'RATE_LIMITED':
    case 'AI_RATE_LIMITED':
      return 429;
    case 'DATABASE_ERROR':
      return 500;
    case 'AI_AUTH_ERROR':
      return 502; // Bad gateway - upstream auth failed
    case 'AI_PROVIDER_ERROR':
    case 'AI_NETWORK_ERROR':
    case 'AI_INVALID_RESPONSE':
    case 'ENCRYPTION_NOT_CONFIGURED':
    case 'OAUTH_NOT_CONFIGURED':
      return 503; // Service unavailable
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}

/**
 * Send a standardized error response.
 * This is the preferred way to return errors from route handlers.
 *
 * Usage:
 *   return sendError(reply, request, 'EMAIL_IN_USE', 'Email already registered');
 *
 * The status code is derived automatically from the error code,
 * or you can override it with the optional 5th parameter.
 */
export function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  code: ErrorCode,
  message: string,
  details?: unknown,
  statusCodeOverride?: number,
): FastifyReply {
  const statusCode = statusCodeOverride ?? getStatusCodeForError(code);
  return reply.code(statusCode).send({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    requestId: request.id,
  } satisfies ErrorEnvelope);
}
