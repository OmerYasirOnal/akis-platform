# Auth & RBAC Dokümantasyonu

## Amaç ve Kapsam

Bu dokümantasyon, AKIS Platform'un Phase 9 Authentication ve Role-Based Access Control (RBAC) implementasyonunu açıklar. MVP seviyesinde bir auth sistemi sağlar:

- Cookie-based session yönetimi
- Mock authentication (geliştirme için)
- RBAC guard mekanizması
- Frontend session state yönetimi

## Phase 9.1 Güncellemeleri (Frontend UI)

- **Demo kullanıcı rolleri:** `admin@example.com / admin123` → `admin`, `user@example.com / user123` → `member`. `frontend/src/auth/AuthContext.tsx` içindeki `DEMO_USERS` sözlüğü tek kaynaktır.
- **Session saklama:** Başarılı girişte `localStorage` (`akis-auth-state`) kaydı yapılır; logout tüm alanları temizler.
- **UI teması:** `/login` ve `/signup` sayfaları `bg-ak-bg` tam sayfa, form kartları `bg-ak-surface-2 border-ak-border`, odak halkaları `ak-primary`.
- **Redirect mesajı:** `RequireAuth` koruması, yetkisiz erişim isteğini `/login`'e yönlendirirken `state.message` ile “Bu AKIS alanı korumalı...” uyarısını kart üstünde gösterir.
- **Form erişilebilirliği:** Input bileşeni `focus:ring-2 focus:ring-ak-primary/70`, toggle düğmeleri `focus:ring-ak-primary`, checkbox `focus:ring-2` ile güncellendi.
- **Signup akışı:** Demo kayıt `member` rolüyle oturum açar ve başarıyla `/dashboard`'a yönlendirir.
- **UI-only:** Phase 9.1 backend entegrasyonu gerçekleştirmez; demo akışı exclusively frontend üzerinde çalışır.

## Akış Diyagramı

```
[Kullanıcı] 
    │
    ├─> POST /api/auth/login (email, password)
    │       │
    │       ├─> ✅ Doğrulama başarılı
    │       │       │
    │       │       ├─> Session oluştur (in-memory store)
    │       │       ├─> Cookie set (httpOnly, sameSite=lax, secure=prod)
    │       │       └─> 200 {user: {email, roles}}
    │       │
    │       └─> ❌ Doğrulama başarısız
    │               └─> 401 Unauthorized
    │
    ├─> GET /api/auth/session
    │       │
    │       ├─> ✅ Cookie geçerli
    │       │       └─> 200 {user: {email, roles}}
    │       │
    │       └─> ❌ Cookie geçersiz/yok
    │               └─> 401 Unauthorized
    │
    ├─> Protected Route (/api/agents/jobs)
    │       │
    │       ├─> ✅ Session geçerli + RBAC kontrolü başarılı
    │       │       └─> 200 Response
    │       │
    │       ├─> ❌ Session geçersiz
    │       │       └─> 401 Unauthorized
    │       │
    │       └─> ❌ Session geçerli ama yetki yok
    │               └─> 403 Forbidden
    │
    └─> POST /api/auth/logout
            │
            ├─> Session temizle
            ├─> Cookie clear
            └─> 204 No Content
```

## API Sözleşmeleri

### POST /api/auth/login

Kullanıcı girişi yapar ve session cookie oluşturur.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "email": "admin@example.com",
    "roles": ["admin"]
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials",
  "code": "UNAUTHORIZED"
}
```

**Cookie:**
- `sessionId` (httpOnly, sameSite=lax, secure=true in production)

### POST /api/auth/logout

Kullanıcı çıkışı yapar ve session'ı temizler.

**Response (204 No Content):**
- Cookie temizlenir
- Session store'dan kaldırılır

### GET /api/auth/session

Mevcut session bilgisini döner.

**Response (200 OK):**
```json
{
  "user": {
    "email": "admin@example.com",
    "roles": ["admin"]
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Not authenticated",
  "code": "UNAUTHORIZED"
}
```

## Curl Örnekleri

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt
```

### Session Kontrolü
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

## RBAC Guard Örneği

### TypeScript İmzası

```typescript
interface User {
  email: string;
  roles: string[];
}

interface RBACOptions {
  requiredRoles?: string[];
}

function rbacGuard(user: User | null, options: RBACOptions): void {
  if (!user) {
    throw new UnauthorizedError('Not authenticated');
  }

  if (options.requiredRoles && options.requiredRoles.length > 0) {
    const hasRole = options.requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenError('Insufficient permissions');
    }
  }
}
```

### Fastify Hook Örneği

```typescript
fastify.addHook('onRequest', async (request, reply) => {
  // Public routes
  if (request.url.startsWith('/api/auth/login') || 
      request.url.startsWith('/health')) {
    return;
  }

  const sessionId = request.cookies.sessionId;
  const user = sessionStore.get(sessionId);

  if (!user) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  request.user = user;
});

// Route handler'da RBAC kontrolü
fastify.get('/api/agents/jobs', {
  preHandler: (request, reply) => {
    rbacGuard(request.user, { requiredRoles: ['admin'] });
  }
}, async (request, reply) => {
  // Handler logic
});
```

## Güvenlik Notları

### Cookie Ayarları

- **httpOnly**: `true` - JavaScript tarafından erişilemez (XSS koruması)
- **sameSite**: `lax` - CSRF koruması (GET isteklerinde cookie gönderilir, cross-site POST'larda gönderilmez)
- **secure**: `true` (production) - Sadece HTTPS üzerinden gönderilir
- **maxAge**: Session süresi (örn: 24 saat)

### Session Store

- **MVP**: In-memory store (Map veya basit obje)
- **Production**: Redis veya database-backed store önerilir
- Session ID: Güvenli random token (32+ karakter)

### Güvenlik Best Practices

1. **Password Hashing**: Mock auth için şifre düz metin olabilir, gerçek implementasyonda bcrypt kullanılmalı
2. **Rate Limiting**: Login endpoint'ine rate limiting eklenmeli
3. **CSRF Protection**: SameSite cookie ile temel koruma sağlanır
4. **Session Expiry**: Otomatik session timeout uygulanmalı
5. **Secure Headers**: `X-Content-Type-Options`, `X-Frame-Options` header'ları eklenmeli

