import { loadUserProfile } from '../../config/user-profile.js';
import { JobDiscoveryEngine, type JobFilters } from '../../core/job-discovery/JobDiscoveryEngine.js';
import { DailyLimitsEnforcer } from '../../core/limits/DailyLimitsEnforcer.js';
import { UpworkAdapter } from '../../adapters/upwork/UpworkAdapter.js';
import { FreelancerAdapter } from '../../adapters/freelancer/FreelancerAdapter.js';
import type { PlatformAdapter } from '../../adapters/base/PlatformAdapter.js';
import { getEnabledPlatforms } from '../../config/platforms.js';

export async function discoverCommand(opts: {
  query?: string;
  max?: string;
  platform?: string;
}): Promise<void> {
  const profile = loadUserProfile();
  const limiter = new DailyLimitsEnforcer();

  const remaining = limiter.remainingToday();
  if (remaining.discover === 0) {
    console.log('Daily discovery limit reached. Try again tomorrow.');
    return;
  }

  console.log(`Remaining today: discover=${remaining.discover}, shortlist=${remaining.shortlist}`);
  console.log('');

  const adapters: PlatformAdapter[] = [];
  const enabledPlatforms = getEnabledPlatforms();

  for (const config of enabledPlatforms) {
    if (opts.platform && config.platform !== opts.platform) continue;

    try {
      if (config.method === 'api') {
        let adapter: PlatformAdapter;
        if (config.platform === 'upwork') {
          adapter = new UpworkAdapter();
        } else if (config.platform === 'freelancer') {
          adapter = new FreelancerAdapter();
        } else {
          continue;
        }
        await adapter.initialize();
        adapters.push(adapter);
      }
      // Browser adapters require playwright — skip in discovery CLI for now
    } catch (error) {
      console.warn(`Skipping ${config.platform}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (adapters.length === 0) {
    console.log('No platform adapters available. Check your .env configuration.');
    console.log('Required: UPWORK_ACCESS_TOKEN or FREELANCER_OAUTH_TOKEN');
    return;
  }

  const engine = new JobDiscoveryEngine(adapters, profile, limiter);
  const filters: JobFilters = {
    query: opts.query,
    maxResults: parseInt(opts.max ?? '20', 10),
    skills: profile.techStack.slice(0, 5),
    roleLevel: profile.targetRoles,
    workModel: profile.workModels,
  };

  console.log(`Discovering jobs across ${adapters.map((a) => a.platform).join(', ')}...`);
  console.log('');

  try {
    const result = await engine.discover(filters);

    console.log(`Discovered: ${result.discovered.length} jobs`);
    console.log(`Scored: ${result.scored.length} jobs`);
    console.log(`Shortlisted: ${result.shortlisted.length} jobs`);
    console.log(`Skipped: ${result.skipped} jobs`);
    console.log('');

    if (result.shortlisted.length > 0) {
      console.log('Top matches:');
      for (const job of result.shortlisted.slice(0, 5)) {
        console.log(`  [${job.score}] ${job.title} — ${job.companyName} (${job.platform})`);
        console.log(`       ${job.recommendation.toUpperCase()} | ${job.workModel} | ${job.techStack.slice(0, 3).join(', ')}`);
        console.log(`       ${job.url}`);
        console.log('');
      }
    }

    if (result.limitReached) {
      console.log('Daily limit reached. Remaining jobs queued for tomorrow.');
    }
  } finally {
    for (const adapter of adapters) {
      await adapter.teardown();
    }
  }
}
