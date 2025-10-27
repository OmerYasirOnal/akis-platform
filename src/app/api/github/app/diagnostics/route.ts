import "server-only";
import { NextRequest, NextResponse } from 'next/server';
import { getInstallationToken } from '@/lib/auth/github-app';

/**
 * GitHub App Diagnostics Endpoint
 * 
 * Returns installation info, permissions, and actionable CTAs
 * Used by UI to show:
 * - Installation status
 * - Permission gaps
 * - Correct "Install to more repos" URL
 * - Repository coverage
 */

export interface DiagnosticsResponse {
  installed: boolean;
  appSlug?: string;
  installationId?: number;
  account?: {
    type: 'User' | 'Organization';
    login: string;
  };
  htmlUrl?: string;
  repositorySelection?: 'all' | 'selected';
  repositoryCount?: number;
  tokenPermissions?: Record<string, string>;
  requiredPermissions: Record<string, string>;
  missing: string[];
  error?: string;
}

const REQUIRED_PERMISSIONS: Record<string, string> = {
  'metadata': 'read',
  'contents': 'write',
  'pull_requests': 'write',
};

const OPTIONAL_PERMISSIONS: Record<string, string> = {
  'issues': 'write',
};

export async function GET(req: NextRequest) {
  try {
    const appId = process.env.GITHUB_APP_ID;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY_PEM;
    const appSlug = process.env.GITHUB_APP_SLUG || 'akis-scribe';

    // Check if GitHub App is configured
    if (!appId || !installationId || !privateKeyPem) {
      return NextResponse.json({
        installed: false,
        requiredPermissions: REQUIRED_PERMISSIONS,
        missing: Object.keys(REQUIRED_PERMISSIONS).map(k => `${k}:${REQUIRED_PERMISSIONS[k]}`),
        error: 'GitHub App not configured. Set GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY_PEM in environment.',
      } as DiagnosticsResponse);
    }

    // Get installation token (includes permissions)
    const normalizedKey = privateKeyPem.replace(/\\n/g, '\n');
    const tokenResult = await getInstallationToken(appId, installationId, normalizedKey);

    if ('error' in tokenResult) {
      return NextResponse.json({
        installed: false,
        appSlug,
        installationId: parseInt(installationId, 10),
        requiredPermissions: REQUIRED_PERMISSIONS,
        missing: Object.keys(REQUIRED_PERMISSIONS).map(k => `${k}:${REQUIRED_PERMISSIONS[k]}`),
        error: `Failed to get installation token: ${tokenResult.error}`,
      } as DiagnosticsResponse, { status: 500 });
    }

    // Fetch installation info from GitHub API
    const installationResponse = await fetch(
      `https://api.github.com/app/installations/${installationId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!installationResponse.ok) {
      const error = await installationResponse.json();
      return NextResponse.json({
        installed: false,
        appSlug,
        installationId: parseInt(installationId, 10),
        requiredPermissions: REQUIRED_PERMISSIONS,
        missing: Object.keys(REQUIRED_PERMISSIONS).map(k => `${k}:${REQUIRED_PERMISSIONS[k]}`),
        error: `Failed to fetch installation info: ${error.message || 'Unknown error'}`,
      } as DiagnosticsResponse, { status: 500 });
    }

    const installationData = await installationResponse.json();

    // Get token permissions from access token
    const permissionsResponse = await fetch(
      `https://api.github.com/installation/repositories`,
      {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    let repositoryCount = 0;
    if (permissionsResponse.ok) {
      const reposData = await permissionsResponse.json();
      repositoryCount = reposData.total_count || 0;
    }

    // Extract permissions from installation data
    const tokenPermissions: Record<string, string> = {};
    if (installationData.permissions) {
      Object.keys(installationData.permissions).forEach(key => {
        tokenPermissions[key] = installationData.permissions[key];
      });
    }

    // Calculate missing permissions
    const missing: string[] = [];
    Object.entries(REQUIRED_PERMISSIONS).forEach(([key, value]) => {
      const actualValue = tokenPermissions[key];
      if (!actualValue) {
        missing.push(`${key}:${value}`);
      } else if (value === 'write' && actualValue !== 'write') {
        missing.push(`${key}:${value} (current: ${actualValue})`);
      }
    });

    // Build response
    const response: DiagnosticsResponse = {
      installed: true,
      appSlug,
      installationId: parseInt(installationId, 10),
      account: {
        type: installationData.account.type,
        login: installationData.account.login,
      },
      htmlUrl: installationData.html_url,
      repositorySelection: installationData.repository_selection,
      repositoryCount,
      tokenPermissions,
      requiredPermissions: REQUIRED_PERMISSIONS,
      missing,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Diagnostics] Unexpected error:', error);
    return NextResponse.json({
      installed: false,
      requiredPermissions: REQUIRED_PERMISSIONS,
      missing: Object.keys(REQUIRED_PERMISSIONS).map(k => `${k}:${REQUIRED_PERMISSIONS[k]}`),
      error: `Unexpected error: ${error.message}`,
    } as DiagnosticsResponse, { status: 500 });
  }
}

