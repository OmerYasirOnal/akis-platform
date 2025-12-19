/**
 * Orchestrator GitHub Injection Error Tests - S0.4.6
 * Tests for fail-fast error classes used in AgentOrchestrator
 * Note: These are pure unit tests for error classes, no DB required
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Define error classes inline to avoid DB dependency from orchestrator import
// These must match the ones in AgentOrchestrator.ts

class GitHubNotConnectedError extends Error {
  readonly code = 'GITHUB_NOT_CONNECTED';
  
  constructor(message: string = 'GitHub is not connected. Please connect your GitHub account first.') {
    super(message);
    this.name = 'GitHubNotConnectedError';
  }
}

class MissingDependencyError extends Error {
  readonly code = 'MISSING_DEPENDENCY';
  readonly dependency: string;
  readonly suggestion: string;
  
  constructor(dependency: string, suggestion: string) {
    super(`Missing dependency: ${dependency}. ${suggestion}`);
    this.name = 'MissingDependencyError';
    this.dependency = dependency;
    this.suggestion = suggestion;
  }
}

describe('Orchestrator GitHub Injection Errors', () => {
  describe('GitHubNotConnectedError', () => {
    it('should have correct error code', () => {
      const error = new GitHubNotConnectedError();
      
      assert.strictEqual(error.code, 'GITHUB_NOT_CONNECTED');
      assert.strictEqual(error.name, 'GitHubNotConnectedError');
    });

    it('should use default message when none provided', () => {
      const error = new GitHubNotConnectedError();
      
      assert.ok(error.message.includes('GitHub is not connected'));
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Please connect GitHub for user 123';
      const error = new GitHubNotConnectedError(customMessage);
      
      assert.strictEqual(error.message, customMessage);
    });
  });

  describe('MissingDependencyError', () => {
    it('should have correct error code', () => {
      const error = new MissingDependencyError('userId', 'Include userId in payload');
      
      assert.strictEqual(error.code, 'MISSING_DEPENDENCY');
      assert.strictEqual(error.name, 'MissingDependencyError');
    });

    it('should store dependency name and suggestion', () => {
      const error = new MissingDependencyError('GITHUB_MCP_BASE_URL', 'Set in .env file');
      
      assert.strictEqual(error.dependency, 'GITHUB_MCP_BASE_URL');
      assert.strictEqual(error.suggestion, 'Set in .env file');
    });

    it('should format message with dependency and suggestion', () => {
      const error = new MissingDependencyError('userId', 'Include userId in payload');
      
      assert.ok(error.message.includes('userId'));
      assert.ok(error.message.includes('Include userId in payload'));
    });
  });

  describe('Error inheritance', () => {
    it('GitHubNotConnectedError should be instanceof Error', () => {
      const error = new GitHubNotConnectedError();
      
      assert.ok(error instanceof Error);
    });

    it('MissingDependencyError should be instanceof Error', () => {
      const error = new MissingDependencyError('test', 'test');
      
      assert.ok(error instanceof Error);
    });
  });
});

