/**
 * GitHub App Install Info API
 * GET /api/github/app/install-info
 * 
 * Returns:
 * - Installation URL for installing the GitHub App
 * - App metadata (ID, slug, name)
 * - Installation status (whether app is installed)
 */

import { NextResponse } from 'next/server';
import { logger } from "@/shared/lib/utils/logger";

export const runtime = 'nodejs';

export async function GET() {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    logger.info('InstallInfoAPI', `[${requestId}] Fetching GitHub App install info`);

    // Get GitHub App configuration from env
    const appId = process.env.GITHUB_APP_ID;
    const appSlug = process.env.GITHUB_APP_SLUG;
    const appName = process.env.GITHUB_APP_NAME || 'AKIS Scribe Agent';
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

    // Check if app is configured
    if (!appId) {
      logger.warn('InstallInfoAPI', `[${requestId}] ⚠️ GitHub App not configured`);
      
      return NextResponse.json({
        ok: true,
        configured: false,
        message: 'GitHub App is not configured. Set GITHUB_APP_ID and other variables in .env.local',
        requestId,
      });
    }

    // Build installation URL
    let appInstallUrl: string;
    
    if (appSlug) {
      // Preferred: use app slug for cleaner URL
      appInstallUrl = `https://github.com/apps/${appSlug}/installations/new`;
    } else {
      // Fallback: use app ID
      appInstallUrl = `https://github.com/apps/app-${appId}/installations/new`;
    }

    // Check if installation exists (basic check via env var)
    const isInstalled = !!installationId;

    logger.info('InstallInfoAPI', `[${requestId}] ✅ App configured (installed: ${isInstalled})`);

    return NextResponse.json({
      ok: true,
      configured: true,
      isInstalled,
      app: {
        id: appId,
        slug: appSlug || null,
        name: appName,
      },
      installUrl: appInstallUrl,
      requiredPermissions: [
        'Contents: Read & Write',
        'Metadata: Read',
        'Pull Requests: Read & Write',
      ],
      requestId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('InstallInfoAPI', `[${requestId}] ❌ Exception: ${errorMessage}`);
    
    return NextResponse.json(
      { 
        ok: false, 
        error: errorMessage,
        requestId,
      },
      { status: 500 }
    );
  }
}

