# Cookie Verification Guide (Local Development)

## Key Concepts

### Cookies are Domain-Based, NOT Port-Based

- `localhost:3000` and `localhost:5173` share the same cookie domain (`localhost`)
- This is why DevTools may show `akis_sid` under `localhost:5173` even though backend set it on port 3000
- This is **correct browser behavior** - not a bug

## Cookie Configuration (Dev)

| Option | Value | Notes |
|--------|-------|-------|
| `name` | `akis_sid` | Session cookie name |
| `HttpOnly` | `true` | Not accessible via JS (security) |
| `SameSite` | `Lax` | Allows cross-site GET requests |
| `Secure` | `false` | HTTP allowed in dev |
| `Domain` | *omitted* | Defaults to request host |
| `Path` | `/` | Available site-wide |

## How to Verify Cookie Flow

### Step 1: OAuth Callback Response

1. Open DevTools → Network tab
2. Trigger OAuth login (GitHub/Google)
3. Find the `callback?code=...` request (302 redirect)
4. Check **Response Headers**:

```
Set-Cookie: akis_sid=eyJ...; Path=/; HttpOnly; SameSite=Lax
```

### Step 2: /auth/me Request

1. After redirect, find `/auth/me` request
2. Check **Request Headers**:

```
Cookie: akis_sid=eyJ...
```

3. Response should be `200 OK` with user data

### Step 3: Application Tab Verification

1. DevTools → Application → Cookies → `http://localhost:5173`
2. Should see `akis_sid` cookie with:
   - Value: JWT token (eyJ...)
   - HttpOnly: ✓
   - SameSite: Lax

## Troubleshooting

### Cookie not appearing?

- Check CORS: Backend must have `credentials: true`
- Check frontend fetch: Must include `credentials: 'include'`
- Check `SameSite`: Must be `Lax` or `None` for cross-origin

### /auth/me returning 401?

- Clear cookies and retry OAuth flow
- Check if cookie was actually set (Step 1)
- Verify JWT hasn't expired

## Environment Variables

Cookie behavior is controlled by these env vars in `backend/.env`:

```env
AUTH_COOKIE_NAME=akis_sid
AUTH_COOKIE_MAXAGE=604800        # 7 days in seconds
AUTH_COOKIE_SAMESITE=Lax
AUTH_COOKIE_SECURE=false         # Must be true in production
AUTH_COOKIE_DOMAIN=              # Leave empty for localhost
```

