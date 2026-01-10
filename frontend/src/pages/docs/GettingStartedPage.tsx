/**
 * Getting Started - Quick Start Guide
 */
import { Link } from 'react-router-dom';

export default function GettingStartedPage() {
  return (
    <div>
      <h1>Quick Start Guide</h1>
      
      <p className="lead">
        Get AKIS up and running in under 10 minutes. This guide covers local development setup and running your first agent job.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 20.x or later</li>
        <li>pnpm 8.x or later</li>
        <li>Docker and Docker Compose</li>
        <li>Git</li>
        <li>A GitHub account</li>
      </ul>

      <h2>Step 1: Clone the Repository</h2>
      <pre><code className="language-bash">{`git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents`}</code></pre>

      <h2>Step 2: Install Dependencies</h2>
      <pre><code className="language-bash">{`pnpm install`}</code></pre>

      <h2>Step 3: Set Up Environment</h2>
      <p>Copy the example environment files:</p>
      <pre><code className="language-bash">{`cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env`}</code></pre>

      <p>Edit <code>backend/.env</code> and set the required variables:</p>
      <pre><code className="language-bash">{`# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
AUTH_JWT_SECRET=your-32-character-secret-here
AI_KEY_ENCRYPTION_KEY=your-32-character-key-here

# Optional: AI Provider (default: mock)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-your-openrouter-key`}</code></pre>

      <h2>Step 4: Start the Database</h2>
      <pre><code className="language-bash">{`docker compose up -d postgres`}</code></pre>

      <h2>Step 5: Run Migrations</h2>
      <pre><code className="language-bash">{`pnpm -C backend db:migrate`}</code></pre>

      <h2>Step 6: Start the Development Servers</h2>
      <pre><code className="language-bash">{`# In one terminal - Backend
pnpm -C backend dev

# In another terminal - Frontend
pnpm -C frontend dev`}</code></pre>

      <p>The application is now running:</p>
      <ul>
        <li><strong>Frontend:</strong> <a href="http://localhost:5173">http://localhost:5173</a></li>
        <li><strong>Backend API:</strong> <a href="http://localhost:3000">http://localhost:3000</a></li>
        <li><strong>API Docs:</strong> <a href="http://localhost:3000/docs">http://localhost:3000/docs</a></li>
      </ul>

      <h2>Step 7: Create an Account</h2>
      <ol>
        <li>Navigate to <a href="http://localhost:5173/signup">http://localhost:5173/signup</a></li>
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
        <li>Watch the job progress in real-time!</li>
      </ol>

      <div className="not-prose mt-8 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <h3 className="text-lg font-semibold text-green-400">🎉 Congratulations!</h3>
        <p className="mt-2 text-ak-text-secondary">
          You&apos;ve successfully set up AKIS and run your first agent job. Explore the documentation to learn more about each agent&apos;s capabilities.
        </p>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link to="/docs/agents/scribe">Learn about Scribe</Link> - Auto-generate documentation</li>
        <li><Link to="/docs/security/api-keys">Configure AI Keys</Link> - Use your own API keys</li>
        <li><Link to="/docs/integrations/atlassian">Connect Atlassian</Link> - Jira and Confluence integration</li>
      </ul>
    </div>
  );
}
