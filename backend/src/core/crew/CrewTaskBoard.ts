import { eq, and, sql } from 'drizzle-orm';
import { crewTasks } from '../../db/schema.js';
import type { CrewTaskStatus } from './types.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * CrewTaskBoard — Shared task list for agent coordination.
 * Maps to Claude Code's ~/.claude/tasks/{team-name}/ pattern.
 * 
 * Workers claim tasks, track dependencies, and self-coordinate.
 * Uses DB-level locking (SELECT FOR UPDATE) to prevent race conditions
 * when multiple workers try to claim the same task.
 */
export class CrewTaskBoard {
  constructor(private readonly db: NodePgDatabase<Record<string, unknown>>) {}

  async createTask(crewRunId: string, task: {
    title: string;
    description?: string;
    dependsOn?: string[];
    priority?: number;
  }) {
    const [created] = await this.db.insert(crewTasks).values({
      crewRunId,
      title: task.title,
      description: task.description ?? null,
      dependsOn: task.dependsOn ?? [],
      priority: task.priority ?? 0,
      status: 'pending',
    }).returning();
    return created;
  }

  async createTasks(crewRunId: string, tasks: Array<{
    title: string;
    description?: string;
    dependsOn?: string[];
    priority?: number;
  }>) {
    if (tasks.length === 0) return [];
    const rows = tasks.map(t => ({
      crewRunId,
      title: t.title,
      description: t.description ?? null,
      dependsOn: t.dependsOn ?? [],
      priority: t.priority ?? 0,
      status: 'pending' as const,
    }));
    return this.db.insert(crewTasks).values(rows).returning();
  }

  /**
   * Claim a task for a worker job.
   * Uses raw SQL with FOR UPDATE SKIP LOCKED to prevent race conditions.
   * Only claims if task is 'pending' and all dependencies are completed.
   */
  async claimTask(taskId: string, workerJobId: string): Promise<boolean> {
    const result = await this.db.execute(sql`
      UPDATE crew_tasks 
      SET status = 'in_progress', assigned_to = ${workerJobId}, updated_at = now()
      WHERE id = ${taskId}
        AND status = 'pending'
        AND NOT EXISTS (
          SELECT 1 FROM crew_tasks dep 
          WHERE dep.crew_run_id = crew_tasks.crew_run_id
            AND dep.id::text = ANY(
              SELECT jsonb_array_elements_text(crew_tasks.depends_on)
            )
            AND dep.status != 'completed'
        )
    `);
    return (result as { rowCount: number }).rowCount > 0;
  }

  async completeTask(taskId: string, result?: unknown) {
    await this.db.update(crewTasks)
      .set({
        status: 'completed',
        result: result ?? null,
        updatedAt: new Date(),
      })
      .where(eq(crewTasks.id, taskId));

    // Unblock dependent tasks: check if any blocked tasks can now become pending
    const task = await this.db.select().from(crewTasks).where(eq(crewTasks.id, taskId)).limit(1);
    if (task.length > 0) {
      await this.unblockDependentTasks(task[0].crewRunId);
    }
  }

  async failTask(taskId: string, error?: string) {
    await this.db.update(crewTasks)
      .set({
        status: 'blocked',
        result: error ? { error } : null,
        updatedAt: new Date(),
      })
      .where(eq(crewTasks.id, taskId));
  }

  async getAvailableTasks(crewRunId: string) {
    return this.db.select().from(crewTasks)
      .where(and(
        eq(crewTasks.crewRunId, crewRunId),
        eq(crewTasks.status, 'pending'),
      ))
      .orderBy(crewTasks.priority);
  }

  async getAllTasks(crewRunId: string) {
    return this.db.select().from(crewTasks)
      .where(eq(crewTasks.crewRunId, crewRunId))
      .orderBy(crewTasks.priority);
  }

  async getTasksByStatus(crewRunId: string, status: CrewTaskStatus) {
    return this.db.select().from(crewTasks)
      .where(and(
        eq(crewTasks.crewRunId, crewRunId),
        eq(crewTasks.status, status),
      ));
  }

  async getWorkerTasks(workerJobId: string) {
    return this.db.select().from(crewTasks)
      .where(eq(crewTasks.assignedTo, workerJobId));
  }

  /**
   * Check blocked tasks and unblock those whose dependencies are all completed.
   */
  private async unblockDependentTasks(crewRunId: string) {
    await this.db.execute(sql`
      UPDATE crew_tasks 
      SET status = 'pending', updated_at = now()
      WHERE crew_run_id = ${crewRunId}
        AND status = 'blocked'
        AND NOT EXISTS (
          SELECT 1 FROM crew_tasks dep 
          WHERE dep.crew_run_id = crew_tasks.crew_run_id
            AND dep.id::text = ANY(
              SELECT jsonb_array_elements_text(crew_tasks.depends_on)
            )
            AND dep.status != 'completed'
        )
    `);
  }
}
