/**
 * Scribe Agent Injection Tests - S0.4.6
 * Tests for GitHub service injection in ScribeAgent
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { AgentFactory } from '../../src/core/agents/AgentFactory.js';
import { ScribeAgent } from '../../src/agents/scribe/ScribeAgent.js';
import { GitHubMCPService } from '../../src/services/mcp/adapters/GitHubMCPService.js';
import type { AgentDependencies } from '../../src/core/agents/AgentFactory.js';

describe('Scribe Agent Dependency Injection', () => {
  // Register ScribeAgent before tests
  before(() => {
    // Only register if not already registered
    if (!AgentFactory.listTypes().includes('scribe')) {
      AgentFactory.register('scribe', ScribeAgent);
    }
  });
  describe('AgentFactory.create with GitHubMCPService', () => {
    it('should create ScribeAgent with GitHubMCPService when provided', () => {
      const mockGitHubMCP = new GitHubMCPService({
        baseUrl: 'https://mock-github-mcp.example.com',
        token: 'mock-token',
      });

      const deps: AgentDependencies = {
        tools: {
          githubMCP: mockGitHubMCP,
        },
      };

      const agent = AgentFactory.create('scribe', deps);

      assert.strictEqual(agent.type, 'scribe');
      // Agent should be created without throwing
      // The actual injection is tested by executeWithTools
    });

    it('should create ScribeAgent without GitHubMCPService (for validation error test)', () => {
      const deps: AgentDependencies = {
        tools: {},
      };

      const agent = AgentFactory.create('scribe', deps);

      assert.strictEqual(agent.type, 'scribe');
      // Agent should be created - validation happens in executeWithTools
    });

    it('should inject AIService along with GitHubMCPService', () => {
      const mockGitHubMCP = new GitHubMCPService({
        baseUrl: 'https://mock-github-mcp.example.com',
        token: 'mock-token',
      });

      const mockAIService = {
        planner: { plan: async () => ({ steps: [], rationale: '' }) },
        reflector: { critique: async () => ({ summary: '', suggestions: [] }) },
      };

      const deps: AgentDependencies = {
        tools: {
          githubMCP: mockGitHubMCP,
          aiService: mockAIService,
        },
      };

      const agent = AgentFactory.create('scribe', deps);

      assert.strictEqual(agent.type, 'scribe');
    });
  });

  describe('ScribeAgent.executeWithTools validation', () => {
    it('should throw descriptive error when GitHubMCPService is not injected', async () => {
      const deps: AgentDependencies = {
        tools: {
          // No githubMCP
        },
      };

      const agent = AgentFactory.create('scribe', deps);

      const context = {
        owner: 'test-owner',
        repo: 'test-repo',
        baseBranch: 'main',
      };

      try {
        await agent.executeWithTools({}, undefined, context);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes('GitHubMCPService'),
          `Expected error message to mention GitHubMCPService, got: ${error.message}`
        );
        assert.ok(
          error.message.includes('connect') || error.message.includes('configured'),
          `Expected error message to be actionable, got: ${error.message}`
        );
      }
    });

    it('should throw descriptive error when AIService is not injected', async () => {
      const mockGitHubMCP = new GitHubMCPService({
        baseUrl: 'https://mock-github-mcp.example.com',
        token: 'mock-token',
      });

      const deps: AgentDependencies = {
        tools: {
          githubMCP: mockGitHubMCP,
          // No aiService
        },
      };

      const agent = AgentFactory.create('scribe', deps);

      const context = {
        owner: 'test-owner',
        repo: 'test-repo',
        baseBranch: 'main',
      };

      try {
        await agent.executeWithTools({}, undefined, context);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes('AIService'),
          `Expected error message to mention AIService, got: ${error.message}`
        );
      }
    });

    it('should throw error for invalid context', async () => {
      const mockGitHubMCP = new GitHubMCPService({
        baseUrl: 'https://mock-github-mcp.example.com',
        token: 'mock-token',
      });

      const mockAIService = {
        planner: { plan: async () => ({ steps: [], rationale: '' }) },
        reflector: { critique: async () => ({ summary: '', suggestions: [] }) },
      };

      const deps: AgentDependencies = {
        tools: {
          githubMCP: mockGitHubMCP,
          aiService: mockAIService,
        },
      };

      const agent = AgentFactory.create('scribe', deps);

      // Missing required fields
      const invalidContext = {
        owner: 'test-owner',
        // missing repo and baseBranch
      };

      try {
        await agent.executeWithTools({}, undefined, invalidContext);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes('ScribeTaskContext'),
          `Expected error message to mention ScribeTaskContext, got: ${error.message}`
        );
      }
    });
  });
});

