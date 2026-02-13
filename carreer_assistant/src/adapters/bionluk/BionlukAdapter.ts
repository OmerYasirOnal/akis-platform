import { BrowserAdapter } from '../base/BrowserAdapter.js';
import { PLATFORM_CONFIGS } from '../../config/platforms.js';
import type { PlatformAdapter, Proposal, SubmissionResult, PlatformProfile, ProfileUpdate } from '../base/PlatformAdapter.js';
import type { NormalizedJob } from '../../core/scoring/types.js';
import type { JobFilters } from '../../core/job-discovery/JobDiscoveryEngine.js';
import { normalizeJob } from '../../core/job-discovery/JobNormalizer.js';

interface PageLike {
  goto(url: string, opts?: Record<string, unknown>): Promise<unknown>;
  waitForSelector(selector: string, opts?: Record<string, unknown>): Promise<unknown>;
  $$eval(selector: string, fn: (els: Element[]) => unknown[]): Promise<unknown[]>;
  textContent(selector: string): Promise<string | null>;
  fill(selector: string, value: string): Promise<void>;
  click(selector: string): Promise<void>;
}

export class BionlukAdapter extends BrowserAdapter implements PlatformAdapter {
  constructor() {
    super(PLATFORM_CONFIGS.bionluk);
  }

  private get p(): PageLike {
    return this.page as PageLike;
  }

  async searchJobs(filters: JobFilters): Promise<NormalizedJob[]> {
    const query = filters.query ?? filters.skills?.join(' ') ?? 'web geliştirme';
    const url = `${this.config.baseUrl}/ara?q=${encodeURIComponent(query)}`;

    await this.p.goto(url, { waitUntil: 'domcontentloaded' });
    await this.delay();

    try {
      await this.p.waitForSelector('.service-card, .listing-card, .search-result-item', { timeout: 10000 });
    } catch {
      return [];
    }

    const cards = await this.p.$$eval('.service-card, .listing-card, .search-result-item', (elements) => {
      return elements.slice(0, 20).map((el) => {
        const titleEl = el.querySelector('h3, .title, .service-title') as HTMLElement | null;
        const priceEl = el.querySelector('.price, .service-price') as HTMLElement | null;
        const linkEl = el.querySelector('a') as HTMLAnchorElement | null;
        const sellerEl = el.querySelector('.username, .seller-name') as HTMLElement | null;
        return {
          title: titleEl?.textContent?.trim() ?? '',
          price: priceEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
          seller: sellerEl?.textContent?.trim() ?? '',
        };
      });
    }) as Array<{ title: string; price: string; url: string; seller: string }>;

    return cards
      .filter((c) => c.title && c.url)
      .map((card, i) =>
        normalizeJob('bionluk', {
          platformJobId: `bionluk-${Date.now()}-${i}`,
          title: card.title,
          description: card.title,
          companyName: card.seller,
          url: card.url.startsWith('http') ? card.url : `${this.config.baseUrl}${card.url}`,
        }),
      );
  }

  async getJobDetails(jobId: string): Promise<NormalizedJob> {
    const url = jobId.startsWith('http') ? jobId : `${this.config.baseUrl}/hizmet/${jobId}`;
    await this.p.goto(url, { waitUntil: 'domcontentloaded' });
    await this.delay();

    const title = (await this.p.textContent('h1')) ?? 'Unknown';
    const description = (await this.p.textContent('.description, .service-description')) ?? '';

    return normalizeJob('bionluk', {
      platformJobId: jobId,
      title,
      description,
      url,
    });
  }

  async submitProposal(_jobId: string, _proposal: Proposal): Promise<SubmissionResult> {
    return {
      success: false,
      error: 'Bionluk proposal submission requires manual action for compliance',
      platform: 'bionluk',
    };
  }

  async getProfile(): Promise<PlatformProfile> {
    return {
      platform: 'bionluk',
      profileId: 'bionluk-self',
      displayName: process.env.USER_NAME ?? 'Unknown',
      title: 'TypeScript Full-Stack Developer',
      description: '',
      skills: ['typescript', 'react', 'nodejs', 'web-geliştirme'],
      profileUrl: this.config.baseUrl,
      completeness: 0,
    };
  }

  async updateProfile(_updates: ProfileUpdate): Promise<void> {
    throw new Error('Bionluk profile update requires manual action via web UI');
  }
}
