/**
 * Automation Executor Service
 * Orchestrates the execution of smart automations:
 * RSS fetch -> Dedupe -> Aggregate -> AI Generate -> Persist -> Notify
 */

import { db } from '../../db/client.js';
import {
  smartAutomations,
  smartAutomationRuns,
  smartAutomationItems,
} from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { RSSFetcherService, hashLink } from './RSSFetcherService.js';
import { ContentAggregatorService } from './ContentAggregatorService.js';
import { LinkedInDraftGenerator } from './LinkedInDraftGenerator.js';
import { SlackNotifierService } from './SlackNotifierService.js';
import type { ExecutionResult, FetchedItem, AutomationSource } from './types.js';

interface Logger {
  info: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
}

export class AutomationExecutor {
  private rssFetcher: RSSFetcherService;
  private contentAggregator: ContentAggregatorService;
  private draftGenerator: LinkedInDraftGenerator;
  private slackNotifier: SlackNotifierService;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || {
      info: (msg, data) => console.log(`[AutomationExecutor] ${msg}`, data || ''),
      error: (msg, data) => console.error(`[AutomationExecutor] ${msg}`, data || ''),
      warn: (msg, data) => console.warn(`[AutomationExecutor] ${msg}`, data || ''),
    };

    this.rssFetcher = new RSSFetcherService(this.logger);
    this.contentAggregator = new ContentAggregatorService(this.logger);
    this.draftGenerator = new LinkedInDraftGenerator(undefined, this.logger);
    this.slackNotifier = new SlackNotifierService(this.logger);
  }

  /**
   * Execute an automation by ID
   */
  async execute(automationId: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Get automation
    const [automation] = await db
      .select()
      .from(smartAutomations)
      .where(eq(smartAutomations.id, automationId))
      .limit(1);

    if (!automation) {
      return {
        success: false,
        runId: '',
        itemCount: 0,
        error: 'Automation not found',
        errorCode: 'AUTOMATION_NOT_FOUND',
      };
    }

    // Create run record
    const [run] = await db
      .insert(smartAutomationRuns)
      .values({
        automationId,
        status: 'running',
        startedAt: new Date(),
      })
      .returning();

    this.logger.info('Starting automation execution', {
      automationId,
      runId: run.id,
      name: automation.name,
    });

    try {
      // Step 1: Fetch RSS content
      const sources = automation.sources as AutomationSource[];
      const fetchedItems = await this.rssFetcher.fetchFromSources(sources);

      if (fetchedItems.length === 0) {
        return await this.completeRun(run.id, {
          success: true,
          runId: run.id,
          itemCount: 0,
          error: 'No items found from sources',
          errorCode: 'NO_CONTENT',
        });
      }

      // Step 2: Deduplicate
      const uniqueItems = await this.rssFetcher.dedupeItems(fetchedItems, automationId);

      if (uniqueItems.length === 0) {
        return await this.completeRun(run.id, {
          success: true,
          runId: run.id,
          itemCount: 0,
          error: 'All items were duplicates',
          errorCode: 'ALL_DUPLICATES',
        });
      }

      // Step 3: Aggregate and select top items
      const topics = automation.topics as string[];
      const selectedItems = this.contentAggregator.selectTopItems(uniqueItems, topics);

      if (selectedItems.length === 0) {
        return await this.completeRun(run.id, {
          success: true,
          runId: run.id,
          itemCount: 0,
          error: 'No relevant items found',
          errorCode: 'NO_RELEVANT_CONTENT',
        });
      }

      // Step 4: Save selected items
      await this.saveItems(run.id, selectedItems);

      // Step 5: Generate draft
      const language = (automation.outputLanguage as 'tr' | 'en') || 'tr';
      const draft = await this.draftGenerator.generateDraft(selectedItems, topics, language);

      // Step 6: Update run with draft
      await db
        .update(smartAutomationRuns)
        .set({
          output: draft.draft,
          summary: draft.summary,
          itemCount: selectedItems.length,
          status: 'success',
          completedAt: new Date(),
        })
        .where(eq(smartAutomationRuns.id, run.id));

      // Step 7: Send notifications
      let slackSent = false;
      if (automation.deliverySlack && this.slackNotifier.isConfigured()) {
        const slackResult = await this.slackNotifier.sendDraftNotification(
          {
            automationName: automation.name,
            draft: draft.draft,
            summary: draft.summary,
            sources: draft.sources,
            hashtags: draft.hashtags,
            runId: run.id,
            automationId,
          },
          automation.slackChannel || undefined
        );

        if (slackResult.ok && slackResult.ts) {
          slackSent = true;
          await db
            .update(smartAutomationRuns)
            .set({
              slackMessageTs: slackResult.ts,
              slackSent: true,
            })
            .where(eq(smartAutomationRuns.id, run.id));
        }
      }

      // Step 8: Update automation lastRunAt
      await db
        .update(smartAutomations)
        .set({
          lastRunAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(smartAutomations.id, automationId));

      const duration = Date.now() - startTime;
      this.logger.info('Automation execution completed', {
        runId: run.id,
        itemCount: selectedItems.length,
        durationMs: duration,
        slackSent,
      });

      return {
        success: true,
        runId: run.id,
        itemCount: selectedItems.length,
        draft,
      };
    } catch (error) {
      this.logger.error('Automation execution failed', {
        runId: run.id,
        error: String(error),
      });

      return await this.completeRun(run.id, {
        success: false,
        runId: run.id,
        itemCount: 0,
        error: String(error),
        errorCode: 'EXECUTION_FAILED',
      });
    }
  }

  /**
   * Save selected items to database
   */
  private async saveItems(runId: string, items: FetchedItem[]): Promise<void> {

    await db.insert(smartAutomationItems).values(
      items.map((item) => ({
        runId,
        title: item.title,
        link: item.link,
        linkHash: item.linkHash || hashLink(item.link),
        excerpt: item.excerpt,
        publishedAt: item.publishedAt,
        source: item.source,
      }))
    );
  }

  /**
   * Complete a run with given result (success or failure)
   */
  private async completeRun(
    runId: string,
    result: ExecutionResult
  ): Promise<ExecutionResult> {

    await db
      .update(smartAutomationRuns)
      .set({
        status: result.success ? 'success' : 'failed',
        error: result.error,
        errorCode: result.errorCode,
        itemCount: result.itemCount,
        completedAt: new Date(),
      })
      .where(eq(smartAutomationRuns.id, runId));

    return result;
  }

  /**
   * Resend Slack notification for a run
   */
  async resendSlackNotification(runId: string): Promise<{ success: boolean; error?: string }> {

    // Get run and automation
    const [run] = await db
      .select()
      .from(smartAutomationRuns)
      .where(eq(smartAutomationRuns.id, runId))
      .limit(1);

    if (!run) {
      return { success: false, error: 'Run not found' };
    }

    const [automation] = await db
      .select()
      .from(smartAutomations)
      .where(eq(smartAutomations.id, run.automationId))
      .limit(1);

    if (!automation) {
      return { success: false, error: 'Automation not found' };
    }

    if (!run.output) {
      return { success: false, error: 'No draft to send' };
    }

    // Parse draft for sources and hashtags
    let sources: string[] = [];
    let hashtags: string[] = [];

    // Get items for sources
    const items = await db
      .select()
      .from(smartAutomationItems)
      .where(eq(smartAutomationItems.runId, runId));

    sources = items.map((i) => i.link);

    // Try to extract hashtags from draft
    const hashtagMatches = run.output.match(/#\w+/g);
    if (hashtagMatches) {
      hashtags = hashtagMatches;
    }

    const slackResult = await this.slackNotifier.sendDraftNotification(
      {
        automationName: automation.name,
        draft: run.output,
        summary: run.summary || '',
        sources,
        hashtags,
        runId,
        automationId: automation.id,
      },
      automation.slackChannel || undefined
    );

    if (slackResult.ok && slackResult.ts) {
      await db
        .update(smartAutomationRuns)
        .set({
          slackMessageTs: slackResult.ts,
          slackSent: true,
        })
        .where(eq(smartAutomationRuns.id, runId));
    }

    return {
      success: slackResult.ok,
      error: slackResult.error,
    };
  }
}

export const automationExecutor = new AutomationExecutor();
