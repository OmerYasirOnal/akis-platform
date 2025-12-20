/**
 * PlanGenerator Unit Tests
 * PR-1: Contract-first plan artifact tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createPlanGenerator, type PlanContext } from '../../src/core/planning/PlanGenerator.js';

describe('PlanGenerator', () => {
  const generator = createPlanGenerator();

  describe('generatePlan', () => {
    it('should generate a valid plan with all required sections', async () => {
      const context: PlanContext = {
        jobId: 'test-job-123',
        agentType: 'scribe',
        taskDescription: 'Update README.md with installation instructions',
        targetPath: 'README.md',
        repositoryOwner: 'test-owner',
        repositoryName: 'test-repo',
        baseBranch: 'main',
        dryRun: true,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      assert.ok(plan, 'Plan should be defined');
      assert.ok(plan.markdown.includes('## Objective & Context'), 'Should have Objective section');
      assert.ok(plan.markdown.includes('## Scope & Constraints'), 'Should have Scope section');
      assert.ok(plan.markdown.includes('## Proposed Solution Plan'), 'Should have Plan section');
      assert.ok(plan.markdown.includes('## Validation Strategy'), 'Should have Validation section');
      assert.ok(plan.markdown.includes('## Rollback / Mitigation Plan'), 'Should have Rollback section');
      assert.ok(plan.markdown.includes('## AI Usage Disclosure'), 'Should have AI Disclosure section');
      assert.ok(plan.markdown.includes('## Evidence Checklist'), 'Should have Evidence section');
    });

    it('should generate valid JSON plan structure', async () => {
      const context: PlanContext = {
        jobId: 'test-job-456',
        agentType: 'scribe',
        taskDescription: 'Add API documentation',
        dryRun: true,
        requiresApproval: true,
      };

      const plan = await generator.generatePlan(context);

      assert.ok(plan.json, 'JSON should be defined');
      assert.strictEqual(plan.json.version, '1.0', 'Version should be 1.0');
      assert.strictEqual(plan.json.agentType, 'scribe', 'Agent type should match');
      assert.strictEqual(plan.json.jobId, 'test-job-456', 'Job ID should match');
      assert.strictEqual(plan.json.dryRun, true, 'DryRun should be true');
      assert.strictEqual(plan.json.requiresApproval, true, 'RequiresApproval should be true');
    });

    it('should include all plan sections in JSON', async () => {
      const context: PlanContext = {
        jobId: 'test-job-789',
        agentType: 'scribe',
        taskDescription: 'Update docs',
        dryRun: false,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      assert.ok(plan.json.sections, 'Sections should exist');
      assert.ok(plan.json.sections.objective, 'Objective should exist');
      assert.ok(plan.json.sections.scope, 'Scope should exist');
      assert.ok(Array.isArray(plan.json.sections.constraints), 'Constraints should be array');
      assert.ok(Array.isArray(plan.json.sections.plan), 'Plan steps should be array');
      assert.ok(Array.isArray(plan.json.sections.validationStrategy), 'Validation should be array');
      assert.ok(plan.json.sections.rollbackPlan, 'Rollback should exist');
      assert.ok(plan.json.sections.aiDisclosure, 'AI Disclosure should exist');
      assert.ok(Array.isArray(plan.json.sections.evidenceChecklist), 'Evidence should be array');
    });

    it('should set requiresApproval=true for non-dryRun jobs', async () => {
      const context: PlanContext = {
        jobId: 'test-job-nondry',
        agentType: 'scribe',
        taskDescription: 'Update production docs',
        dryRun: false,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      // Non-dry-run is high risk, should require approval
      assert.strictEqual(plan.requiresApproval, true, 'Non-dryRun should require approval');
    });

    it('should include constraints about secrets and safety', async () => {
      const context: PlanContext = {
        jobId: 'test-job-safety',
        agentType: 'scribe',
        taskDescription: 'Update docs',
        dryRun: true,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      assert.ok(
        plan.json.sections.constraints.includes('No secrets or tokens will be logged or stored'),
        'Should have secrets constraint'
      );
      assert.ok(
        plan.json.sections.constraints.includes('Chain-of-thought reasoning will not be exposed in outputs'),
        'Should have chain-of-thought constraint'
      );
    });

    it('should include dry-run constraint when in dry-run mode', async () => {
      const context: PlanContext = {
        jobId: 'test-job-dryrun',
        agentType: 'scribe',
        taskDescription: 'Update docs',
        dryRun: true,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      const hasDryRunConstraint = plan.json.sections.constraints.some(
        (c: string) => c.includes('Dry-run mode')
      );
      assert.ok(hasDryRunConstraint, 'Should have dry-run constraint');
    });
  });

  describe('validatePlan', () => {
    it('should pass validation for a complete plan', async () => {
      const context: PlanContext = {
        jobId: 'test-job-valid',
        agentType: 'scribe',
        taskDescription: 'Complete task',
        dryRun: true,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);
      const validation = generator.validatePlan(plan.markdown);

      assert.strictEqual(validation.valid, true, 'Should be valid');
      assert.strictEqual(validation.errors.length, 0, 'Should have no errors');
    });

    it('should fail validation for missing sections', () => {
      const incompletePlan = `
# Agent Job Plan

## Objective & Context
Some objective
`;

      const validation = generator.validatePlan(incompletePlan);

      assert.strictEqual(validation.valid, false, 'Should not be valid');
      assert.ok(validation.errors.length > 0, 'Should have errors');
      assert.ok(
        validation.errors.some((e: string) => e.includes('Missing required section')),
        'Should have missing section error'
      );
    });

    it('should warn about empty sections', () => {
      const planWithEmptySections = `
## Objective & Context
OK content here

## Scope & Constraints


## Proposed Solution Plan
OK

## Validation Strategy
OK

## Rollback / Mitigation Plan
OK

## AI Usage Disclosure
OK

## Evidence Checklist
OK
`;

      const validation = generator.validatePlan(planWithEmptySections);

      assert.ok(validation.warnings.length > 0, 'Should have warnings');
      assert.ok(
        validation.warnings.some((w: string) => w.includes('empty or too short')),
        'Should have empty section warning'
      );
    });
  });

  describe('risk assessment', () => {
    it('should assess low risk for dry-run with few files', async () => {
      const context: PlanContext = {
        jobId: 'test-low-risk',
        agentType: 'scribe',
        taskDescription: 'Update one file',
        dryRun: true,
        requiresApproval: false,
        filesDiscovered: ['README.md'],
      };

      const plan = await generator.generatePlan(context);

      assert.strictEqual(
        (plan.json.metadata as Record<string, unknown>)?.riskLevel,
        'low',
        'Should be low risk'
      );
    });

    it('should assess high risk for non-dry-run', async () => {
      const context: PlanContext = {
        jobId: 'test-high-risk',
        agentType: 'scribe',
        taskDescription: 'Update production',
        dryRun: false,
        requiresApproval: false,
        filesDiscovered: ['README.md'],
      };

      const plan = await generator.generatePlan(context);

      assert.strictEqual(
        (plan.json.metadata as Record<string, unknown>)?.riskLevel,
        'high',
        'Should be high risk'
      );
    });

    it('should assess medium risk for dry-run with moderate files', async () => {
      const context: PlanContext = {
        jobId: 'test-medium-risk',
        agentType: 'scribe',
        taskDescription: 'Update docs directory',
        dryRun: true,
        requiresApproval: false,
        filesDiscovered: [
          'docs/README.md',
          'docs/API.md',
          'docs/SETUP.md',
          'docs/CONTRIBUTING.md',
          'docs/ARCHITECTURE.md',
        ],
      };

      const plan = await generator.generatePlan(context);

      assert.strictEqual(
        (plan.json.metadata as Record<string, unknown>)?.riskLevel,
        'medium',
        'Should be medium risk'
      );
    });
  });

  describe('plan steps', () => {
    it('should include context gathering step', async () => {
      const context: PlanContext = {
        jobId: 'test-steps',
        agentType: 'scribe',
        taskDescription: 'Update docs',
        dryRun: true,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      const hasContextStep = plan.json.sections.plan.some(
        (step) => step.id === 'gather-context'
      );
      assert.ok(hasContextStep, 'Should have context gathering step');
    });

    it('should include preview step for dry-run', async () => {
      const context: PlanContext = {
        jobId: 'test-preview-step',
        agentType: 'scribe',
        taskDescription: 'Update docs',
        dryRun: true,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      const hasPreviewStep = plan.json.sections.plan.some(
        (step) => step.id === 'preview'
      );
      assert.ok(hasPreviewStep, 'Should have preview step');
    });

    it('should include branch/commit/PR steps for non-dry-run', async () => {
      const context: PlanContext = {
        jobId: 'test-exec-steps',
        agentType: 'scribe',
        taskDescription: 'Update docs',
        dryRun: false,
        requiresApproval: false,
      };

      const plan = await generator.generatePlan(context);

      const stepIds = plan.json.sections.plan.map((s) => s.id);
      assert.ok(stepIds.includes('create-branch'), 'Should have create-branch step');
      assert.ok(stepIds.includes('commit-changes'), 'Should have commit-changes step');
      assert.ok(stepIds.includes('create-pr'), 'Should have create-pr step');
    });
  });
});
