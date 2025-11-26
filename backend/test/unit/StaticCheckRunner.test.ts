/**
 * StaticCheckRunner Unit Tests
 * Tests the static check runner interface and result formatting
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { StaticCheckRunner } from '../../src/services/checks/StaticCheckRunner.js';
import type { AllChecksResult, CheckResult } from '../../src/services/checks/StaticCheckRunner.js';

describe('StaticCheckRunner', () => {
  describe('constructor', () => {
    test('should create instance with default options', () => {
      const runner = new StaticCheckRunner();
      assert.ok(runner instanceof StaticCheckRunner);
    });

    test('should create instance with custom options', () => {
      const runner = new StaticCheckRunner({
        cwd: '/tmp',
        timeout: 60000,
        maxBuffer: 512 * 1024,
      });
      assert.ok(runner instanceof StaticCheckRunner);
    });
  });

  describe('formatCheckSummary static method', () => {
    test('should format all passed results', () => {
      const results: AllChecksResult = {
        lint: {
          checkType: 'lint',
          passed: true,
          exitCode: 0,
          stdout: '',
          stderr: '',
          durationMs: 100,
          command: 'pnpm lint',
        },
        typecheck: {
          checkType: 'typecheck',
          passed: true,
          exitCode: 0,
          stdout: '',
          stderr: '',
          durationMs: 200,
          command: 'pnpm typecheck',
        },
        allPassed: true,
        totalDurationMs: 300,
      };

      const summary = StaticCheckRunner.formatCheckSummary(results);

      assert.ok(summary.includes('Static Check Results:'));
      assert.ok(summary.includes('lint: PASSED'));
      assert.ok(summary.includes('typecheck: PASSED'));
      assert.ok(summary.includes('ALL PASSED'));
      assert.ok(summary.includes('300ms'));
    });

    test('should format failed results with errors', () => {
      const results: AllChecksResult = {
        lint: {
          checkType: 'lint',
          passed: false,
          exitCode: 1,
          stdout: '',
          stderr: 'Error: no-unused-vars at line 10',
          durationMs: 100,
          command: 'pnpm lint',
        },
        typecheck: {
          checkType: 'typecheck',
          passed: true,
          exitCode: 0,
          stdout: '',
          stderr: '',
          durationMs: 200,
          command: 'pnpm typecheck',
        },
        allPassed: false,
        totalDurationMs: 300,
      };

      const summary = StaticCheckRunner.formatCheckSummary(results);

      assert.ok(summary.includes('lint: FAILED'));
      assert.ok(summary.includes('typecheck: PASSED'));
      assert.ok(summary.includes('SOME FAILED'));
      assert.ok(summary.includes('no-unused-vars'));
    });

    test('should handle missing check results', () => {
      const results: AllChecksResult = {
        lint: {
          checkType: 'lint',
          passed: true,
          exitCode: 0,
          stdout: '',
          stderr: '',
          durationMs: 100,
          command: 'pnpm lint',
        },
        // typecheck, test, build not included
        allPassed: true,
        totalDurationMs: 100,
      };

      const summary = StaticCheckRunner.formatCheckSummary(results);

      assert.ok(summary.includes('lint: PASSED'));
      assert.ok(!summary.includes('typecheck:'));
      assert.ok(!summary.includes('test:'));
      assert.ok(!summary.includes('build:'));
    });

    test('should truncate long error messages', () => {
      const longError = 'Error: '.padEnd(600, 'x'); // 600+ chars
      
      const results: AllChecksResult = {
        lint: {
          checkType: 'lint',
          passed: false,
          exitCode: 1,
          stdout: '',
          stderr: longError,
          durationMs: 100,
          command: 'pnpm lint',
        },
        allPassed: false,
        totalDurationMs: 100,
      };

      const summary = StaticCheckRunner.formatCheckSummary(results);

      // Should include error preview but truncated
      assert.ok(summary.includes('Error:'));
      assert.ok(summary.includes('...'));
    });
  });

  describe('CheckResult type structure', () => {
    test('CheckResult has all required fields', () => {
      const result: CheckResult = {
        checkType: 'lint',
        passed: true,
        exitCode: 0,
        stdout: 'output',
        stderr: '',
        durationMs: 123,
        command: 'pnpm lint',
      };

      assert.strictEqual(result.checkType, 'lint');
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout, 'output');
      assert.strictEqual(result.stderr, '');
      assert.strictEqual(result.durationMs, 123);
      assert.strictEqual(result.command, 'pnpm lint');
    });
  });
});

