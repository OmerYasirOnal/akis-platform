# AKIS Platform - Waitlist Setup Guide

This document explains how to manage the AKIS waitlist funnel.

## Overview

The waitlist is a Google Form that collects early access signups. It's integrated into:
- **Header CTA** (primary button for unauthenticated users)
- **Hero CTA** (main call-to-action on landing page)
- **Dedicated `/waitlist` page**
- **Edge proxy redirect** (for campaign URLs with UTM params)

## Current Form

**Google Form URL:** https://forms.gle/3aVfEh1Q8929DSY2A

To view responses, access the linked Google Sheet from the form's "Responses" tab.

## Frontend Configuration

### Environment Variable

```bash
# .env or build-time environment
VITE_WAITLIST_URL=https://forms.gle/3aVfEh1Q8929DSY2A
```

If not set, the default fallback URL is used.

### Changing the Form

1. Update `.env.example` with new URL
2. Update GitHub Actions workflow env vars if needed:
   ```yaml
   env:
     VITE_WAITLIST_URL: ${{ secrets.WAITLIST_URL }}
   ```
3. Rebuild and deploy frontend

### UTM Parameters

The waitlist integration automatically appends UTM parameters for tracking:

| Source | UTM Source | UTM Campaign |
|--------|------------|--------------|
| Header CTA (desktop) | `website` | `header_cta` |
| Header CTA (mobile) | `website` | `header_mobile_cta` |
| Hero CTA | `website` | `hero_cta` |
| Waitlist page | `website` | `waitlist_page` |

**For external campaigns (LinkedIn, etc.):**

```
https://staging.akisflow.com/waitlist?utm_source=linkedin&utm_campaign=launch_2026
https://akisflow.com/waitlist?utm_source=linkedin&utm_campaign=launch_2026
```

## Edge Proxy Redirect (Optional)

The Caddyfile.edge includes an optional redirect for campaign URLs:

```caddy
# Waitlist redirect (edge-level for campaigns)
@waitlist_redirect {
    path /waitlist
    query utm_source=*
}
handle @waitlist_redirect {
    redir {$WAITLIST_URL:https://forms.gle/3aVfEh1Q8929DSY2A}?{query} temporary
}
```

**How it works:**
- If `/waitlist` is accessed with UTM params (e.g., `?utm_source=linkedin`), Caddy redirects directly to the form with those params
- Otherwise, the SPA handles `/waitlist` and shows the dedicated page

### Changing the Edge Redirect Target

1. Update `WAITLIST_URL` environment variable on the server
2. Or update the default in `Caddyfile.edge`
3. Restart the edge proxy: `docker compose restart edge`

## Verification Commands

### Test Edge Redirect (with UTM)

```bash
# Should return 302 to Google Form
curl -sI "https://staging.akisflow.com/waitlist?utm_source=linkedin" | head -5

# Expected:
# HTTP/2 302
# location: https://forms.gle/3aVfEh1Q8929DSY2A?utm_source=linkedin
```

### Test Frontend Page (without UTM)

```bash
# Should return 200 (SPA)
curl -sI "https://staging.akisflow.com/waitlist" | head -3

# Expected:
# HTTP/2 200
```

### Verify Form Opens

1. Visit https://staging.akisflow.com
2. Click "Join Waitlist" button in header
3. Confirm Google Form opens in new tab
4. Check URL contains UTM params

## Campaign Best Practices

### LinkedIn Campaign Example

```
URL: https://akisflow.com/waitlist?utm_source=linkedin&utm_campaign=beta_launch

Post copy:
"We're building the future of developer automation. Be first in line.
👉 [Join the waitlist]"
```

### Email Campaign Example

```
URL: https://akisflow.com/waitlist?utm_source=email&utm_campaign=newsletter_jan

Subject: Early access to AKIS is opening soon
```

### Twitter/X Campaign Example

```
URL: https://akisflow.com/waitlist?utm_source=twitter&utm_campaign=launch_thread
```

## Tracking & Analytics

UTM parameters flow through to Google Form submissions, allowing you to:
1. Filter responses by source in Google Sheets
2. Identify highest-converting channels
3. Optimize campaign messaging

## Troubleshooting

### Form Not Opening

1. Check browser popup blocker
2. Verify `VITE_WAITLIST_URL` is set correctly
3. Test in incognito mode

### Wrong Redirect Target

1. Verify `WAITLIST_URL` env var on server
2. Check Caddyfile.edge syntax
3. Run `docker compose logs edge | grep waitlist`

### UTM Params Not Preserved

1. Ensure query string is passed in redirect: `?{query}`
2. Check form URL supports query params (Google Forms does)

## Related Documentation

- [Staging Deployment](./STAGING_DEPLOYMENT.md)
- [Edge Proxy Runbook](./EDGE_PROXY_RUNBOOK.md)
