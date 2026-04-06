import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createGitHubRESTAdapter } from '../../src/pipeline/adapters/GitHubRESTAdapter.js';
import { createGitHubMCPAdapter } from '../../src/pipeline/adapters/GitHubMCPAdapter.js';

describe('AKIS Platform Repo Guard — REST Adapter', () => {
  const adapter = createGitHubRESTAdapter({ token: 'fake-token' });

  it('should throw for akis-platform-devolopment repo', async () => {
    await assert.rejects(
      () => adapter.createRepository('OmerYasirOnal', 'akis-platform-devolopment', true),
      (err: Error) => {
        assert.ok(err.message.includes('AKIS platform repo'));
        return true;
      },
    );
  });

  it('should throw for akis-platform-development repo (typo variant)', async () => {
    await assert.rejects(
      () => adapter.createRepository('OmerYasirOnal', 'akis-platform-development', true),
      (err: Error) => {
        assert.ok(err.message.includes('AKIS platform repo'));
        return true;
      },
    );
  });

  it('should be case-insensitive', async () => {
    await assert.rejects(
      () => adapter.createRepository('anyone', 'AKIS-Platform-Devolopment', false),
      (err: Error) => {
        assert.ok(err.message.includes('AKIS platform repo'));
        return true;
      },
    );
  });

  it('should allow other repos', async () => {
    // Will fail on network (no real token) but should NOT throw the guard error
    await assert.rejects(
      () => adapter.createRepository('OmerYasirOnal', 'my-cool-app', true),
      (err: Error) => {
        assert.ok(!err.message.includes('AKIS platform repo'));
        return true;
      },
    );
  });
});

describe('AKIS Platform Repo Guard — MCP Adapter', () => {
  const mockMcp = {
    callToolRaw: async () => ({ html_url: 'https://github.com/test/test' }),
  };
  const adapter = createGitHubMCPAdapter(mockMcp);

  it('should throw for akis-platform-devolopment repo', async () => {
    await assert.rejects(
      () => adapter.createRepository('OmerYasirOnal', 'akis-platform-devolopment', true),
      (err: Error) => {
        assert.ok(err.message.includes('AKIS platform repo'));
        return true;
      },
    );
  });

  it('should allow other repos', async () => {
    const result = await adapter.createRepository('OmerYasirOnal', 'my-cool-app', true);
    assert.ok(result.url);
  });
});
