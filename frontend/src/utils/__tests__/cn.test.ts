import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('joins multiple strings', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('filters out false', () => {
    expect(cn('a', false, 'b')).toBe('a b');
  });

  it('filters out null', () => {
    expect(cn('a', null, 'b')).toBe('a b');
  });

  it('filters out undefined', () => {
    expect(cn('a', undefined, 'b')).toBe('a b');
  });

  it('filters out empty strings', () => {
    expect(cn('a', '', 'b')).toBe('a b');
  });

  it('filters out whitespace-only strings', () => {
    expect(cn('a', '   ', 'b')).toBe('a b');
  });

  it('converts numbers to strings', () => {
    expect(cn('a', 42, 'b')).toBe('a 42 b');
  });

  it('converts bigint to string', () => {
    expect(cn('a', BigInt(99), 'b')).toBe('a 99 b');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns empty string for all falsy', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });

  it('handles single string', () => {
    expect(cn('solo')).toBe('solo');
  });

  it('preserves internal whitespace in strings', () => {
    expect(cn('flex gap-2', 'text-sm')).toBe('flex gap-2 text-sm');
  });

  it('handles conditional class pattern', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});
