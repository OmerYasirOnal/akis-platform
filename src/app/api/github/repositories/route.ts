/**
 * GitHub Repositories API
 * GET /api/github/repositories
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthStorage } from '@/lib/auth/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // User ID'yi query'den al (production'da session'dan gelecek)
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // GitHub integration'ı al
    const integrations = AuthStorage.getIntegrations(userId);
    const githubIntegration = integrations.find(int => int.provider === 'github' && int.connected);

    if (!githubIntegration || !githubIntegration.accessToken) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 401 }
      );
    }

    // GitHub API'den repository listesini al
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
      headers: {
        'Authorization': `Bearer ${githubIntegration.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const repos = await response.json();

    // Sadece gerekli bilgileri döndür
    const repoList = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      updated_at: repo.updated_at,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
    }));

    return NextResponse.json({ repositories: repoList });

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

