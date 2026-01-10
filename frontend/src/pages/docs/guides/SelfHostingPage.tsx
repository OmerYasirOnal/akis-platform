/**
 * Self-Hosting Guide
 */
import { Link } from 'react-router-dom';

export default function SelfHostingPage() {
  return (
    <div>
      <h1>Self-Hosting AKIS</h1>
      
      <p className="lead">
        AKIS is designed to be self-hosted. This guide covers deploying AKIS on your own infrastructure.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Docker and Docker Compose</li>
        <li>PostgreSQL 15+</li>
        <li>Node.js 20+ (for development)</li>
        <li>2GB RAM minimum, 4GB recommended</li>
        <li>10GB disk space</li>
      </ul>

      <h2>Quick Deploy with Docker Compose</h2>
      <pre><code className="language-bash">{`# Clone the repository
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure environment (edit .env files)
# At minimum, set:
# - DATABASE_URL
# - AUTH_JWT_SECRET
# - AI_KEY_ENCRYPTION_KEY

# Start with Docker Compose
docker compose up -d`}</code></pre>

      <h2>Environment Configuration</h2>
      <h3>Required Variables</h3>
      <pre><code>{`# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/akis

# Security (generate with: openssl rand -hex 32)
AUTH_JWT_SECRET=your-32-char-secret
AI_KEY_ENCRYPTION_KEY=your-32-char-key

# URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com`}</code></pre>

      <h3>Optional Variables</h3>
      <pre><code>{`# AI Provider (default: mock)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-...

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_CALLBACK_URL=https://api.your-domain.com/api/integrations/github/oauth/callback

# Email (for verification)
EMAIL_PROVIDER=resend
RESEND_API_KEY=...`}</code></pre>

      <h2>Production Considerations</h2>
      <ul>
        <li><strong>HTTPS</strong> - Use a reverse proxy (nginx, Caddy) with SSL</li>
        <li><strong>Database</strong> - Use a managed PostgreSQL service for reliability</li>
        <li><strong>Backups</strong> - Set up regular database backups</li>
        <li><strong>Monitoring</strong> - Use Prometheus/Grafana for metrics</li>
        <li><strong>Rate Limiting</strong> - Configure appropriate limits in production</li>
      </ul>

      <h2>Scaling</h2>
      <p>
        AKIS is designed as a modular monolith optimized for single-node deployment. For higher load:
      </p>
      <ul>
        <li>Scale vertically (more RAM/CPU) first</li>
        <li>Use a connection pooler (PgBouncer) for database</li>
        <li>Consider read replicas for analytics queries</li>
      </ul>

      <h2>Updating</h2>
      <pre><code className="language-bash">{`# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose build
docker compose up -d

# Run migrations
docker compose exec backend pnpm db:migrate`}</code></pre>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/getting-started">Quick Start</Link></li>
        <li><Link to="/docs/security/api-keys">API Key Security</Link></li>
        <li><Link to="/docs/guides/troubleshooting">Troubleshooting</Link></li>
      </ul>
    </div>
  );
}
