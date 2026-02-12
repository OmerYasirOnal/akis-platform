import { eq, and, or, desc } from 'drizzle-orm';
import { crewMessages } from '../../db/schema.js';
import type { CrewMessageType } from './types.js';
import type { CrewEventEmitter } from './CrewEventEmitter.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * CrewMailbox — Inter-agent messaging system.
 * Maps to Claude Code's mailbox for teammate communication.
 * 
 * Supports:
 * - Agent-to-agent direct messages
 * - User-to-agent direct messages (like Shift+Arrow in Claude Code)
 * - Broadcast to all crew members
 * - SSE push for real-time delivery
 */
export class CrewMailbox {
  constructor(
    private readonly db: NodePgDatabase<Record<string, unknown>>,
    private readonly eventEmitter: CrewEventEmitter,
  ) {}

  async sendMessage(
    crewRunId: string,
    from: { jobId: string | null; role: string },
    to: { jobId: string | null; role: string | null },
    content: string,
    messageType: CrewMessageType = 'chat',
  ) {
    const [message] = await this.db.insert(crewMessages).values({
      crewRunId,
      fromJobId: from.jobId,
      toJobId: to.jobId,
      fromRole: from.role,
      toRole: to.role,
      content,
      messageType,
    }).returning();

    this.eventEmitter.emitCrewEvent({
      type: 'crew:message',
      crewRunId,
      timestamp: new Date().toISOString(),
      data: {
        messageId: message.id,
        fromRole: from.role,
        toRole: to.role,
        content,
        messageType,
      },
    });

    return message;
  }

  async sendUserMessage(crewRunId: string, toJobId: string, content: string) {
    return this.sendMessage(
      crewRunId,
      { jobId: null, role: 'user' },
      { jobId: toJobId, role: null },
      content,
      'directive',
    );
  }

  async broadcast(crewRunId: string, from: { jobId: string | null; role: string }, content: string) {
    return this.sendMessage(
      crewRunId,
      from,
      { jobId: null, role: null },
      content,
      'chat',
    );
  }

  async getMessages(crewRunId: string, options?: {
    since?: Date;
    limit?: number;
    forJobId?: string;
  }) {
    const conditions = [eq(crewMessages.crewRunId, crewRunId)];

    if (options?.forJobId) {
      conditions.push(
        or(
          eq(crewMessages.toJobId, options.forJobId),
          eq(crewMessages.fromJobId, options.forJobId),
          // Also include broadcasts (toJobId is null)
        )!,
      );
    }

    let query = this.db.select().from(crewMessages)
      .where(and(...conditions))
      .orderBy(desc(crewMessages.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    return query;
  }

  async getMessageCount(crewRunId: string): Promise<number> {
    const result = await this.db.select().from(crewMessages)
      .where(eq(crewMessages.crewRunId, crewRunId));
    return result.length;
  }
}
