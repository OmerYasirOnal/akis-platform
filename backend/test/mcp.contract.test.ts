import { test } from 'node:test';
import assert from 'node:assert';
import { GitHubMCPService, type GitHubMCPServiceOptions } from '../src/services/mcp/adapters/GitHubMCPService.js';
import { JiraMCPService, type JiraMCPServiceOptions } from '../src/services/mcp/adapters/JiraMCPService.js';
import { ConfluenceMCPService, type ConfluenceMCPServiceOptions } from '../src/services/mcp/adapters/ConfluenceMCPService.js';
import type { MCPTools } from '../src/services/mcp/adapters/index.js';

test('MCP Adapters: Contract Tests (signature-only)', async (t) => {
  // Test GitHubMCPService contract
  await t.test('GitHubMCPService contract', async () => {
    // Constructor shape: (opts: { baseUrl: string; token?: string })
    const opts: GitHubMCPServiceOptions = {
      baseUrl: 'https://api.githubcopilot.com/mcp/',
      token: 'test-token',
    };

    const service = new GitHubMCPService(opts);
    assert.ok(service, 'GitHubMCPService should instantiate');

    // Assert method presence and types
    assert.ok(typeof service.createBranch === 'function', 'createBranch should be a function');
    assert.ok(typeof service.commitFile === 'function', 'commitFile should be a function');
    assert.ok(typeof service.listIssues === 'function', 'listIssues should be a function');
    assert.ok(typeof service.createPRDraft === 'function', 'createPRDraft should be a function');

    // Test method signatures (should throw "Not implemented" for signature-only)
    await assert.rejects(
      async () => {
        await service.createBranch('owner', 'repo', 'branch', 'sha');
      },
      /Not implemented: signature-only MCP adapter/,
      'createBranch should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.commitFile('owner', 'repo', 'branch', 'path', 'content', 'message');
      },
      /Not implemented: signature-only MCP adapter/,
      'commitFile should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.listIssues('owner', 'repo', 'open');
      },
      /Not implemented: signature-only MCP adapter/,
      'listIssues should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.createPRDraft('owner', 'repo', 'title', 'body', 'head', 'base');
      },
      /Not implemented: signature-only MCP adapter/,
      'createPRDraft should throw signature-only error'
    );
  });

  // Test JiraMCPService contract
  await t.test('JiraMCPService contract', async () => {
    const opts: JiraMCPServiceOptions = {
      baseUrl: 'https://api.atlassian.com/mcp/v1/jira/',
      token: 'test-token',
    };

    const service = new JiraMCPService(opts);
    assert.ok(service, 'JiraMCPService should instantiate');

    // Assert method presence
    assert.ok(typeof service.getIssue === 'function', 'getIssue should be a function');
    assert.ok(typeof service.listIssues === 'function', 'listIssues should be a function');
    assert.ok(typeof service.createIssue === 'function', 'createIssue should be a function');
    assert.ok(typeof service.addComment === 'function', 'addComment should be a function');

    // Test method signatures
    await assert.rejects(
      async () => {
        await service.getIssue('PROJ-123');
      },
      /Not implemented: signature-only MCP adapter/,
      'getIssue should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.listIssues('PROJ', 'status = open');
      },
      /Not implemented: signature-only MCP adapter/,
      'listIssues should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.createIssue('PROJ', { summary: 'Test', issueType: 'Task' });
      },
      /Not implemented: signature-only MCP adapter/,
      'createIssue should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.addComment('PROJ-123', 'comment');
      },
      /Not implemented: signature-only MCP adapter/,
      'addComment should throw signature-only error'
    );
  });

  // Test ConfluenceMCPService contract
  await t.test('ConfluenceMCPService contract', async () => {
    const opts: ConfluenceMCPServiceOptions = {
      baseUrl: 'https://api.atlassian.com/mcp/v1/confluence/',
      token: 'test-token',
    };

    const service = new ConfluenceMCPService(opts);
    assert.ok(service, 'ConfluenceMCPService should instantiate');

    // Assert method presence
    assert.ok(typeof service.getPage === 'function', 'getPage should be a function');
    assert.ok(typeof service.fetchConfluencePage === 'function', 'fetchConfluencePage should be a function');
    assert.ok(typeof service.createPage === 'function', 'createPage should be a function');
    assert.ok(typeof service.updatePage === 'function', 'updatePage should be a function');

    // Test method signatures
    await assert.rejects(
      async () => {
        await service.getPage('12345');
      },
      /Not implemented: signature-only MCP adapter/,
      'getPage should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.fetchConfluencePage('SPACE', 'Title');
      },
      /Not implemented: signature-only MCP adapter/,
      'fetchConfluencePage should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.createPage('SPACE', 'Title', 'Content');
      },
      /Not implemented: signature-only MCP adapter/,
      'createPage should throw signature-only error'
    );

    await assert.rejects(
      async () => {
        await service.updatePage('12345', 'Updated content');
      },
      /Not implemented: signature-only MCP adapter/,
      'updatePage should throw signature-only error'
    );
  });

  // Test MCPTools type and registry wiring
  await t.test('MCPTools type and registry', async () => {
    // Verify MCPTools type structure
    const mcpTools: MCPTools = {
      githubMCP: new GitHubMCPService({ baseUrl: 'https://test.github.com', token: 'token' }),
      jiraMCP: new JiraMCPService({ baseUrl: 'https://test.jira.com', token: 'token' }),
      confluenceMCP: new ConfluenceMCPService({ baseUrl: 'https://test.confluence.com', token: 'token' }),
    };

    assert.ok(mcpTools.githubMCP, 'githubMCP should be present');
    assert.ok(mcpTools.jiraMCP, 'jiraMCP should be present');
    assert.ok(mcpTools.confluenceMCP, 'confluenceMCP should be present');

    // Verify all adapters are instances of their respective classes
    assert.ok(mcpTools.githubMCP instanceof GitHubMCPService, 'githubMCP should be GitHubMCPService instance');
    assert.ok(mcpTools.jiraMCP instanceof JiraMCPService, 'jiraMCP should be JiraMCPService instance');
    assert.ok(mcpTools.confluenceMCP instanceof ConfluenceMCPService, 'confluenceMCP should be ConfluenceMCPService instance');

    // Verify optional fields
    const partialTools: MCPTools = {};
    assert.ok(partialTools, 'MCPTools should allow partial initialization');
  });

  // Test constructor argument validation (behavior check)
  await t.test('Constructor argument validation', async () => {
    // Test with minimal required args
    const githubService = new GitHubMCPService({ baseUrl: 'https://test.com' });
    assert.ok(githubService, 'Should accept baseUrl only');

    const jiraService = new JiraMCPService({ baseUrl: 'https://test.com' });
    assert.ok(jiraService, 'Should accept baseUrl only');

    const confluenceService = new ConfluenceMCPService({ baseUrl: 'https://test.com' });
    assert.ok(confluenceService, 'Should accept baseUrl only');

    // Test with token
    const githubServiceWithToken = new GitHubMCPService({ baseUrl: 'https://test.com', token: 'token' });
    assert.ok(githubServiceWithToken, 'Should accept baseUrl and token');
  });
});

