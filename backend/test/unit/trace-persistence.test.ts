/**
 * Trace Persistence Regression Test
 * 
 * Ensures that all trace event types (especially 'reasoning') can be successfully
 * written to the database without enum mismatch errors.
 * 
 * This test was added to prevent regression of:
 * "invalid input value for enum trace_event_type: 'reasoning'"
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { db } from '../../src/db/client.js';
import { jobs, jobTraces, traceEventTypeEnum } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/** Trace event types from the Drizzle schema */
type TraceEventType = (typeof traceEventTypeEnum.enumValues)[number];

describe('Trace Persistence', () => {
  let testJobId: string;

  before(async () => {
    // Create a test job to attach traces to
    testJobId = randomUUID();
    await db.insert(jobs).values({
      id: testJobId,
      type: 'test',
      state: 'pending',
      payload: { test: true },
      requiresStrictValidation: false,
    });
  });

  after(async () => {
    // Cleanup: delete test traces and job
    await db.delete(jobTraces).where(eq(jobTraces.jobId, testJobId));
    await db.delete(jobs).where(eq(jobs.id, testJobId));
  });

  it('should persist all explainability trace event types', async () => {
    // Test all explainability event types that previously caused errors
    const explainabilityEvents: TraceEventType[] = [
      'tool_call',
      'tool_result',
      'decision',
      'plan_step',
      'reasoning', // This was the problematic one
    ];

    for (const eventType of explainabilityEvents) {
      const traceId = randomUUID();
      
      // Attempt to insert trace with this event type
      await db.insert(jobTraces).values({
        id: traceId,
        jobId: testJobId,
        eventType,
        title: `Test ${eventType} event`,
        detail: { test: true },
        status: 'info',
        timestamp: new Date(),
      });

      // Verify it was inserted
      const [inserted] = await db
        .select()
        .from(jobTraces)
        .where(eq(jobTraces.id, traceId))
        .limit(1);

      assert.ok(inserted, `Failed to insert ${eventType} event`);
      assert.strictEqual(inserted.eventType, eventType, `Event type mismatch for ${eventType}`);
    }
  });

  it('should persist reasoning event with summary fields', async () => {
    const traceId = randomUUID();
    
    // Insert a reasoning event with all explainability fields
    await db.insert(jobTraces).values({
      id: traceId,
      jobId: testJobId,
      eventType: 'reasoning',
      title: 'Agent reasoning summary',
      detail: { phase: 'planning' },
      status: 'info',
      timestamp: new Date(),
      reasoningSummary: 'This is a user-facing reasoning summary (not raw CoT)',
      inputSummary: 'Task: update documentation',
      outputSummary: 'Generated plan with 3 steps',
    });

    // Verify all fields were persisted
    const [inserted] = await db
      .select()
      .from(jobTraces)
      .where(eq(jobTraces.id, traceId))
      .limit(1);

    assert.ok(inserted, 'Failed to insert reasoning event');
    assert.strictEqual(inserted.eventType, 'reasoning');
    assert.strictEqual(inserted.reasoningSummary, 'This is a user-facing reasoning summary (not raw CoT)');
    assert.strictEqual(inserted.inputSummary, 'Task: update documentation');
    assert.strictEqual(inserted.outputSummary, 'Generated plan with 3 steps');
  });

  it('should persist tool_call event with asked/did/why fields', async () => {
    const traceId = randomUUID();
    
    // Insert a tool_call event with explainability fields
    await db.insert(jobTraces).values({
      id: traceId,
      jobId: testJobId,
      eventType: 'tool_call',
      title: 'GitHub API call',
      detail: { tool: 'github.getFileContent' },
      status: 'info',
      timestamp: new Date(),
      toolName: 'github.getFileContent',
      askedWhat: 'Read the contents of README.md',
      didWhat: 'Called GitHub API to retrieve file contents',
      whyReason: 'Need current content to append updates',
      durationMs: 150,
    });

    // Verify all fields were persisted
    const [inserted] = await db
      .select()
      .from(jobTraces)
      .where(eq(jobTraces.id, traceId))
      .limit(1);

    assert.ok(inserted, 'Failed to insert tool_call event');
    assert.strictEqual(inserted.eventType, 'tool_call');
    assert.strictEqual(inserted.toolName, 'github.getFileContent');
    assert.strictEqual(inserted.askedWhat, 'Read the contents of README.md');
    assert.strictEqual(inserted.didWhat, 'Called GitHub API to retrieve file contents');
    assert.strictEqual(inserted.whyReason, 'Need current content to append updates');
    assert.strictEqual(inserted.durationMs, 150);
  });

  it('should handle trace flush without errors', async () => {
    // Simulate what TraceRecorder.flush does - insert traces separately to avoid type issues
    const trace1Id = randomUUID();
    await db.insert(jobTraces).values({
      id: trace1Id,
      jobId: testJobId,
      eventType: 'step_start',
      title: 'Step started',
      detail: {},
      status: 'info',
      timestamp: new Date(),
    });

    const trace2Id = randomUUID();
    await db.insert(jobTraces).values({
      id: trace2Id,
      jobId: testJobId,
      eventType: 'reasoning',
      title: 'Reasoning summary',
      detail: { phase: 'execution' },
      status: 'info',
      timestamp: new Date(),
      reasoningSummary: 'Agent decided to proceed with commit',
    });

    const trace3Id = randomUUID();
    await db.insert(jobTraces).values({
      id: trace3Id,
      jobId: testJobId,
      eventType: 'step_complete',
      title: 'Step completed',
      detail: {},
      status: 'info',
      timestamp: new Date(),
    });

    // Verify all were inserted
    const inserted = await db
      .select()
      .from(jobTraces)
      .where(eq(jobTraces.jobId, testJobId));

    assert.ok(inserted.length >= 3, 'Expected at least 3 traces to be inserted');
    
    // Verify reasoning event is among them
    const reasoningEvent = inserted.find(t => t.id === trace2Id);
    assert.ok(reasoningEvent, 'Reasoning event should be persisted');
    assert.strictEqual(
      reasoningEvent.reasoningSummary,
      'Agent decided to proceed with commit',
      'Reasoning summary should be preserved'
    );
  });
});

