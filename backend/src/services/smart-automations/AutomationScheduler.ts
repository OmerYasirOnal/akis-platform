/**
 * Automation Scheduler
 * Polls the database for due automations and executes them
 * Similar pattern to StaleJobWatchdog
 */

import { db } from '../../db/client.js';
import { smartAutomations } from '../../db/schema.js';
import { lte, eq, and, isNotNull } from 'drizzle-orm';
import { AutomationExecutor } from './AutomationExecutor.js';

interface Logger {
  info: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
}

/**
 * Calculate next run timestamp for the following day
 */
function calculateNextDayRunAt(scheduleTime: string, _timezone: string): Date {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const now = new Date();

  // Add one day
  const nextRun = new Date(now);
  nextRun.setDate(nextRun.getDate() + 1);

  // Set time (simplified - assumes local timezone offset is acceptable for MVP)
  nextRun.setHours(hours, minutes, 0, 0);

  return nextRun;
}

export class AutomationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private executor: AutomationExecutor;
  private logger: Logger;
  private checkIntervalMs: number;

  constructor(
    logger?: Logger,
    checkIntervalMs = 60_000 // Default: check every 60 seconds
  ) {
    this.logger = logger || {
      info: (msg, data) => console.log(`[AutomationScheduler] ${msg}`, data || ''),
      error: (msg, data) => console.error(`[AutomationScheduler] ${msg}`, data || ''),
      warn: (msg, data) => console.warn(`[AutomationScheduler] ${msg}`, data || ''),
    };
    this.checkIntervalMs = checkIntervalMs;
    this.executor = new AutomationExecutor(this.logger);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.intervalId) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.logger.info('Starting automation scheduler', { intervalMs: this.checkIntervalMs });

    // Run immediately once, then on interval
    this.checkDueAutomations().catch((err) => {
      this.logger.error('Initial scheduler check failed', { error: String(err) });
    });

    this.intervalId = setInterval(() => {
      this.checkDueAutomations().catch((err) => {
        this.logger.error('Scheduler check failed', { error: String(err) });
      });
    }, this.checkIntervalMs);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Automation scheduler stopped');
    }
  }

  /**
   * Check for and execute due automations
   */
  async checkDueAutomations(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Previous scheduler check still running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();

      // Find automations that are:
      // 1. Enabled
      // 2. Have a next_run_at that is in the past (due)
      const dueAutomations = await db
        .select()
        .from(smartAutomations)
        .where(
          and(
            eq(smartAutomations.enabled, true),
            isNotNull(smartAutomations.nextRunAt),
            lte(smartAutomations.nextRunAt, now)
          )
        );

      if (dueAutomations.length === 0) {
        return;
      }

      this.logger.info('Found due automations', { count: dueAutomations.length });

      // Execute each due automation
      for (const automation of dueAutomations) {
        try {
          this.logger.info('Executing scheduled automation', {
            id: automation.id,
            name: automation.name,
          });

          // Execute the automation
          const result = await this.executor.execute(automation.id);

          // Update next run time regardless of success/failure
          const nextRunAt = calculateNextDayRunAt(
            automation.scheduleTime,
            automation.timezone
          );

          await db
            .update(smartAutomations)
            .set({
              nextRunAt,
              lastRunAt: now,
              updatedAt: now,
            })
            .where(eq(smartAutomations.id, automation.id));

          this.logger.info('Automation execution completed', {
            id: automation.id,
            name: automation.name,
            success: result.success,
            itemCount: result.itemCount,
            nextRunAt: nextRunAt.toISOString(),
          });
        } catch (error) {
          this.logger.error('Failed to execute automation', {
            id: automation.id,
            name: automation.name,
            error: String(error),
          });

          // Still update next run time to prevent stuck automations
          try {
            const nextRunAt = calculateNextDayRunAt(
              automation.scheduleTime,
              automation.timezone
            );

            await db
              .update(smartAutomations)
              .set({
                nextRunAt,
                updatedAt: now,
              })
              .where(eq(smartAutomations.id, automation.id));
          } catch (updateError) {
            this.logger.error('Failed to update next run time', {
              id: automation.id,
              error: String(updateError),
            });
          }
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; intervalMs: number } {
    return {
      running: !!this.intervalId,
      intervalMs: this.checkIntervalMs,
    };
  }
}

// Singleton instance
let schedulerInstance: AutomationScheduler | null = null;

/**
 * Get or create the scheduler singleton
 */
export function getAutomationScheduler(logger?: Logger): AutomationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AutomationScheduler(logger);
  }
  return schedulerInstance;
}

/**
 * Start the automation scheduler (call from server.app.ts)
 */
export function startAutomationScheduler(logger?: Logger): AutomationScheduler {
  const scheduler = getAutomationScheduler(logger);
  scheduler.start();
  return scheduler;
}

/**
 * Stop the automation scheduler (for graceful shutdown)
 */
export function stopAutomationScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}
