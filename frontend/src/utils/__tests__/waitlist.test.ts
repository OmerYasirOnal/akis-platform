import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWaitlistUrl, openWaitlist } from '../waitlist';

describe('getWaitlistUrl', () => {
  it('returns base URL when no UTM params', () => {
    const url = getWaitlistUrl();
    expect(url).toBe('https://forms.gle/3aVfEh1Q8929DSY2A');
  });

  it('appends utm_source when provided', () => {
    const url = getWaitlistUrl('landing');
    expect(url).toContain('utm_source=landing');
  });

  it('appends utm_campaign when provided', () => {
    const url = getWaitlistUrl(undefined, 'spring2026');
    expect(url).toContain('utm_campaign=spring2026');
  });

  it('appends both UTM params', () => {
    const url = getWaitlistUrl('header', 'launch');
    expect(url).toContain('utm_source=header');
    expect(url).toContain('utm_campaign=launch');
  });

  it('returns base URL when both params are empty strings', () => {
    const url = getWaitlistUrl('', '');
    expect(url).toBe('https://forms.gle/3aVfEh1Q8929DSY2A');
  });
});

describe('openWaitlist', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn());
  });

  it('opens waitlist URL in new tab', () => {
    openWaitlist();
    expect(window.open).toHaveBeenCalledWith(
      'https://forms.gle/3aVfEh1Q8929DSY2A',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('passes UTM params through to URL', () => {
    openWaitlist('footer', 'beta');
    const call = vi.mocked(window.open).mock.calls[0];
    expect(call[0]).toContain('utm_source=footer');
    expect(call[0]).toContain('utm_campaign=beta');
  });
});
