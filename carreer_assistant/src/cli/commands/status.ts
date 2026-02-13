import { DailyLimitsEnforcer } from '../../core/limits/DailyLimitsEnforcer.js';
import { LimitStore } from '../../core/limits/LimitStore.js';
import { JobFeed } from '../../core/job-discovery/JobFeed.js';
import { ApprovalGateService } from '../../core/approval/ApprovalGateService.js';

export async function statusCommand(opts: {
  days?: string;
}): Promise<void> {
  const limiter = new DailyLimitsEnforcer();
  const store = new LimitStore();
  const feed = new JobFeed();
  const approvalGate = new ApprovalGateService();

  const counters = limiter.getCounters();
  const remaining = limiter.remainingToday();
  const limits = limiter.getLimits();
  const jobStats = feed.getStats();
  const pending = approvalGate.getPending();
  const days = parseInt(opts.days ?? '7', 10);
  const history = store.getHistory(days);
  const totals = store.getTotalStats();

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║           CAREER ASSISTANT — DAILY STATUS        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  console.log('Today:');
  console.log(`  Discovered:  ${counters.discovered}/${limits.maxDiscoverPerDay} (${remaining.discover} remaining)`);
  console.log(`  Shortlisted: ${counters.shortlisted}/${limits.maxShortlistPerDay} (${remaining.shortlist} remaining)`);
  console.log(`  Submitted:   ${counters.submitted}/${limits.maxSubmitPerDay} (${remaining.submit} remaining)`);
  console.log(`  Outreach:    ${counters.outreach}/${limits.maxOutreachPerDay} (${remaining.outreach} remaining)`);
  console.log(`  Follow-ups:  ${counters.followUps}/${limits.maxFollowUpPerDay} (${remaining.followUp} remaining)`);
  console.log('');

  console.log('Job Pipeline:');
  console.log(`  Total jobs: ${jobStats.total}`);
  for (const [state, count] of Object.entries(jobStats.byState)) {
    console.log(`    ${state}: ${count}`);
  }
  console.log(`  Average score: ${Math.round(jobStats.avgScore)}`);
  console.log('');

  console.log('By Platform:');
  for (const [platform, count] of Object.entries(jobStats.byPlatform)) {
    console.log(`  ${platform}: ${count}`);
  }
  console.log('');

  if (pending.length > 0) {
    console.log(`Pending Approvals: ${pending.length}`);
    for (const item of pending.slice(0, 3)) {
      console.log(`  [${item.actionType}] ${item.id.slice(0, 8)}... (${item.platform ?? 'n/a'})`);
    }
    console.log('');
  }

  if (history.length > 1) {
    console.log(`History (last ${days} days):`);
    console.log('  Date       | Disc | Short | Sub | Out');
    console.log('  ' + '─'.repeat(44));
    for (const day of history) {
      console.log(`  ${day.date} | ${pad(day.discovered)} | ${pad(day.shortlisted)}   | ${pad(day.submitted)} | ${pad(day.outreach)}`);
    }
    console.log('');
  }

  console.log('All-time Totals:');
  console.log(`  Active days: ${totals.activeDays}`);
  console.log(`  Discovered: ${totals.totalDiscovered}`);
  console.log(`  Shortlisted: ${totals.totalShortlisted}`);
  console.log(`  Submitted: ${totals.totalSubmitted}`);
  console.log(`  Outreach: ${totals.totalOutreach}`);
}

function pad(n: number): string {
  return String(n).padStart(4, ' ');
}
