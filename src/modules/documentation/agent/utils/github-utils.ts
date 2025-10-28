/**
 * GitHub API Utilities V2
 * Refactored to use central GitHub client
 * NO hardcoded 'main' branch
 * 
 * This is a compatibility layer for existing code.
 * All functions delegate to modules/github/operations.ts
 */

import {
  getDefaultBranch as getDefaultBranchOp,
  getFileContent as getFileContentOp,
  getRepoTree as getRepoTreeOp,
  createBranch as createBranchOp,
  updateFile as updateFileOp,
  createPullRequest as createPullRequestOp,
  addLabelsToPR,
  getUserRepos as getUserReposOp,
  checkBranchExists as checkBranchExistsOp,
  detectPackageManager as detectPackageManagerOp,
} from '@/modules/github/operations';
import { GitHubClientOptions } from '@/modules/github/client';
import type { GitHubFileContent, GitHubTreeItem } from '../types';

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
 * FIXED: No hardcoded 'main' - uses default branch if not provided
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
  token?: string
): Promise<GitHubFileContent | null> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await getFileContentOp(owner, repo, path, {
    ...options,
    ref: branch,
  });

  if (!result.success) {
    // Silent fail on 404 (file not found is expected)
    if ('status' in result && result.status === 404) {
      return null;
    }
    return null;
  }

  return {
    path: result.data.path,
    content: result.data.content,
    sha: result.data.sha,
    size: result.data.size,
  };
}

/**
 * Fetch repository tree (file list)
 * FIXED: No hardcoded 'main' - uses default branch if not provided
 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch?: string,
  token?: string,
  recursive: boolean = true
): Promise<GitHubTreeItem[]> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await getRepoTreeOp(owner, repo, {
    ...options,
    ref: branch,
    recursive,
  });

  if (!result.success) {
    return [];
  }

  return result.data as GitHubTreeItem[];
}

/**
 * Detect package manager and read package file
 */
export async function detectPackageManager(
  owner: string,
  repo: string,
  branch?: string,
  token?: string
): Promise<{
  type: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'maven' | 'gradle' | 'go' | 'cargo' | 'swift' | null;
  file: string | null;
  content: any;
}> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await detectPackageManagerOp(owner, repo, {
    ...options,
    ref: branch,
  });

  if (!result.success) {
    return { type: null, file: null, content: null };
  }

  return result.data;
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
    return stack;
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
 * Extract file references from markdown
 */
export function extractFileReferences(content: string): Array<{ path: string; line: number }> {
  const references: Array<{ path: string; line: number }> = [];
  const lines = content.split('\n');
  
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
 * FIXED: No hardcoded 'main' - uses default branch if not provided
 */
export async function createBranch(
  owner: string,
  repo: string,
  newBranch: string,
  baseBranch?: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await createBranchOp(owner, repo, newBranch, {
    ...options,
    baseBranch,
  });

  if (!result.success) {
    return {
      success: false,
      error: 'error' in result ? result.error : 'Unknown error',
    };
  }

  return { success: true };
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
  token?: string,
  sha?: string
): Promise<{ success: boolean; error?: string }> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await updateFileOp(owner, repo, branch, path, content, message, {
    ...options,
    sha,
  });

  if (!result.success) {
    return {
      success: false,
      error: 'error' in result ? result.error : 'Unknown error',
    };
  }

  return { success: true };
}

/**
 * Create pull request via GitHub API
 * FIXED: No hardcoded 'main' - uses default branch if not provided
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base?: string,
  token?: string,
  draft: boolean = true
): Promise<{ success: boolean; prUrl?: string; prNumber?: number; error?: string; errorDetails?: any }> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await createPullRequestOp(owner, repo, title, body, head, {
    ...options,
    base,
    draft,
  });

  if (!result.success) {
    return {
      success: false,
      error: 'error' in result ? result.error : 'Unknown error',
      errorDetails: 'details' in result ? result.details : undefined,
    };
  }

  return {
    success: true,
    prUrl: result.data.html_url,
    prNumber: result.data.number,
  };
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
  const options: GitHubClientOptions = {
    userToken: token,
  };

  const result = await getUserReposOp({
    ...options,
    page,
    perPage,
  });

  if (!result.success) {
    return {
      success: false,
      error: 'error' in result ? result.error : 'Unknown error',
    };
  }

  const repos = result.data.map((repo: any) => ({
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
}

/**
 * Check if branch exists
 */
export async function checkBranchExists(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<{ exists: boolean; sha?: string }> {
  const options: GitHubClientOptions = {
    userToken: token,
    repo: { owner, name: repo },
  };

  const result = await checkBranchExistsOp(owner, repo, branch, options);

  if (!result.success) {
    return { exists: false };
  }

  return result.data;
}

/**
 * Create or checkout branch (combined workflow)
 * FIXED: No hardcoded 'main' - uses default branch if not provided
 */
export async function createOrCheckoutBranch(
  owner: string,
  repo: string,
  branchName: string,
  baseBranch?: string,
  token?: string
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

