/**
 * Waitlist utility functions
 * Used for opening the waitlist form with UTM tracking
 */

/**
 * Get the waitlist URL with optional UTM parameters
 */
export function getWaitlistUrl(utmSource?: string, utmCampaign?: string): string {
  const baseUrl =
    import.meta.env.VITE_WAITLIST_URL || 'https://forms.gle/3aVfEh1Q8929DSY2A';

  // If no UTM params, return base URL
  if (!utmSource && !utmCampaign) {
    return baseUrl;
  }

  // Build URL with UTM params
  const url = new URL(baseUrl);
  if (utmSource) url.searchParams.set('utm_source', utmSource);
  if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
  return url.toString();
}

/**
 * Open waitlist form in a new tab
 */
export function openWaitlist(utmSource?: string, utmCampaign?: string): void {
  window.open(getWaitlistUrl(utmSource, utmCampaign), '_blank', 'noopener,noreferrer');
}
