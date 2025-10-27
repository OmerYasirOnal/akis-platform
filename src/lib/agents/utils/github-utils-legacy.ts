/**
 * GitHub API Utilities
 * Helper functions for GitHub repository analysis
 */

import { GitHubFileContent, GitHubTreeItem } from '../documentation-agent-types';

/**
 * Parse GitHub repository URL
 */
export function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  };
}

/**
 * Fetch file content from GitHub
 * HOTFIX: Silent fail on 404, only log actual errors
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main',
  token?: string
): Promise<GitHubFileContent | null> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );

    if (!response.ok) {
      // HOTFIX: Silent fail on 404 (file not found is expected)
      if (response.status === 404) return null;
      
      // Log other errors
      console.error(`[fetchFileContent] Error fetching ${path}: ${response.status}`);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      path: data.path,
      content: data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : '',
      sha: data.sha,
      size: data.size,
    };
  } catch (error) {
    // HOTFIX: Only log non-404 errors
    if (error instanceof Error && !error.message.includes('404')) {
      console.error(`[fetchFileContent] Exception fetching ${path}:`, error);
    }
    return null;
  }
}

/**
 * Fetch repository tree (file list)
 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string = 'main',
  token?: string,
  recursive: boolean = true
): Promise<GitHubTreeItem[]> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Get branch SHA
    const branchResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers }
    );
    
    if (!branchResponse.ok) {
      throw new Error(`Branch ${branch} not found`);
    }
    
    const branchData = await branchResponse.json();
    const sha = branchData.object.sha;

    // Get tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}${recursive ? '?recursive=1' : ''}`;
    const treeResponse = await fetch(treeUrl, { headers });
    
    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch tree: ${treeResponse.status}`);
    }
    
    const treeData = await treeResponse.json();
    return treeData.tree || [];
  } catch (error) {
    console.error('Error fetching repo tree:', error);
    return [];
  }
}

/**
 * Detect package manager and read package file
 * HOTFIX: Silent fail on 404, log only when found
 */
export async function detectPackageManager(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<{
  type: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'maven' | 'gradle' | 'go' | 'cargo' | 'swift' | null;
  file: string | null;
  content: any;
}> {
  const packageFiles = [
    { type: 'swift' as const, file: 'Package.swift' },
    { type: 'npm' as const, file: 'package.json' },
    { type: 'pip' as const, file: 'requirements.txt' },
    { type: 'pip' as const, file: 'pyproject.toml' },
    { type: 'maven' as const, file: 'pom.xml' },
    { type: 'gradle' as const, file: 'build.gradle' },
    { type: 'go' as const, file: 'go.mod' },
    { type: 'cargo' as const, file: 'Cargo.toml' },
  ];

  console.log('[detectPackageManager] Checking package manager files...');

  for (const { type, file } of packageFiles) {
    const content = await fetchFileContent(owner, repo, file, branch, token);
    if (content) {
      console.log(`[detectPackageManager] ✅ Found: ${file} (${type})`);
      try {
        const parsed = file.endsWith('.json') ? JSON.parse(content.content) : content.content;
        return { type, file, content: parsed };
      } catch {
        return { type, file, content: content.content };
      }
    }
    // HOTFIX: Silent fail on 404 - don't log missing files to avoid console noise
  }

  console.log('[detectPackageManager] ⚠️ No package manager file found');
  return { type: null, file: null, content: null };
}

/**
 * Extract scripts from package.json
 */
export function extractScripts(packageJson: any): Array<{ name: string; command: string; source: string }> {
  if (!packageJson || !packageJson.scripts) return [];
  
  return Object.entries(packageJson.scripts).map(([name, command]) => ({
    name,
    command: command as string,
    source: 'package.json:scripts',
  }));
}

/**
 * Detect tech stack from files
 */
export function detectTechStack(files: GitHubTreeItem[], packageContent?: any): {
  language: string;
  framework?: string;
  runtime?: string;
  database?: string[];
  other?: string[];
} {
  const stack: any = {
    language: 'Unknown',
    other: [],
  };

  // Swift/iOS detection (PRIORITY: check first)
  const hasXcodeProj = files.some(f => f.path.endsWith('.xcodeproj') || f.path.includes('.xcodeproj/'));
  const hasSwiftFiles = files.some(f => f.path.endsWith('.swift'));
  const hasInfoPlist = files.some(f => f.path.endsWith('Info.plist'));
  const hasPackageSwift = files.some(f => f.path === 'Package.swift');

  if (hasXcodeProj || hasSwiftFiles || hasInfoPlist) {
    stack.language = 'Swift';
    stack.framework = 'iOS';
    stack.runtime = 'Xcode';
    if (hasPackageSwift) {
      stack.other.push('Swift Package Manager');
    } else if (hasXcodeProj) {
      stack.other.push('Xcode Project');
    }
    return stack; // Early return to avoid JS/Python false positives
  }

  // Language detection
  const fileExtensions = files.map(f => f.path.split('.').pop());
  if (fileExtensions.includes('ts') || fileExtensions.includes('tsx')) {
    stack.language = 'TypeScript';
  } else if (fileExtensions.includes('js') || fileExtensions.includes('jsx')) {
    stack.language = 'JavaScript';
  } else if (fileExtensions.includes('py')) {
    stack.language = 'Python';
  } else if (fileExtensions.includes('java')) {
    stack.language = 'Java';
  } else if (fileExtensions.includes('go')) {
    stack.language = 'Go';
  } else if (fileExtensions.includes('rs')) {
    stack.language = 'Rust';
  }

  // Framework detection from package.json
  if (packageContent?.dependencies) {
    const deps = Object.keys(packageContent.dependencies);
    
    if (deps.includes('next')) {
      stack.framework = 'Next.js';
      stack.runtime = 'Node.js';
    } else if (deps.includes('react')) {
      stack.framework = 'React';
      stack.runtime = 'Node.js';
    } else if (deps.includes('vue')) {
      stack.framework = 'Vue.js';
      stack.runtime = 'Node.js';
    } else if (deps.includes('express')) {
      stack.framework = 'Express';
      stack.runtime = 'Node.js';
    }

    // Database detection
    const databases = [];
    if (deps.includes('prisma') || deps.includes('@prisma/client')) databases.push('Prisma');
    if (deps.includes('mongoose')) databases.push('MongoDB');
    if (deps.includes('pg')) databases.push('PostgreSQL');
    if (deps.includes('mysql2')) databases.push('MySQL');
    if (databases.length > 0) stack.database = databases;

    // Other tools
    if (deps.includes('tailwindcss')) stack.other.push('Tailwind CSS');
    if (deps.includes('typescript')) stack.other.push('TypeScript');
  }

  return stack;
}

/**
 * Validate URL (link checker)
 */
export async function validateUrl(url: string): Promise<{ valid: boolean; status: number | string }> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return {
      valid: response.ok || (response.status >= 300 && response.status < 400),
      status: response.status,
    };
  } catch (error: any) {
    return {
      valid: false,
      status: error.message || 'Network error',
    };
  }
}

/**
 * Extract all links from markdown content
 */
export function extractLinksFromMarkdown(content: string): Array<{ url: string; line: number }> {
  const links: Array<{ url: string; line: number }> = [];
  const lines = content.split('\n');
  
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      links.push({
        url: match[2],
        line: index + 1,
      });
    }
  });
  
  return links;
}

/**
 * Extract file references from markdown (e.g., `src/app/page.tsx`)
 */
export function extractFileReferences(content: string): Array<{ path: string; line: number }> {
  const references: Array<{ path: string; line: number }> = [];
  const lines = content.split('\n');
  
  // Match code blocks and inline code with file paths
  const pathRegex = /`([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)`/g;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = pathRegex.exec(line)) !== null) {
      const path = match[1];
      if (path.includes('/') || path.includes('.')) {
        references.push({
          path,
          line: index + 1,
        });
      }
    }
  });
  
  return references;
}

/**
 * Create branch via GitHub API
 */
export async function createBranch(
  owner: string,
  repo: string,
  newBranch: string,
  baseBranch: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get base branch SHA
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!refResponse.ok) {
      throw new Error(`Base branch ${baseBranch} not found`);
    }
    
    const refData = await refResponse.json();
    const sha = refData.object.sha;

    // Create new branch
    const createResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${newBranch}`,
          sha,
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || 'Failed to create branch');
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create or update file via GitHub API
 */
export async function updateFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
  token: string,
  sha?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };
    
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update file');
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create pull request via GitHub API
 * HOTFIX: Better error handling and maintainer_can_modify flag
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
  token: string,
  draft: boolean = true
): Promise<{ success: boolean; prUrl?: string; prNumber?: number; error?: string; errorDetails?: any }> {
  try {
    const requestBody = {
      title,
      body,
      head,
      base,
      draft,
      maintainer_can_modify: true, // HOTFIX: Allow maintainers to edit
    };

    console.log('[createPullRequest] Creating PR:', { owner, repo, head, base, draft });

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      // HOTFIX: Detailed error logging
      console.error('[createPullRequest] ❌ Failed:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        requestBody: { ...requestBody, token: '***' },
      });

      // Extract meaningful error message
      let errorMessage = error.message || 'Failed to create pull request';
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage += ': ' + error.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
      }

      return {
        success: false,
        error: errorMessage,
        errorDetails: error,
      };
    }

    const data = await response.json();
    
    console.log('[createPullRequest] ✅ Success:', { number: data.number, url: data.html_url });
    
    return {
      success: true,
      prUrl: data.html_url,
      prNumber: data.number,
    };
  } catch (error: any) {
    console.error('[createPullRequest] ❌ Exception:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user repositories (OAuth-based)
 */
export async function getUserRepos(
  token: string,
  page: number = 1,
  perPage: number = 30
): Promise<{
  success: boolean;
  repos?: Array<{
    name: string;
    full_name: string;
    owner: string;
    private: boolean;
    default_branch: string;
    description?: string;
    html_url: string;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=updated&affiliation=owner,collaborator`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    const repos = data.map((repo: any) => ({
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      default_branch: repo.default_branch,
      description: repo.description,
      html_url: repo.html_url,
    }));

    return {
      success: true,
      repos,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if branch exists
 */
export async function checkBranchExists(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<{ exists: boolean; sha?: string }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        exists: true,
        sha: data.commit.sha,
      };
    }

    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * Create or checkout branch (combined workflow)
 */
export async function createOrCheckoutBranch(
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string,
  token: string
): Promise<{
  success: boolean;
  action: 'created' | 'exists' | 'error';
  sha?: string;
  error?: string;
}> {
  try {
    // First check if branch exists
    const existsCheck = await checkBranchExists(owner, repo, branchName, token);
    
    if (existsCheck.exists) {
      return {
        success: true,
        action: 'exists',
        sha: existsCheck.sha,
      };
    }

    // Branch doesn't exist, create it
    const createResult = await createBranch(owner, repo, branchName, baseBranch, token);
    
    if (!createResult.success) {
      return {
        success: false,
        action: 'error',
        error: createResult.error,
      };
    }

    // Get the new branch SHA
    const newCheck = await checkBranchExists(owner, repo, branchName, token);
    
    return {
      success: true,
      action: 'created',
      sha: newCheck.sha,
    };
  } catch (error: any) {
    return {
      success: false,
      action: 'error',
      error: error.message,
    };
  }
}

