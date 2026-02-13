import { loadUserProfile } from '../../config/user-profile.js';
import { JobFeed } from '../../core/job-discovery/JobFeed.js';
import { scoreAndRankJobs } from '../../core/scoring/JobScoringModel.js';
import { generateExplanation } from '../../core/scoring/ScoringExplainer.js';
import { getRecommendation } from '../../config/scoring.js';

export async function scoreCommand(opts: {
  top?: string;
  rescore?: boolean;
}): Promise<void> {
  const profile = loadUserProfile();
  const feed = new JobFeed();
  const topN = parseInt(opts.top ?? '10', 10);

  const jobs = opts.rescore
    ? feed.getRecentJobs(100)
    : feed.getJobsByState('discovered', 100);

  if (jobs.length === 0) {
    console.log('No unscored jobs found. Run `career discover` first.');
    return;
  }

  console.log(`Scoring ${jobs.length} jobs...`);
  console.log('');

  const scored = scoreAndRankJobs(jobs, profile);

  for (const job of scored) {
    feed.saveScoredJob(job);
  }

  const top = scored.slice(0, topN);

  for (const job of top) {
    const explanation = generateExplanation(job.scoreBreakdown, job.score, getRecommendation(job.score));
    console.log(`[${job.platform}] ${job.title}`);
    console.log(`Company: ${job.companyName}`);
    console.log(`URL: ${job.url}`);
    console.log('');
    console.log(explanation);
    console.log('');
    console.log('─'.repeat(50));
    console.log('');
  }

  const stats = {
    total: scored.length,
    apply: scored.filter((j) => j.recommendation === 'apply').length,
    consider: scored.filter((j) => j.recommendation === 'consider').length,
    skip: scored.filter((j) => j.recommendation === 'skip').length,
    avgScore: Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length),
  };

  console.log('Summary:');
  console.log(`  Total scored: ${stats.total}`);
  console.log(`  Apply (>=70): ${stats.apply}`);
  console.log(`  Consider (50-69): ${stats.consider}`);
  console.log(`  Skip (<50): ${stats.skip}`);
  console.log(`  Average score: ${stats.avgScore}`);
}
