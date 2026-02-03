/**
 * RSS Fetcher Service
 * Fetches and parses RSS feeds, handles deduplication via link hash
 */

import crypto from 'crypto';
import type { FetchedItem, AutomationSource } from './types.js';
import { db } from '../../db/client.js';
import { smartAutomationItems } from '../../db/schema.js';
import { and, gte, sql } from 'drizzle-orm';

// Dynamic import for rss-parser (ESM module)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ParserClass: any;

async function getRSSParser() {
  if (!ParserClass) {
    const module = await import('rss-parser');
    ParserClass = module.default;
  }
  return new ParserClass({
    timeout: 10000,
    headers: {
      'User-Agent': 'AKIS-SmartAutomations/1.0',
    },
  });
}

/**
 * Generate SHA-256 hash of a link for deduplication
 */
export function hashLink(link: string): string {
  return crypto.createHash('sha256').update(link.toLowerCase().trim()).digest('hex');
}

/**
 * Extract domain name from URL for source identification
 */
function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Check if a date is within the last N hours
 */
function isWithinHours(date: Date | undefined, hours: number): boolean {
  if (!date) return true; // Include items without dates
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return date >= cutoff;
}

export class RSSFetcherService {
  private logger: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void };

  constructor(logger?: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void }) {
    this.logger = logger || {
      info: (msg, data) => console.log(`[RSSFetcher] ${msg}`, data || ''),
      error: (msg, data) => console.error(`[RSSFetcher] ${msg}`, data || ''),
    };
  }

  /**
   * Fetch items from multiple RSS sources
   * @param sources List of RSS source configurations
   * @param hoursBack Only include items from the last N hours (default: 24)
   */
  async fetchFromSources(sources: AutomationSource[], hoursBack = 24): Promise<FetchedItem[]> {
    const parser = await getRSSParser();
    const allItems: FetchedItem[] = [];

    for (const source of sources) {
      if (source.type !== 'rss') {
        // Skip non-RSS sources for now (webpage-to-rss is future feature)
        this.logger.info('Skipping non-RSS source', { url: source.url, type: source.type });
        continue;
      }

      try {
        this.logger.info('Fetching RSS feed', { url: source.url });
        const feed = await parser.parseURL(source.url);
        const sourceName = feed.title || extractSourceName(source.url);

        for (const item of feed.items || []) {
          if (!item.link || !item.title) continue;

          const publishedAt = item.pubDate ? new Date(item.pubDate) : undefined;

          // Filter by time
          if (!isWithinHours(publishedAt, hoursBack)) continue;

          // Extract excerpt from content or description
          let excerpt = item.contentSnippet || item.content || item.description || '';
          // Truncate excerpt to ~200 chars
          if (excerpt.length > 200) {
            excerpt = excerpt.substring(0, 197) + '...';
          }
          // Remove HTML tags
          excerpt = excerpt.replace(/<[^>]*>/g, '').trim();

          allItems.push({
            title: item.title.trim(),
            link: item.link.trim(),
            linkHash: hashLink(item.link),
            excerpt: excerpt || undefined,
            publishedAt,
            source: sourceName,
          });
        }

        this.logger.info('Fetched items from feed', { url: source.url, count: feed.items?.length || 0 });
      } catch (error) {
        this.logger.error('Failed to fetch RSS feed', { url: source.url, error: String(error) });
        // Continue with other sources
      }
    }

    return allItems;
  }

  /**
   * Deduplicate items against previously used items for this automation
   * @param items Fetched items to dedupe
   * @param automationId Automation ID to check against
   * @param daysBack Number of days to look back for duplicates (default: 7)
   */
  async dedupeItems(items: FetchedItem[], automationId: string, daysBack = 7): Promise<FetchedItem[]> {
    if (items.length === 0) return [];

    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get existing link hashes for this automation's recent runs
    const existingHashes = await db
      .select({ linkHash: smartAutomationItems.linkHash })
      .from(smartAutomationItems)
      .where(
        and(
          gte(smartAutomationItems.createdAt, cutoffDate),
          // Join through runs to filter by automation
          sql`${smartAutomationItems.runId} IN (
            SELECT id FROM smart_automation_runs WHERE automation_id = ${automationId}
          )`
        )
      );

    const hashSet = new Set(existingHashes.map((h) => h.linkHash));

    // Filter out duplicates
    const uniqueItems = items.filter((item) => !hashSet.has(item.linkHash));

    this.logger.info('Deduplication complete', {
      original: items.length,
      unique: uniqueItems.length,
      duplicates: items.length - uniqueItems.length,
    });

    return uniqueItems;
  }
}

export const rssFetcherService = new RSSFetcherService();
