# 🔐 Authentication & Integration System

## Genel Bakış

DevAgents, her kullanıcının kendi hesabı ve entegrasyonları olan dinamik bir auth sistemi kullanır.

## Mimari

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       ├─ Login/Register
       │
       v
┌─────────────────┐
│  AuthContext    │ ← Global State (React Context)
│  (Client-Side)  │
└────────┬────────┘
         │
         ├─ User State
         ├─ Integrations
         └─ Auth Methods
         
         v
┌──────────────────┐
│  AuthStorage     │ ← LocalStorage (Geçici)
│  (Client-Side)   │   Production'da Database
└──────────────────┘
```

## Akış Diyagramı

### 1. Login Akışı

```
User → Login Page → AuthContext.login()
                          ↓
                    Validate Credentials
                          ↓
                    AuthStorage.setUser()
                          ↓
                    Redirect to Dashboard
```

### 2. GitHub Integration Akışı

```
User → Profile Page → Click "GitHub'ı Bağla"
                            ↓
              POST /api/integrations/github/connect
                            ↓
                  Generate OAuth URL (with userId in state)
                            ↓
                  Redirect to GitHub OAuth
                            ↓
              User authorizes on GitHub
                            ↓
        GitHub redirects to /api/integrations/github/callback
                            ↓
          Exchange code for access token
                            ↓
            Get GitHub user info
                            ↓
      Save integration (cookie + localStorage)
                            ↓
          Redirect to /profile?github_connected=success
                            ↓
            AuthContext refreshes integrations
                            ↓
                  Integration Active ✓
```

## Dosya Yapısı

```
src/
├── lib/auth/
│   ├── types.ts           # User, UserIntegration types
│   └── storage.ts         # LocalStorage operations
│
├── contexts/
│   └── AuthContext.tsx    # Global auth state (React Context)
│
├── app/
│   ├── login/page.tsx     # Login sayfası
│   ├── register/page.tsx  # Kayıt sayfası
│   ├── profile/page.tsx   # Profil & entegrasyonlar
│   ├── dashboard/page.tsx # Ana dashboard (protected)
│   │
│   └── api/integrations/
│       └── github/
│           ├── connect/route.ts    # OAuth init
│           ├── callback/route.ts   # OAuth callback
│           └── disconnect/route.ts # Disconnect
│
└── components/integrations/
    └── GitHubIntegration.tsx # GitHub integration UI
```

## API Endpoints

### Authentication

**Login (Client-Side Only)**
```typescript
// AuthContext.login(email, password)
// LocalStorage'da tutuluyor
```

### GitHub Integration

**POST /api/integrations/github/connect**
```json
Request:
{
  "userId": "user-123"
}

Response:
{
  "success": true,
  "authUrl": "https://github.com/login/oauth/authorize?..."
}
```

**GET /api/integrations/github/callback**
```
Query Params:
- code: GitHub authorization code
- state: Base64 encoded { userId }

Response:
- Redirect to /profile?github_connected=success
- Sets cookie: github_integration
```

**POST /api/integrations/github/disconnect**
```json
Request:
{
  "userId": "user-123"
}

Response:
{
  "success": true
}
```

## Data Models

### User
```typescript
{
  id: string;              // "user-123"
  email: string;           // "user@example.com"
  name: string;            // "John Doe"
  createdAt: Date;
}
```

### UserIntegration
```typescript
{
  userId: string;          // "user-123"
  provider: 'github' | 'jira' | 'confluence';
  connected: boolean;
  accessToken?: string;    // OAuth token
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: {             // Provider-specific data
    id: number;
    login: string;
    name: string;
    avatar_url: string;
    email: string;
  };
  connectedAt?: Date;
}
```

## LocalStorage Keys

```
devagents_user          → User object
devagents_integrations  → Array of UserIntegration
```

## Protected Routes

Dashboard ve Profile route'ları protected:

```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.push('/login');
  }
}, [isAuthenticated, router]);
```

## Demo Credentials

```
Email: demo@devagents.com
Password: demo123
```

## GitHub OAuth Setup

1. **GitHub Developer Settings'e git:**
   https://github.com/settings/developers

2. **"New OAuth App" oluştur:**
   - Application name: `DevAgents Local`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/integrations/github/callback`

3. **Client ID ve Secret'ı .env.local'e ekle:**
```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

## Production'a Geçiş

Şu an LocalStorage kullanıyoruz. Production'da yapılması gerekenler:

### 1. Database Ekle (Supabase/Prisma)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integrations table
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL,
  connected BOOLEAN DEFAULT TRUE,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  metadata JSONB,
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### 2. API Endpoints Güncelle

```typescript
// Login API
POST /api/auth/login
- Validate credentials from database
- Return JWT token
- Set HttpOnly cookie

// Integration API
POST /api/integrations/github/callback
- Save to database instead of localStorage
- Associate with user session
```

### 3. Session Management

```typescript
// NextAuth.js veya JWT kullan
- Secure session management
- Token refresh logic
- Logout handling
```

## Security Considerations

### Current (Dev)
- ⚠️ LocalStorage (XSS vulnerable)
- ⚠️ No password hashing
- ⚠️ No CSRF protection

### Production
- ✅ HttpOnly cookies
- ✅ Password hashing (bcrypt)
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ Secure session management
- ✅ Token encryption

## Kullanım

### AuthContext Hook

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    user,                      // Current user
    isAuthenticated,           // Boolean
    integrations,              // Array of integrations
    login,                     // (email, password) => Promise<boolean>
    logout,                    // () => void
    register,                  // (email, password, name) => Promise<boolean>
    addIntegration,            // (integration) => void
    removeIntegration,         // (provider) => void
    refreshIntegrations,       // () => void
  } = useAuth();
  
  // Use it...
}
```

### Check Integration Status

```typescript
const githubIntegration = integrations.find(int => int.provider === 'github');
const isGitHubConnected = githubIntegration?.connected || false;

if (isGitHubConnected) {
  // GitHub is connected
  const githubUser = githubIntegration.metadata;
  console.log(githubUser.login); // GitHub username
}
```

## Yeni Entegrasyon Ekleme

### 1. API Endpoints Oluştur

```typescript
// src/app/api/integrations/jira/connect/route.ts
// src/app/api/integrations/jira/callback/route.ts
// src/app/api/integrations/jira/disconnect/route.ts
```

### 2. UI Component Oluştur

```typescript
// src/components/integrations/JiraIntegration.tsx
export function JiraIntegration() {
  const { integrations, addIntegration, removeIntegration } = useAuth();
  // ... implementation
}
```

### 3. Profile'a Ekle

```typescript
// src/app/profile/page.tsx
import { JiraIntegration } from '@/components/integrations/JiraIntegration';

<JiraIntegration />
```

## Testing

```bash
# 1. Start dev server
npm run dev

# 2. Login
- Go to http://localhost:3000/login
- Use demo credentials

# 3. Test GitHub Integration
- Go to Profile
- Click "GitHub'ı Bağla"
- Authorize on GitHub
- Check integration status
```

---

**Not:** Bu sistem development için tasarlandı. Production'da mutlaka database, güvenli session management ve proper authentication sistemi kullanın!

