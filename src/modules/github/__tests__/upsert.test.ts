/**
 * Unit tests for GitHub Upsert Helper
 * 
 * Tests:
 * 1. Create path: File doesn't exist (404) → create without SHA
 * 2. Update path: File exists → update with SHA
 * 3. Retry logic: Transient 422 → retry succeeds
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { upsertRepoContent, UpsertFileOptions } from '../upsert';

// Mock the GitHub client
jest.mock('../client', () => ({
  createGitHubClient: () => ({
    get: jest.fn(),
    put: jest.fn(),
  }),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('upsertRepoContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CREATE PATH: File does not exist (404) → creates without sha', async () => {
    const { createGitHubClient } = await import('../client');
    const mockClient = createGitHubClient() as any;

    // Mock GET → 404 (file doesn't exist)
    mockClient.get.mockResolvedValueOnce({
      success: false,
      error: 'Not Found',
      status: 404,
    });

    // Mock PUT → success (create)
    mockClient.put.mockResolvedValueOnce({
      success: true,
      data: {
        content: { sha: 'new-file-sha-123' },
      },
    });

    const options: UpsertFileOptions = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'docs/test-branch',
      path: 'README.md',
      content: '# Test README\n\nHello World',
      message: 'docs: create README',
      retries: 0,
    };

    const result = await upsertRepoContent(options);

    expect(result.success).toBe(true);
    expect(result.mode).toBe('create');
    expect(result.sha).toBe('new-file-sha-123');
    expect(result.branch).toBe('docs/test-branch');

    // Verify PUT was called WITHOUT sha in body
    expect(mockClient.put).toHaveBeenCalledWith(
      '/repos/test-owner/test-repo/contents/README.md',
      expect.objectContaining({
        branch: 'docs/test-branch',
        message: 'docs: create README',
        content: expect.any(String), // base64
      })
    );

    const putCall = mockClient.put.mock.calls[0][1];
    expect(putCall.sha).toBeUndefined(); // No SHA for create
  });

  test('UPDATE PATH: File exists → updates with sha', async () => {
    const { createGitHubClient } = await import('../client');
    const mockClient = createGitHubClient() as any;

    // Mock GET → 200 with existing SHA
    mockClient.get
      .mockResolvedValueOnce({
        success: true,
        data: {
          path: 'README.md',
          sha: 'existing-file-sha-456',
          content: Buffer.from('Old content').toString('base64'),
        },
      })
      .mockResolvedValueOnce({ success: true }); // ref visibility check

    // Mock PUT → success (update)
    mockClient.put.mockResolvedValueOnce({
      success: true,
      data: {
        content: { sha: 'updated-file-sha-789' },
      },
    });

    const options: UpsertFileOptions = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'docs/test-branch',
      path: 'README.md',
      content: '# Updated README\n\nNew Content',
      message: 'docs: update README',
      retries: 0,
    };

    const result = await upsertRepoContent(options);

    expect(result.success).toBe(true);
    expect(result.mode).toBe('update');
    expect(result.sha).toBe('updated-file-sha-789');

    // Verify PUT was called WITH sha in body
    expect(mockClient.put).toHaveBeenCalledWith(
      '/repos/test-owner/test-repo/contents/README.md',
      expect.objectContaining({
        branch: 'docs/test-branch',
        sha: 'existing-file-sha-456', // SHA included for update
        message: 'docs: update README',
      })
    );
  });

  test('RETRY LOGIC: Transient 422 → retry succeeds', async () => {
    const { createGitHubClient } = await import('../client');
    const mockClient = createGitHubClient() as any;

    // Mock GET → 404 (new file)
    mockClient.get.mockResolvedValue({
      success: false,
      status: 404,
    });

    // Mock PUT → 422 first, then success on retry
    mockClient.put
      .mockRejectedValueOnce({
        status: 422,
        message: 'Unprocessable Entity',
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          content: { sha: 'retry-success-sha' },
        },
      });

    const options: UpsertFileOptions = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'docs/test-branch',
      path: 'CHANGELOG.md',
      content: '# Changelog\n\n## v1.0.0',
      message: 'docs: add changelog',
      retries: 2, // Allow retries
    };

    const result = await upsertRepoContent(options);

    expect(result.success).toBe(true);
    expect(result.mode).toBe('create');
    expect(result.sha).toBe('retry-success-sha');

    // Verify PUT was called twice (1 fail + 1 success)
    expect(mockClient.put).toHaveBeenCalledTimes(2);
  });

  test('NON-RETRIABLE ERROR: 403 Forbidden → fails immediately', async () => {
    const { createGitHubClient } = await import('../client');
    const mockClient = createGitHubClient() as any;

    mockClient.get.mockResolvedValue({ success: false, status: 404 });

    // Mock PUT → 403 (non-retriable)
    mockClient.put.mockRejectedValue({
      status: 403,
      message: 'Forbidden',
    });

    const options: UpsertFileOptions = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'docs/test-branch',
      path: 'README.md',
      content: 'test',
      message: 'test',
      retries: 3, // Even with retries, 403 should fail immediately
    };

    const result = await upsertRepoContent(options);

    expect(result.success).toBe(false);
    expect(result.error).toContain('403');

    // Verify PUT was called only once (no retries for 403)
    expect(mockClient.put).toHaveBeenCalledTimes(1);
  });
});

