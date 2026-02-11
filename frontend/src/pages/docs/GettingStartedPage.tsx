import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';
import { DocsReferenceList } from '../../components/common/DocsReferenceList';

export default function GettingStartedPage() {
  const { t } = useI18n();
  const tx = (key: string) => t(key as never);

  return (
    <div>
      <h1>{tx('docs.gettingStarted.heroTitle')}</h1>
      <p className="lead">{tx('docs.gettingStarted.description')}</p>

      <h2>{tx('docs.gettingStarted.prerequisites')}</h2>
      <ul>
        <li>Node.js 20.x or later</li>
        <li>pnpm 8.x or later</li>
        <li>Docker and Docker Compose</li>
        <li>Git</li>
        <li>A GitHub account</li>
      </ul>

      <h2>{tx('docs.gettingStarted.step1')}</h2>
      <pre><code className="language-bash">{`git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents`}</code></pre>

      <h2>{tx('docs.gettingStarted.step2')}</h2>
      <pre><code className="language-bash">{`pnpm install`}</code></pre>

      <h2>{tx('docs.gettingStarted.step3')}</h2>
      <pre><code className="language-bash">{`cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env`}</code></pre>

      <pre><code className="language-bash">{`# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
AUTH_JWT_SECRET=your-32-character-secret-here
AI_KEY_ENCRYPTION_KEY=your-32-character-key-here

# Optional: AI Provider (default: mock)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-your-openrouter-key`}</code></pre>

      <h2>{tx('docs.gettingStarted.step4')}</h2>
      <pre><code className="language-bash">{`docker compose up -d postgres`}</code></pre>
      <pre><code className="language-bash">{`pnpm -C backend db:migrate`}</code></pre>

      <pre><code className="language-bash">{`# Backend
pnpm -C backend dev

# Frontend
pnpm -C frontend dev`}</code></pre>

      <h2>Step 7: Create an Account</h2>
      <ol>
        <li>Navigate to <Link to="/signup">/signup</Link></li>
        <li>Enter your email and create a password</li>
        <li>Complete the onboarding flow</li>
      </ol>

      <h2>Step 8: Connect GitHub</h2>
      <ol>
        <li>Go to <Link to="/dashboard/integrations">Dashboard → Integrations</Link></li>
        <li>Click &quot;Connect&quot; on the GitHub card</li>
        <li>Authorize AKIS to access your repositories</li>
      </ol>

      <h2>Step 9: Run Your First Agent Job</h2>
      <ol>
        <li>Go to <Link to="/dashboard/agents">Dashboard → Agents</Link></li>
        <li>Select the <strong>Scribe</strong> agent</li>
        <li>Choose a repository and branch</li>
        <li>Click &quot;Run Agent&quot;</li>
      </ol>

      <div className="not-prose mt-8 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <h3 className="text-lg font-semibold text-green-400">{tx('docs.gettingStarted.congrats')}</h3>
      </div>

      <DocsReferenceList
        title={tx('docs.gettingStarted.nextSteps')}
        items={[
          { label: 'Scribe Agent', href: '/docs/agents/scribe' },
          { label: tx('docs.restApi.aiKeysStatus'), href: '/docs/security/api-keys' },
          { label: tx('docs.integrations.title'), href: '/docs/integrations/atlassian' },
        ]}
      />
    </div>
  );
}
