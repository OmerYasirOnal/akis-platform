/**
 * AKIS Scribe Diagnostic Utility
 * Evidence-based debugging for PR creation and docs generation failures
 */

import { logger } from './logger';

export interface GitHubDiagnostic {
  timestamp: string;
  operation: string;
  endpoint: string;
  method: string;
  status: number;
  headers?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  evidence: string;
}

export class ScribeDiagnostics {
  private diagnostics: GitHubDiagnostic[] = [];

  /**
   * Record a GitHub API call with full details
   */
  record(diagnostic: Omit<GitHubDiagnostic, 'timestamp'>) {
    const record: GitHubDiagnostic = {
      ...diagnostic,
      timestamp: new Date().toISOString(),
    };
    
    this.diagnostics.push(record);
    
    // Mirror to server logs
    logger.info('Diagnostic', `[${diagnostic.operation}] ${diagnostic.method} ${diagnostic.endpoint} → ${diagnostic.status}`, {
      headers: diagnostic.headers,
      evidence: diagnostic.evidence,
    });
  }

  /**
   * Check token scopes
   */
  async checkTokenScopes(token: string): Promise<{
    valid: boolean;
    scopes: string[];
    user?: string;
    message?: string;
  }> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const scopes = response.headers.get('x-oauth-scopes')?.split(',').map(s => s.trim()) || [];
      const data = await response.json();

      this.record({
        operation: 'check_token_scopes',
        endpoint: '/user',
        method: 'GET',
        status: response.status,
        headers: { 'x-oauth-scopes': scopes.join(', ') },
        responseBody: { login: data.login },
        evidence: `Token scopes: ${scopes.join(', ')}`,
      });

      const hasRepo = scopes.includes('repo');
      
      return {
        valid: response.ok && hasRepo,
        scopes,
        user: data.login,
        message: !hasRepo ? 'Missing "repo" scope - required for private repositories' : undefined,
      };
    } catch (error: any) {
      this.record({
        operation: 'check_token_scopes',
        endpoint: '/user',
        method: 'GET',
        status: 0,
        evidence: `Error: ${error.message}`,
      });
      
      return {
        valid: false,
        scopes: [],
        message: error.message,
      };
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(token: string): Promise<{
    remaining: number;
    limit: number;
    reset: string;
  }> {
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const data = await response.json();
      const core = data.resources.core;

      this.record({
        operation: 'check_rate_limit',
        endpoint: '/rate_limit',
        method: 'GET',
        status: response.status,
        responseBody: core,
        evidence: `Rate limit: ${core.remaining}/${core.limit}`,
      });

      return {
        remaining: core.remaining,
        limit: core.limit,
        reset: new Date(core.reset * 1000).toISOString(),
      };
    } catch (error: any) {
      return {
        remaining: 0,
        limit: 0,
        reset: 'unknown',
      };
    }
  }

  /**
   * Check if branch exists
   */
  async checkBranchExists(
    owner: string,
    repo: string,
    branch: string,
    token: string
  ): Promise<{ exists: boolean; sha?: string; error?: string }> {
    try {
      const endpoint = `/repos/${owner}/${repo}/git/refs/heads/${branch}`;
      const response = await fetch(`https://api.github.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const data = response.ok ? await response.json() : null;

      this.record({
        operation: 'check_branch_exists',
        endpoint,
        method: 'GET',
        status: response.status,
        responseBody: data,
        evidence: response.ok
          ? `Branch "${branch}" exists, SHA: ${data.object.sha}`
          : `Branch "${branch}" not found (${response.status})`,
      });

      return {
        exists: response.ok,
        sha: data?.object?.sha,
        error: !response.ok ? `Status ${response.status}` : undefined,
      };
    } catch (error: any) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * Check if PR already exists
   */
  async checkExistingPR(
    owner: string,
    repo: string,
    head: string,
    base: string,
    token: string
  ): Promise<{ exists: boolean; prUrl?: string; prNumber?: number }> {
    try {
      const endpoint = `/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${head}&base=${base}`;
      const response = await fetch(`https://api.github.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const data = await response.json();

      this.record({
        operation: 'check_existing_pr',
        endpoint,
        method: 'GET',
        status: response.status,
        responseBody: data,
        evidence: Array.isArray(data) && data.length > 0
          ? `Existing PR found: #${data[0].number}`
          : 'No existing PR',
      });

      if (Array.isArray(data) && data.length > 0) {
        return {
          exists: true,
          prUrl: data[0].html_url,
          prNumber: data[0].number,
        };
      }

      return { exists: false };
    } catch (error: any) {
      return { exists: false };
    }
  }

  /**
   * Diagnose PR creation failure
   */
  async diagnosePRFailure(
    owner: string,
    repo: string,
    head: string,
    base: string,
    token: string,
    prRequestBody: any,
    errorResponse: any
  ): Promise<{
    rootCauses: string[];
    nextActions: string[];
  }> {
    const rootCauses: string[] = [];
    const nextActions: string[] = [];

    // Check token
    const tokenCheck = await this.checkTokenScopes(token);
    if (!tokenCheck.valid) {
      rootCauses.push(`Token issue: ${tokenCheck.message || 'Invalid token'}`);
      nextActions.push('Fix: Regenerate GitHub token with "repo" scope');
    }

    // Check rate limit
    const rateLimit = await this.checkRateLimit(token);
    if (rateLimit.remaining === 0) {
      rootCauses.push(`Rate limit exceeded: 0/${rateLimit.limit}, resets at ${rateLimit.reset}`);
      nextActions.push(`Wait until ${rateLimit.reset} or use a different token`);
    }

    // Check branch
    const branchCheck = await this.checkBranchExists(owner, repo, head, token);
    if (!branchCheck.exists) {
      rootCauses.push(`Head branch "${head}" does not exist`);
      nextActions.push(`Create branch "${head}" before opening PR`);
    }

    // Check existing PR
    const existingPR = await this.checkExistingPR(owner, repo, head, base, token);
    if (existingPR.exists) {
      rootCauses.push(`PR already exists: ${existingPR.prUrl}`);
      nextActions.push(`Return existing PR URL as success: ${existingPR.prUrl}`);
    }

    // Analyze error response
    if (errorResponse) {
      this.record({
        operation: 'pr_creation_failure',
        endpoint: `/repos/${owner}/${repo}/pulls`,
        method: 'POST',
        status: errorResponse.status || 0,
        requestBody: { ...prRequestBody, token: '***' },
        responseBody: errorResponse,
        evidence: `PR creation failed: ${JSON.stringify(errorResponse).substring(0, 200)}`,
      });

      if (errorResponse.message?.includes('No commits')) {
        rootCauses.push('Zero-diff: Branch has no commits different from base');
        nextActions.push('Add a harmless change (e.g., timestamp) and commit again');
      }

      if (errorResponse.errors) {
        errorResponse.errors.forEach((err: any) => {
          rootCauses.push(`GitHub validation: ${err.message || err}`);
        });
      }
    }

    return { rootCauses, nextActions };
  }

  /**
   * Generate diagnostic report
   */
  generateReport(): string {
    let report = '# AKIS Scribe Diagnostic Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## API Calls (${this.diagnostics.length})\n\n`;

    this.diagnostics.forEach((d, i) => {
      report += `### ${i + 1}. ${d.operation}\n`;
      report += `- **Endpoint:** ${d.method} ${d.endpoint}\n`;
      report += `- **Status:** ${d.status}\n`;
      report += `- **Evidence:** ${d.evidence}\n`;
      if (d.headers) {
        report += `- **Headers:** ${JSON.stringify(d.headers, null, 2)}\n`;
      }
      report += '\n';
    });

    return report;
  }

  /**
   * Get all diagnostics
   */
  getAll(): GitHubDiagnostic[] {
    return this.diagnostics;
  }

  /**
   * Clear diagnostics
   */
  clear() {
    this.diagnostics = [];
  }
}

// Singleton
export const scribeDiagnostics = new ScribeDiagnostics();

