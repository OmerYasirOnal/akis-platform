/**
 * GitHub Operations Tests
 * 
 * Test suite for high-level GitHub operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDefaultBranch, createBranch } from '../operations';

describe('getDefaultBranch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch default branch from repository', async () => {
    // Mock GitHub API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        default_branch: 'develop',
      }),
    });

    const result = await getDefaultBranch('owner', 'repo');

    expect(result).toHaveProperty('success', true);
    if (result.success) {
      expect(result.data.defaultBranch).toBe('develop');
    }
  });

  it('should fallback to main if API does not provide default_branch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await getDefaultBranch('owner', 'repo');

    expect(result).toHaveProperty('success', true);
    if (result.success) {
      expect(result.data.defaultBranch).toBe('main');
    }
  });

  it('should return error if repository not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not Found' }),
    });

    const result = await getDefaultBranch('owner', 'nonexistent');

    expect(result).toHaveProperty('success', false);
  });
});

describe('createBranch', () => {
  it('should use default branch as base if not provided', async () => {
    // Mock getDefaultBranch
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'develop' }),
      })
      // Mock get ref
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'abc123' } }),
      })
      // Mock create ref
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ref: 'refs/heads/feature' }),
      });

    const result = await createBranch('owner', 'repo', 'feature');

    expect(result).toHaveProperty('success', true);
    
    // Verify default branch was fetched
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/repos/owner/repo'),
      expect.anything()
    );
  });

  it('should not hardcode main branch', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ default_branch: 'master' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'def456' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ref: 'refs/heads/feature' }),
      });

    const result = await createBranch('owner', 'repo', 'feature');

    expect(result).toHaveProperty('success', true);
    
    // Verify it used 'master' not 'main'
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/git/ref/heads/master'),
      expect.anything()
    );
  });
});

