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
}

export class LinkedInAdapter extends BrowserAdapter implements PlatformAdapter {
  constructor() {
    super(PLATFORM_CONFIGS.linkedin);
  }

  private get p(): PageLike {
    return this.page as PageLike;
  }

  async searchJobs(filters: JobFilters): Promise<NormalizedJob[]> {
    const query = filters.query ?? filters.skills?.join(' ') ?? 'typescript junior developer';
    const params = new URLSearchParams({
      keywords: query,
      f_E: '1,2',
      f_WT: '2',
      sortBy: 'DD',
    });
    const url = `${this.config.baseUrl}/jobs/search/?${params}`;

    await this.p.goto(url, { waitUntil: 'domcontentloaded' });
    await this.delay();

    try {
      await this.p.waitForSelector('.job-card-container, .jobs-search-results__list-item', { timeout: 15000 });
    } catch {
      return [];
    }

    const cards = await this.p.$$eval('.job-card-container, .jobs-search-results__list-item', (elements) => {
      return elements.slice(0, 20).map((el) => {
        const titleEl = el.querySelector('.job-card-list__title, .job-card-container__link') as HTMLElement | null;
        const companyEl = el.querySelector('.job-card-container__primary-description, .artdeco-entity-lockup__subtitle') as HTMLElement | null;
        const locationEl = el.querySelector('.job-card-container__metadata-wrapper, .artdeco-entity-lockup__caption') as HTMLElement | null;
        const linkEl = el.querySelector('a') as HTMLAnchorElement | null;
        return {
          title: titleEl?.textContent?.trim() ?? '',
          company: companyEl?.textContent?.trim() ?? '',
          location: locationEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
        };
      });
    }) as Array<{ title: string; company: string; location: string; url: string }>;

    return cards
      .filter((c) => c.title)
      .map((card, i) => {
        const workModel = card.location.toLowerCase().includes('remote') ? 'remote'
          : card.location.toLowerCase().includes('hybrid') ? 'hybrid'
          : 'unknown';

        return normalizeJob('linkedin', {
          platformJobId: `linkedin-${Date.now()}-${i}`,
          title: card.title,
          description: `${card.title} at ${card.company}. Location: ${card.location}`,
          companyName: card.company,
          workModel,
          location: card.location || null,
          url: card.url.startsWith('http') ? card.url : `${this.config.baseUrl}${card.url}`,
        });
      });
  }

  async getJobDetails(jobId: string): Promise<NormalizedJob> {
    const url = jobId.startsWith('http') ? jobId : `${this.config.baseUrl}/jobs/view/${jobId}`;
    await this.p.goto(url, { waitUntil: 'domcontentloaded' });
    await this.delay();

    const title = (await this.p.textContent('h1')) ?? 'Unknown';
    const description = (await this.p.textContent('.description__text, .show-more-less-html__markup')) ?? '';

    return normalizeJob('linkedin', {
      platformJobId: jobId,
      title,
      description,
      url,
    });
  }

  async submitProposal(_jobId: string, _proposal: Proposal): Promise<SubmissionResult> {
    return {
      success: false,
      error: 'LinkedIn auto-apply is disabled for compliance. Use LinkedIn Easy Apply manually.',
      platform: 'linkedin',
    };
  }

  async getProfile(): Promise<PlatformProfile> {
    return {
      platform: 'linkedin',
      profileId: 'linkedin-self',
      displayName: process.env.USER_NAME ?? 'Unknown',
      title: 'Junior Software Developer',
      description: '',
      skills: [],
      profileUrl: `${this.config.baseUrl}/in/me`,
      completeness: 0,
    };
  }

  async updateProfile(_updates: ProfileUpdate): Promise<void> {
    throw new Error('LinkedIn profile update not supported via automation — use web UI');
  }
}
