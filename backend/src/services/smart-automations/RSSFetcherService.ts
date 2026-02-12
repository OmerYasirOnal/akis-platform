/**
 * RSS Fetcher Service
 * Fetches and parses RSS feeds, handles deduplication via link hash.
 * Supports auto-discovery: if a webpage URL is given instead of an RSS feed,
 * the service will attempt to find the RSS feed URL automatically.
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
    timeout: 15000,
    headers: {
      'User-Agent': 'AKIS-SmartAutomations/1.0 (+https://akisflow.com)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  });
}

/** Common RSS/Atom feed paths to probe when auto-discovery fails */
const COMMON_FEED_PATHS = [
  '/feed',
  '/rss',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/feeds/posts/default',        // Blogger
  '/feed/atom',
  '/rss/feed',
  '/.rss',
  '/blog/feed',
  '/news/feed',
  '/arc/outboundfeeds/v3/all/rss.xml', // Reuters Arc
];

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

/**
 * Try to discover RSS/Atom feed URLs from a webpage's HTML.
 * Looks for <link rel="alternate" type="application/rss+xml|atom+xml"> tags.
 */
async function discoverFeedFromHTML(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AKIS-SmartAutomations/1.0 (+https://akisflow.com)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const contentType = res.headers.get('content-type') || '';
    // If response is already XML/RSS, the URL itself is the feed
    if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom')) {
      return [url];
    }

    if (!contentType.includes('html')) return [];

    const html = await res.text();

    // Extract <link> tags with RSS/Atom feed types
    const feedUrls: string[] = [];
    const linkPattern = /<link[^>]+(?:type\s*=\s*["'](?:application\/(?:rss|atom)\+xml|text\/xml)["'][^>]*href\s*=\s*["']([^"']+)["']|href\s*=\s*["']([^"']+)["'][^>]*type\s*=\s*["'](?:application\/(?:rss|atom)\+xml|text\/xml)["'])[^>]*>/gi;
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1] || match[2];
      if (href) {
        // Resolve relative URLs
        try {
          feedUrls.push(new URL(href, url).toString());
        } catch {
          // skip invalid URLs
        }
      }
    }

    return feedUrls;
  } catch {
    return [];
  }
}

/**
 * Probe common feed paths for a given base URL.
 * Returns the first URL that responds with valid XML/RSS content.
 */
async function probeFeedPaths(baseUrl: string): Promise<string | null> {
  const origin = new URL(baseUrl).origin;

  for (const path of COMMON_FEED_PATHS) {
    const candidateUrl = `${origin}${path}`;
    try {
      const res = await fetch(candidateUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'AKIS-SmartAutomations/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('xml') || ct.includes('rss') || ct.includes('atom')) {
        return candidateUrl;
      }
    } catch {
      // skip unreachable paths
    }
  }

  return null;
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
   * Fetch items from multiple RSS sources.
   * If a URL is not a valid RSS feed, auto-discovers the feed URL from
   * the webpage HTML or by probing common feed paths.
   *
   * @param sources List of RSS source configurations
   * @param hoursBack Only include items from the last N hours (default: 24)
   */
  async fetchFromSources(sources: AutomationSource[], hoursBack = 24): Promise<FetchedItem[]> {
    const parser = await getRSSParser();
    const allItems: FetchedItem[] = [];

    for (const source of sources) {
      if (source.type !== 'rss') {
        this.logger.info('Skipping non-RSS source', { url: source.url, type: source.type });
        continue;
      }

      const items = await this.fetchSingleSource(parser, source.url, hoursBack);
      allItems.push(...items);
    }

    return allItems;
  }

  /**
   * Fetch items from a single RSS source URL.
   * Tries direct parse first, then auto-discovers feed URL if it fails.
   */
  private async fetchSingleSource(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: any,
    url: string,
    hoursBack: number
  ): Promise<FetchedItem[]> {
    // Attempt 1: Try direct RSS parse
    const directResult = await this.tryParseFeed(parser, url, hoursBack);
    if (directResult.length > 0) return directResult;

    this.logger.info('Direct RSS parse returned 0 items, attempting auto-discovery', { url });

    // Attempt 2: Discover feed URLs from HTML <link> tags
    const discoveredFeeds = await discoverFeedFromHTML(url);
    if (discoveredFeeds.length > 0) {
      this.logger.info('Discovered feed URLs from HTML', { url, feeds: discoveredFeeds });
      for (const feedUrl of discoveredFeeds.slice(0, 3)) {
        const feedResult = await this.tryParseFeed(parser, feedUrl, hoursBack);
        if (feedResult.length > 0) {
          this.logger.info('Successfully fetched from discovered feed', { original: url, feedUrl, count: feedResult.length });
          return feedResult;
        }
      }
    }

    // Attempt 3: Probe common feed paths
    this.logger.info('Probing common feed paths', { url });
    const probedFeed = await probeFeedPaths(url);
    if (probedFeed) {
      this.logger.info('Found feed via path probing', { url, feedUrl: probedFeed });
      const probeResult = await this.tryParseFeed(parser, probedFeed, hoursBack);
      if (probeResult.length > 0) return probeResult;
    }

    this.logger.error('No RSS feed found after auto-discovery', {
      url,
      hint: 'The URL may not have an RSS feed. Try providing a direct feed URL (e.g. https://example.com/feed or /rss.xml).',
    });

    return [];
  }

  /**
   * Try to parse a single feed URL. Returns items on success, empty array on failure.
   */
  private async tryParseFeed(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: any,
    url: string,
    hoursBack: number
  ): Promise<FetchedItem[]> {
    try {
      this.logger.info('Fetching RSS feed', { url });
      const feed = await parser.parseURL(url);
      const sourceName = feed.title || extractSourceName(url);
      const items: FetchedItem[] = [];

      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;

        const publishedAt = item.pubDate ? new Date(item.pubDate) : undefined;

        // Filter by time
        if (!isWithinHours(publishedAt, hoursBack)) continue;

        // Extract excerpt from content or description
        let excerpt = item.contentSnippet || item.content || item.description || '';
        if (excerpt.length > 200) {
          excerpt = excerpt.substring(0, 197) + '...';
        }
        excerpt = excerpt.replace(/<[^>]*>/g, '').trim();

        items.push({
          title: item.title.trim(),
          link: item.link.trim(),
          linkHash: hashLink(item.link),
          excerpt: excerpt || undefined,
          publishedAt,
          source: sourceName,
        });
      }

      this.logger.info('Fetched items from feed', { url, count: items.length });
      return items;
    } catch (error) {
      this.logger.error('Failed to parse RSS feed', { url, error: String(error) });
      return [];
    }
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
