/**
 * Unit tests for ContentAggregatorService and LinkedInDraftGenerator helpers
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

import { ContentAggregatorService } from '../../src/services/smart-automations/ContentAggregatorService.js';
import type { FetchedItem, DraftResult } from '../../src/services/smart-automations/types.js';

// ─── Helpers ───────────────────────────────────────────────────────

const silentLogger = {
  info: () => {},
  error: () => {},
};

function makeItem(overrides: Partial<FetchedItem> = {}): FetchedItem {
  return {
    title: 'Default Title',
    link: 'https://example.com/article',
    linkHash: 'abc123',
    source: 'example.com',
    ...overrides,
  };
}

// ─── Re-create createFallbackDraft (contract test) ─────────────────

function createFallbackDraft(items: FetchedItem[], language: 'tr' | 'en'): DraftResult {
  const title = language === 'tr' ? 'Günün Öne Çıkanları' : "Today's Highlights";
  const intro = language === 'tr'
    ? 'İşte bugün dikkatimi çeken gelişmeler:'
    : 'Here are the developments that caught my attention today:';

  const bullets = items
    .slice(0, 5)
    .map((item) => `• ${item.title}`)
    .join('\n');

  const sources = items.map((item) => item.link);

  return {
    draft: `${title}\n\n${intro}\n\n${bullets}\n\nKaynaklar: Aşağıdaki linklere bakabilirsiniz.`,
    summary: language === 'tr' ? 'Günlük içerik özeti' : 'Daily content summary',
    hashtags: ['#news', '#insights', '#daily'],
    sources,
  };
}

// ─── ContentAggregatorService.filterByTopics ──────────────────────

describe('ContentAggregatorService.filterByTopics', () => {
  const svc = new ContentAggregatorService(silentLogger);

  test('returns all items when no topics given', () => {
    const items = [makeItem({ title: 'AI News' }), makeItem({ title: 'Cooking Tips' })];
    const result = svc.filterByTopics(items, []);
    assert.strictEqual(result.length, 2);
  });

  test('filters items matching topic in title', () => {
    const items = [
      makeItem({ title: 'New AI Framework Released' }),
      makeItem({ title: 'Sports Update' }),
    ];
    const result = svc.filterByTopics(items, ['AI']);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].title.includes('AI'));
  });

  test('filters items matching topic in excerpt', () => {
    const items = [
      makeItem({ title: 'Tech Update', excerpt: 'Latest developments in machine learning' }),
      makeItem({ title: 'Weather Forecast', excerpt: 'Rain expected tomorrow' }),
    ];
    const result = svc.filterByTopics(items, ['machine learning']);
    assert.strictEqual(result.length, 1);
  });

  test('case insensitive matching', () => {
    const items = [makeItem({ title: 'typescript is great' })];
    const result = svc.filterByTopics(items, ['TypeScript']);
    assert.strictEqual(result.length, 1);
  });

  test('returns empty array when no matches', () => {
    const items = [makeItem({ title: 'Cooking Recipe' })];
    const result = svc.filterByTopics(items, ['blockchain']);
    assert.strictEqual(result.length, 0);
  });

  test('matches any of multiple topics (OR logic)', () => {
    const items = [
      makeItem({ title: 'React 19 Released' }),
      makeItem({ title: 'Rust 2.0 Launched' }),
      makeItem({ title: 'Weather Report' }),
    ];
    const result = svc.filterByTopics(items, ['React', 'Rust']);
    assert.strictEqual(result.length, 2);
  });
});

// ─── ContentAggregatorService.rankByRelevance ─────────────────────

describe('ContentAggregatorService.rankByRelevance', () => {
  const svc = new ContentAggregatorService(silentLogger);

  test('returns items sorted by relevance score descending', () => {
    const items = [
      makeItem({ title: 'Sports News Today' }),
      makeItem({ title: 'AI AI AI Revolution in AI' }),
      makeItem({ title: 'Weather Update' }),
    ];
    const ranked = svc.rankByRelevance(items, ['AI']);
    assert.strictEqual(ranked[0].title, 'AI AI AI Revolution in AI');
    assert.ok(ranked[0].relevanceScore > ranked[1].relevanceScore);
  });

  test('title match scores higher than excerpt match', () => {
    const items = [
      makeItem({ title: 'AI Breakthrough', excerpt: 'Something else' }),
      makeItem({ title: 'Something else', excerpt: 'AI mentioned here' }),
    ];
    const ranked = svc.rankByRelevance(items, ['AI']);
    assert.ok(ranked[0].relevanceScore > ranked[1].relevanceScore);
    assert.strictEqual(ranked[0].title, 'AI Breakthrough');
  });

  test('recent items get recency boost', () => {
    const old = makeItem({
      title: 'AI News',
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    const recent = makeItem({
      title: 'AI News',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    const ranked = svc.rankByRelevance([old, recent], ['AI']);
    // Both match equally on text, but recent one gets boost
    assert.ok(ranked[0].relevanceScore >= ranked[1].relevanceScore);
  });

  test('items with no topic match get score 0 (ignoring recency)', () => {
    const items = [makeItem({ title: 'Cooking Tips' })];
    const ranked = svc.rankByRelevance(items, ['blockchain']);
    assert.strictEqual(ranked[0].relevanceScore, 0);
  });
});

// ─── ContentAggregatorService.selectTopItems ──────────────────────

describe('ContentAggregatorService.selectTopItems', () => {
  const svc = new ContentAggregatorService(silentLogger);

  test('returns empty array for empty input', () => {
    const result = svc.selectTopItems([], ['AI']);
    assert.strictEqual(result.length, 0);
  });

  test('limits to maxItems', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeItem({ title: `AI Article ${i}`, linkHash: `h${i}` })
    );
    const result = svc.selectTopItems(items, ['AI'], 3, 5);
    assert.ok(result.length <= 5);
  });

  test('falls back to all items when too few match topics', () => {
    const items = [
      makeItem({ title: 'AI News' }),
      makeItem({ title: 'Sports' }),
      makeItem({ title: 'Weather' }),
      makeItem({ title: 'Cooking' }),
    ];
    // Only 1 matches 'AI', but minItems=3, so it falls back to all
    const result = svc.selectTopItems(items, ['AI'], 3, 7);
    assert.ok(result.length >= 3);
  });

  test('returns matched items when enough match', () => {
    const items = [
      makeItem({ title: 'AI Framework Released' }),
      makeItem({ title: 'AI Model Training Tips' }),
      makeItem({ title: 'AI in Healthcare' }),
      makeItem({ title: 'AI for Education' }),
      makeItem({ title: 'Cooking Recipe' }),
    ];
    const result = svc.selectTopItems(items, ['AI'], 3, 7);
    // All 4 AI items should be included
    assert.ok(result.length >= 3);
    // Cooking recipe should not be in top results (or very low)
    const titles = result.map((r) => r.title);
    assert.ok(titles.includes('AI Framework Released'));
  });
});

// ─── createFallbackDraft (contract test) ──────────────────────────

describe('createFallbackDraft', () => {
  const items: FetchedItem[] = [
    makeItem({ title: 'Article One', link: 'https://a.com/1' }),
    makeItem({ title: 'Article Two', link: 'https://b.com/2' }),
    makeItem({ title: 'Article Three', link: 'https://c.com/3' }),
  ];

  test('generates Turkish draft', () => {
    const result = createFallbackDraft(items, 'tr');
    assert.ok(result.draft.includes('Günün Öne Çıkanları'));
    assert.ok(result.draft.includes('• Article One'));
    assert.strictEqual(result.summary, 'Günlük içerik özeti');
  });

  test('generates English draft', () => {
    const result = createFallbackDraft(items, 'en');
    assert.ok(result.draft.includes("Today's Highlights"));
    assert.ok(result.draft.includes('• Article Two'));
    assert.strictEqual(result.summary, 'Daily content summary');
  });

  test('includes default hashtags', () => {
    const result = createFallbackDraft(items, 'en');
    assert.deepStrictEqual(result.hashtags, ['#news', '#insights', '#daily']);
  });

  test('sources are item links', () => {
    const result = createFallbackDraft(items, 'en');
    assert.deepStrictEqual(result.sources, ['https://a.com/1', 'https://b.com/2', 'https://c.com/3']);
  });

  test('limits bullets to 5 items', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) =>
      makeItem({ title: `Item ${i}`, link: `https://x.com/${i}` })
    );
    const result = createFallbackDraft(manyItems, 'en');
    const bulletCount = (result.draft.match(/•/g) || []).length;
    assert.strictEqual(bulletCount, 5);
  });
});
