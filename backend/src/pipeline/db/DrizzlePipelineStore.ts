/**
 * DrizzlePipelineStore — PostgreSQL-backed PipelineStore implementation.
 * Replaces InMemoryPipelineStore for production use.
 */
import { eq, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PipelineState } from '../core/contracts/PipelineTypes.js';
import type { PipelineStore } from '../core/orchestrator/PipelineOrchestrator.js';
import { pipelines } from '../../db/schema.js';
import type * as schema from '../../db/schema.js';

type DB = NodePgDatabase<typeof schema>;

/**
 * Maps a Drizzle row to PipelineState. JSONB columns need casting.
 */
function rowToState(row: typeof pipelines.$inferSelect): PipelineState {
  return {
    id: row.id,
    userId: row.userId,
    stage: row.stage as PipelineState['stage'],
    title: row.title ?? undefined,
    scribeConversation: (row.scribeConversation ?? []) as PipelineState['scribeConversation'],
    scribeOutput: row.scribeOutput as PipelineState['scribeOutput'],
    approvedSpec: row.approvedSpec as PipelineState['approvedSpec'],
    protoOutput: row.protoOutput as PipelineState['protoOutput'],
    traceOutput: row.traceOutput as PipelineState['traceOutput'],
    protoConfig: row.protoConfig as PipelineState['protoConfig'],
    metrics: (row.metrics ?? { startedAt: new Date(), clarificationRounds: 0, retryCount: 0 }) as PipelineState['metrics'],
    error: row.error as PipelineState['error'],
    intermediateState: row.intermediateState as PipelineState['intermediateState'],
    attemptCount: row.attemptCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzlePipelineStore implements PipelineStore {
  constructor(private db: DB) {}

  async create(userId: string): Promise<PipelineState> {
    const now = new Date();
    const metrics = {
      startedAt: now,
      clarificationRounds: 0,
      retryCount: 0,
    };

    const [row] = await this.db
      .insert(pipelines)
      .values({
        userId,
        stage: 'scribe_generating',
        scribeConversation: [],
        metrics,
        attemptCount: 0,
      })
      .returning();

    return rowToState(row);
  }

  async getById(id: string): Promise<PipelineState | null> {
    const [row] = await this.db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, id))
      .limit(1);

    return row ? rowToState(row) : null;
  }

  async listByUser(userId: string): Promise<PipelineState[]> {
    const rows = await this.db
      .select()
      .from(pipelines)
      .where(eq(pipelines.userId, userId))
      .orderBy(desc(pipelines.createdAt));

    return rows.map(rowToState);
  }

  async update(id: string, data: Partial<PipelineState>): Promise<PipelineState> {
    // Build update payload — only set fields that are explicitly passed
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.scribeConversation !== undefined) updateData.scribeConversation = data.scribeConversation;
    if (data.scribeOutput !== undefined) updateData.scribeOutput = data.scribeOutput;
    if (data.approvedSpec !== undefined) updateData.approvedSpec = data.approvedSpec;
    if (data.protoOutput !== undefined) updateData.protoOutput = data.protoOutput;
    if (data.traceOutput !== undefined) updateData.traceOutput = data.traceOutput;
    if (data.protoConfig !== undefined) updateData.protoConfig = data.protoConfig;
    if (data.metrics !== undefined) updateData.metrics = data.metrics;
    if (data.error !== undefined) updateData.error = data.error;
    if (data.intermediateState !== undefined) updateData.intermediateState = data.intermediateState;
    if (data.attemptCount !== undefined) updateData.attemptCount = data.attemptCount;

    const [row] = await this.db
      .update(pipelines)
      .set(updateData)
      .where(eq(pipelines.id, id))
      .returning();

    if (!row) throw new Error(`Pipeline ${id} not found`);
    return rowToState(row);
  }
}
