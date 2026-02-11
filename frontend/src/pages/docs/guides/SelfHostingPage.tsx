import { useI18n } from '../../../i18n/useI18n';
import { DocsReferenceList } from '../../../components/common/DocsReferenceList';

export default function SelfHostingPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.selfHosting.title')}</h1>
      <p className="lead">{tx('docs.selfHosting.lead')}</p>

      <h2>{tx('docs.selfHosting.requirements')}</h2>
      <ul>
        <li>Docker and Docker Compose</li>
        <li>PostgreSQL 15+</li>
        <li>Node.js 20+ (for development)</li>
        <li>2GB RAM minimum, 4GB recommended</li>
        <li>10GB disk space</li>
      </ul>

      <h2>{tx('docs.selfHosting.quickDeploy')}</h2>
      <pre><code className="language-bash">{`git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d`}</code></pre>

      <h2>{tx('docs.selfHosting.envConfig')}</h2>
      <p>Edit <code>backend/.env</code> with your environment values:</p>
      <pre><code className="language-bash">{`# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/akis

# Security (generate with: openssl rand -hex 32)
AUTH_JWT_SECRET=your-32-char-secret
AI_KEY_ENCRYPTION_KEY=your-32-char-key

# URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com`}</code></pre>

      <h2>{tx('docs.selfHosting.production')}</h2>
      <ul>
        <li><strong>HTTPS</strong> - Use a reverse proxy (nginx, Caddy) with SSL</li>
        <li><strong>Database</strong> - Use a managed PostgreSQL service for reliability</li>
        <li><strong>Backups</strong> - Set up regular database backups</li>
        <li><strong>Monitoring</strong> - Use Prometheus/Grafana for metrics</li>
        <li><strong>Rate Limiting</strong> - Configure appropriate limits in production</li>
      </ul>

      <h2>{tx('docs.selfHosting.scaling')}</h2>
      <ul>
        <li>Scale vertically (more RAM/CPU) first</li>
        <li>Use a connection pooler (PgBouncer) for database</li>
        <li>Consider read replicas for analytics queries</li>
      </ul>

      <h2>{tx('docs.selfHosting.updating')}</h2>
      <pre><code className="language-bash">{`git pull origin main
docker compose build
docker compose up -d
docker compose exec backend pnpm db:migrate`}</code></pre>

      <DocsReferenceList
        title={tx('docs.section.related')}
        items={[
          { label: tx('docs.gettingStarted.title'), href: '/docs/getting-started' },
          { label: tx('docs.apiKeys.title'), href: '/docs/security/api-keys' },
          { label: tx('docs.troubleshooting.title'), href: '/docs/guides/troubleshooting' },
        ]}
      />
    </div>
  );
}
