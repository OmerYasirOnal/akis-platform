/**
 * Unit tests for feedback validation — S0.5.1-WL-3
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { validateFeedback } from '../../src/utils/feedback-validation.js';

describe('validateFeedback', () => {
  test('accepts valid feedback with all fields', () => {
    const result = validateFeedback({ rating: 4, message: 'Great platform!', page: '/dashboard' });
    assert.strictEqual(result.valid, true);
    if (result.valid) {
      assert.strictEqual(result.data.rating, 4);
      assert.strictEqual(result.data.message, 'Great platform!');
      assert.strictEqual(result.data.page, '/dashboard');
    }
  });

  test('accepts valid feedback without page', () => {
    const result = validateFeedback({ rating: 3, message: 'Decent.' });
    assert.strictEqual(result.valid, true);
    if (result.valid) {
      assert.strictEqual(result.data.page, undefined);
    }
  });

  test('rejects missing body', () => {
    const result = validateFeedback(null);
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes('body'));
    }
  });

  test('rejects rating below 1', () => {
    const result = validateFeedback({ rating: 0, message: 'Bad' });
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes('Rating'));
    }
  });

  test('rejects rating above 5', () => {
    const result = validateFeedback({ rating: 6, message: 'Bad' });
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes('Rating'));
    }
  });

  test('rejects non-integer rating', () => {
    const result = validateFeedback({ rating: 3.5, message: 'Ok' });
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes('Rating'));
    }
  });

  test('rejects empty message', () => {
    const result = validateFeedback({ rating: 3, message: '   ' });
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes('Message'));
    }
  });

  test('rejects message over 2000 chars', () => {
    const result = validateFeedback({ rating: 3, message: 'a'.repeat(2001) });
    assert.strictEqual(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes('2000'));
    }
  });

  test('trims whitespace from message', () => {
    const result = validateFeedback({ rating: 5, message: '  Nice!  ' });
    assert.strictEqual(result.valid, true);
    if (result.valid) {
      assert.strictEqual(result.data.message, 'Nice!');
    }
  });

  test('truncates page to 500 chars', () => {
    const longPage = '/path/' + 'x'.repeat(600);
    const result = validateFeedback({ rating: 3, message: 'Ok', page: longPage });
    assert.strictEqual(result.valid, true);
    if (result.valid) {
      assert.strictEqual(result.data.page!.length, 500);
    }
  });
});
