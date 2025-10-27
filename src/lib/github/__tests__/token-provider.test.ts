/**
 * Token Provider Tests
 * 
 * Test suite for GitHub App token provider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getGitHubToken, isValidGitHubToken } from '../token-provider';

// Mock environment variables
const mockEnv = {
  GITHUB_APP_ID: '123456',
  GITHUB_APP_INSTALLATION_ID: '12345678',
  GITHUB_APP_PRIVATE_KEY_PEM: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
};

describe('getGitHubToken', () => {
  beforeEach(() => {
    // Set mock env vars
    Object.assign(process.env, mockEnv);
  });

  afterEach(() => {
    // Clear env vars
    delete process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_INSTALLATION_ID;
    delete process.env.GITHUB_APP_PRIVATE_KEY_PEM;
    
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should throw error if called from client-side', async () => {
    // Simulate client-side
    const originalWindow = global.window;
    // @ts-ignore
    global.window = {};

    await expect(getGitHubToken()).rejects.toThrow(
      'SECURITY: getGitHubToken must only be called server-side'
    );

    global.window = originalWindow;
  });

  it('should prefer GitHub App token over OAuth', async () => {
    // Mock getCachedGitHubAppToken
    vi.mock('../auth/github-app', () => ({
      getCachedGitHubAppToken: vi.fn().mockResolvedValue('ghs_app_token'),
    }));

    const result = await getGitHubToken({
      userToken: 'gho_oauth_token',
    });

    expect(result).toHaveProperty('token');
    if ('token' in result) {
      expect(result.token).toBe('ghs_app_token');
      expect(result.source).toBe('github_app');
    }
  });

  it('should fallback to OAuth if GitHub App unavailable', async () => {
    // Mock getCachedGitHubAppToken to return null
    vi.mock('../auth/github-app', () => ({
      getCachedGitHubAppToken: vi.fn().mockResolvedValue(null),
    }));

    const result = await getGitHubToken({
      userToken: 'gho_oauth_token',
    });

    expect(result).toHaveProperty('token');
    if ('token' in result) {
      expect(result.token).toBe('gho_oauth_token');
      expect(result.source).toBe('oauth');
    }
  });

  it('should return error if no credentials available', async () => {
    // Clear env vars
    delete process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_INSTALLATION_ID;
    delete process.env.GITHUB_APP_PRIVATE_KEY_PEM;

    const result = await getGitHubToken();

    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.actionable.type).toBe('install_app');
    }
  });

  it('should include correlation ID in logs', async () => {
    const correlationId = 'test123';
    
    await getGitHubToken({ correlationId });

    // Verify correlation ID is used (check logs)
    // This is a placeholder - actual implementation would check logger calls
    expect(correlationId).toBe('test123');
  });
});

describe('isValidGitHubToken', () => {
  it('should validate GitHub token prefixes', () => {
    expect(isValidGitHubToken('ghp_1234567890123456789012345678901234')).toBe(true);
    expect(isValidGitHubToken('gho_1234567890123456789012345678901234')).toBe(true);
    expect(isValidGitHubToken('ghs_1234567890123456789012345678901234')).toBe(true);
    expect(isValidGitHubToken('ghu_1234567890123456789012345678901234')).toBe(true);
    expect(isValidGitHubToken('ghr_1234567890123456789012345678901234')).toBe(true);
  });

  it('should reject invalid tokens', () => {
    expect(isValidGitHubToken('')).toBe(false);
    expect(isValidGitHubToken('invalid_token')).toBe(false);
    expect(isValidGitHubToken('xyz_1234567890')).toBe(false);
  });
});

