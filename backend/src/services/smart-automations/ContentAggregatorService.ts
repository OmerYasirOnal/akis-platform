/**
 * Content Aggregator Service
 * Filters and ranks content based on topic relevance
 */

import type { FetchedItem } from './types.js';

interface RankedItem extends FetchedItem {
  relevanceScore: number;
}

export class ContentAggregatorService {
  private logger: { info: (msg: string, data?: unknown) => void };

  constructor(logger?: { info: (msg: string, data?: unknown) => void }) {
    this.logger = logger || {
      info: (msg, data) => console.log(`[ContentAggregator] ${msg}`, data || ''),
    };
  }

  /**
   * Calculate relevance score for an item based on topics
   * Simple keyword matching - can be enhanced with AI later
   */
  private calculateRelevance(item: FetchedItem, topics: string[]): number {
    const text = `${item.title} ${item.excerpt || ''}`.toLowerCase();
    let score = 0;

    for (const topic of topics) {
      const topicLower = topic.toLowerCase();
      
      // Exact match in title is worth more
      if (item.title.toLowerCase().includes(topicLower)) {
        score += 10;
      }
      
      // Match in excerpt
      if (item.excerpt?.toLowerCase().includes(topicLower)) {
        score += 5;
      }

      // Word boundary matches are worth more
      const wordBoundaryRegex = new RegExp(`\\b${topicLower}\\b`, 'gi');
      const matches = text.match(wordBoundaryRegex);
      if (matches) {
        score += matches.length * 3;
      }
    }

    // Boost recent items slightly
    if (item.publishedAt) {
      const hoursAgo = (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 6) score += 3;
      else if (hoursAgo < 12) score += 2;
      else if (hoursAgo < 24) score += 1;
    }

    return score;
  }

  /**
   * Filter items by topics (at least one topic must match)
   */
  filterByTopics(items: FetchedItem[], topics: string[]): FetchedItem[] {
    if (topics.length === 0) return items;

    return items.filter((item) => {
      const text = `${item.title} ${item.excerpt || ''}`.toLowerCase();
      return topics.some((topic) => text.includes(topic.toLowerCase()));
    });
  }

  /**
   * Rank items by relevance to topics
   */
  rankByRelevance(items: FetchedItem[], topics: string[]): RankedItem[] {
    return items
      .map((item) => ({
        ...item,
        relevanceScore: this.calculateRelevance(item, topics),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Select top N most relevant items
   * @param items Fetched items
   * @param topics Topics for relevance filtering
   * @param minItems Minimum items to select (default: 3)
   * @param maxItems Maximum items to select (default: 7)
   */
  selectTopItems(
    items: FetchedItem[],
    topics: string[],
    minItems = 3,
    maxItems = 7
  ): FetchedItem[] {
    if (items.length === 0) return [];

    // First filter by topics
    let filtered = this.filterByTopics(items, topics);

    // If not enough items match topics, use all items
    if (filtered.length < minItems) {
      this.logger.info('Not enough topic matches, using all items', {
        topicMatches: filtered.length,
        total: items.length,
      });
      filtered = items;
    }

    // Rank by relevance
    const ranked = this.rankByRelevance(filtered, topics);

    // Select top items
    const selected = ranked.slice(0, maxItems);

    // Ensure minimum diversity by source if possible
    const selectedBySource = new Map<string, number>();
    for (const item of selected) {
      selectedBySource.set(item.source, (selectedBySource.get(item.source) || 0) + 1);
    }

    this.logger.info('Selected items for draft', {
      count: selected.length,
      sources: Object.fromEntries(selectedBySource),
      topRelevance: selected[0]?.relevanceScore || 0,
    });

    return selected;
  }
}

export const contentAggregatorService = new ContentAggregatorService();
