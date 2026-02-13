import type { PlatformAdapter } from '../../adapters/base/PlatformAdapter.js';
import type { UserProfile } from '../../config/user-profile.js';
import { DailyLimitsEnforcer } from '../limits/DailyLimitsEnforcer.js';
import { scoreAndRankJobs } from '../scoring/JobScoringModel.js';
import type { NormalizedJob, ScoredJob } from '../scoring/types.js';
import { JobFeed } from './JobFeed.js';
import { AuditLogger } from '../approval/AuditLogger.js';

export interface JobFilters {
  query?: string;
  skills?: string[];
  roleLevel?: string[];
  workModel?: string[];
  minBudget?: number;
  maxResults?: number;
}

export interface DiscoveryResult {
  discovered: NormalizedJob[];
  scored: ScoredJob[];
  shortlisted: ScoredJob[];
  skipped: number;
  limitReached: boolean;
}

export class JobDiscoveryEngine {
  private adapters: PlatformAdapter[];
  private profile: UserProfile;
  private limiter: DailyLimitsEnforcer;
  private feed: JobFeed;
  private audit: AuditLogger;

  constructor(
    adapters: PlatformAdapter[],
    profile: UserProfile,
    limiter?: DailyLimitsEnforcer,
  ) {
    this.adapters = adapters;
    this.profile = profile;
    this.limiter = limiter ?? new DailyLimitsEnforcer();
    this.feed = new JobFeed();
    this.audit = new AuditLogger();
  }

  async discover(filters?: JobFilters): Promise<DiscoveryResult> {
    const allJobs: NormalizedJob[] = [];
    const defaultFilters: JobFilters = {
      skills: this.profile.techStack.slice(0, 5),
      roleLevel: this.profile.targetRoles,
      workModel: this.profile.workModels,
      maxResults: 20,
      ...filters,
    };

    for (const adapter of this.adapters) {
      if (!this.limiter.canDiscover()) {
        break;
      }

      try {
        const jobs = await adapter.searchJobs(defaultFilters);
        for (const job of jobs) {
          if (!this.limiter.canDiscover()) break;
          this.feed.saveJob(job);
          this.limiter.incrementDiscover();
          allJobs.push(job);
        }

        this.audit.log('discover', adapter.platform, null, {
          jobsFound: jobs.length,
          filters: defaultFilters,
        });
      } catch (error) {
        this.audit.log('discover_error', adapter.platform, null, {
          error: error instanceof Error ? error.message : String(error),
        }, 'failure');
      }
    }

    const scored = scoreAndRankJobs(allJobs, this.profile);

    const shortlisted: ScoredJob[] = [];
    const skipped = scored.filter((j) => j.recommendation === 'skip').length;

    for (const job of scored) {
      if (job.recommendation === 'apply' || job.recommendation === 'consider') {
        if (this.limiter.canShortlist()) {
          this.feed.saveScoredJob(job);
          this.limiter.incrementShortlist();
          shortlisted.push(job);
        }
      }
    }

    return {
      discovered: allJobs,
      scored,
      shortlisted,
      skipped,
      limitReached: !this.limiter.canDiscover() || !this.limiter.canShortlist(),
    };
  }

  getAdapters(): PlatformAdapter[] {
    return [...this.adapters];
  }
}
