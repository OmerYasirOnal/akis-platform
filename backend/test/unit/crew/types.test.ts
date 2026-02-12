import { describe, it, expect } from 'vitest';
import { crewRunInputSchema, crewRunOutputSchema, workerRoleSchema } from '../../../src/core/crew/types.js';

describe('Crew Run Contract Schemas', () => {
  describe('workerRoleSchema', () => {
    it('validates a valid worker role', () => {
      const result = workerRoleSchema.safeParse({
        role: 'content-writer',
        agentType: 'scribe',
        taskDescription: 'Write blog content for the website',
        color: '#10B981',
      });
      expect(result.success).toBe(true);
    });

    it('provides default color', () => {
      const result = workerRoleSchema.parse({
        role: 'ui-designer',
        agentType: 'proto',
        taskDescription: 'Design the landing page UI',
      });
      expect(result.color).toBe('#6366F1');
    });

    it('rejects invalid agent type', () => {
      const result = workerRoleSchema.safeParse({
        role: 'tester',
        agentType: 'invalid',
        taskDescription: 'Run tests',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid color format', () => {
      const result = workerRoleSchema.safeParse({
        role: 'tester',
        agentType: 'trace',
        taskDescription: 'Run tests',
        color: 'red',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('crewRunInputSchema', () => {
    it('validates a complete crew run input', () => {
      const result = crewRunInputSchema.safeParse({
        goal: 'Build a landing page for Acme Corp with content, UI, and SEO',
        workerRoles: [
          { role: 'content', agentType: 'scribe', taskDescription: 'Write page content' },
          { role: 'ui', agentType: 'proto', taskDescription: 'Design the page' },
          { role: 'seo', agentType: 'scribe', taskDescription: 'Optimize for search' },
        ],
        mergeStrategy: 'synthesize',
        failureStrategy: 'best_effort',
      });
      expect(result.success).toBe(true);
    });

    it('provides defaults for optional fields', () => {
      const result = crewRunInputSchema.parse({
        goal: 'Build a landing page for Acme Corp with content, UI, and SEO optimization',
        workerRoles: [
          { role: 'content', agentType: 'scribe', taskDescription: 'Write page content' },
        ],
      });
      expect(result.mergeStrategy).toBe('synthesize');
      expect(result.failureStrategy).toBe('best_effort');
      expect(result.autoApprove).toBe(false);
    });

    it('rejects goal shorter than 10 chars', () => {
      const result = crewRunInputSchema.safeParse({
        goal: 'short',
        workerRoles: [
          { role: 'content', agentType: 'scribe', taskDescription: 'Write content' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty worker roles', () => {
      const result = crewRunInputSchema.safeParse({
        goal: 'Build a complete website with all features',
        workerRoles: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects more than 10 worker roles', () => {
      const roles = Array.from({ length: 11 }, (_, i) => ({
        role: `worker-${i}`,
        agentType: 'scribe' as const,
        taskDescription: `Task ${i}`,
      }));
      const result = crewRunInputSchema.safeParse({
        goal: 'Build a massive project with many workers and tasks',
        workerRoles: roles,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('crewRunOutputSchema', () => {
    it('validates a complete output', () => {
      const result = crewRunOutputSchema.safeParse({
        mergedContent: '# Combined Output\n\nContent from all workers',
        workerResults: [
          {
            role: 'content',
            jobId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'completed',
            output: { markdown: 'content here' },
            tokenUsage: 1500,
            costUsd: 0.003,
          },
        ],
        taskBoard: [
          { taskId: 'task-1', title: 'Write content', status: 'completed' },
        ],
        coordinatorReflection: 'All tasks completed successfully',
        messageCount: 5,
        totalTokens: 3000,
        totalCostUsd: 0.006,
      });
      expect(result.success).toBe(true);
    });
  });
});
