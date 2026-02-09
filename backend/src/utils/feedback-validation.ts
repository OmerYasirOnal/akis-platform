/**
 * Feedback validation — pure logic, no DB/framework imports
 * S0.5.1-WL-3
 */

export interface FeedbackBody {
  rating: number;
  message: string;
  page?: string;
}

export function validateFeedback(body: unknown): { valid: true; data: FeedbackBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const { rating, message, page } = body as Record<string, unknown>;

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be an integer between 1 and 5' };
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }

  if (message.length > 2000) {
    return { valid: false, error: 'Message must be 2000 characters or less' };
  }

  if (page !== undefined && page !== null && typeof page !== 'string') {
    return { valid: false, error: 'Page must be a string' };
  }

  return {
    valid: true,
    data: {
      rating,
      message: message.trim(),
      page: typeof page === 'string' ? page.slice(0, 500) : undefined,
    },
  };
}
