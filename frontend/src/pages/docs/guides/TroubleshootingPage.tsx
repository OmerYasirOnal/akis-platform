/**
 * Troubleshooting Guide
 */
import { Link } from 'react-router-dom';

export default function TroubleshootingPage() {
  return (
    <div>
      <h1>Troubleshooting</h1>
      
      <p className="lead">
        Common issues and solutions when using AKIS. If you don&apos;t find your answer here, check our GitHub discussions.
      </p>

      <h2>Authentication Issues</h2>
      <h3>&quot;Unauthorized&quot; errors</h3>
      <ul>
        <li>Your session may have expired - try logging in again</li>
        <li>Clear your browser cookies and retry</li>
        <li>Ensure the backend server is running</li>
      </ul>

      <h3>OAuth callback fails</h3>
      <ul>
        <li>Verify the callback URL in GitHub OAuth App settings matches your backend URL</li>
        <li>For local dev, use <code>http://localhost:3000/api/integrations/github/oauth/callback</code></li>
        <li>Ensure your browser allows redirects</li>
      </ul>

      <h2>Integration Issues</h2>
      <h3>GitHub not showing repositories</h3>
      <ul>
        <li>Check that you granted access to the correct organization</li>
        <li>Verify you have at least read access to the repos</li>
        <li>Try disconnecting and reconnecting GitHub</li>
      </ul>

      <h3>Jira/Confluence connection fails</h3>
      <ul>
        <li>Verify your site URL is correct (e.g., your-domain.atlassian.net)</li>
        <li>Ensure your API token is valid and not expired</li>
        <li>Check that your Atlassian account has the required permissions</li>
      </ul>

      <h2>Agent Job Issues</h2>
      <h3>Job stuck in &quot;pending&quot;</h3>
      <ul>
        <li>Check that the backend server is running</li>
        <li>Verify your AI key is configured in Settings → AI Keys</li>
        <li>Check backend logs for errors</li>
      </ul>

      <h3>Job failed with AI error</h3>
      <ul>
        <li>Verify your AI API key is valid</li>
        <li>Check if you&apos;ve exceeded rate limits</li>
        <li>Try switching to a different AI provider</li>
      </ul>

      <h3>Job failed with GitHub error</h3>
      <ul>
        <li>Ensure GitHub is still connected (check Integrations page)</li>
        <li>Verify you have write access to the repository</li>
        <li>Check if the branch already exists</li>
      </ul>

      <h2>UI Issues</h2>
      <h3>&quot;Unexpected token&quot; JSON error</h3>
      <ul>
        <li>This usually means the API returned HTML instead of JSON</li>
        <li>Check that the backend server is running on port 3000</li>
        <li>Verify the Vite proxy is configured correctly</li>
      </ul>

      <h3>Page not loading</h3>
      <ul>
        <li>Clear your browser cache</li>
        <li>Check the browser console for errors</li>
        <li>Verify both frontend and backend servers are running</li>
      </ul>

      <h2>Database Issues</h2>
      <h3>Migration errors</h3>
      <ul>
        <li>Ensure PostgreSQL is running: <code>docker compose up -d postgres</code></li>
        <li>Check DATABASE_URL in .env matches your database</li>
        <li>Run migrations: <code>pnpm -C backend db:migrate</code></li>
      </ul>

      <h2>Getting Help</h2>
      <ul>
        <li><a href="https://github.com/OmerYasirOnal/akis-platform-devolopment/discussions" target="_blank" rel="noopener noreferrer">GitHub Discussions</a> - Community support</li>
        <li><a href="https://github.com/OmerYasirOnal/akis-platform-devolopment/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> - Bug reports</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><Link to="/docs/guides/best-practices">Best Practices</Link></li>
        <li><Link to="/docs/getting-started">Quick Start</Link></li>
        <li><Link to="/docs/guides/self-hosting">Self-Hosting</Link></li>
      </ul>
    </div>
  );
}
