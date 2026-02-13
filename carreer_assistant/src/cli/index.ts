#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

// Load .env from project root
config({ path: resolve(import.meta.dirname ?? '.', '../.env') });

// Ensure data directory exists
const dataDir = resolve(process.env.DATABASE_PATH ?? './data/career.db', '..');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const program = new Command();

program
  .name('career')
  .description('Career Assistant — Autonomous job search and freelance platform orchestrator')
  .version('0.1.0');

program
  .command('discover')
  .description('Discover jobs across all enabled platforms')
  .option('-q, --query <query>', 'Search query')
  .option('-n, --max <number>', 'Maximum jobs to discover', '20')
  .option('-p, --platform <platform>', 'Specific platform (upwork|freelancer|fiverr|bionluk|linkedin)')
  .action(async (opts) => {
    const { discoverCommand } = await import('./commands/discover.js');
    await discoverCommand(opts);
  });

program
  .command('score')
  .description('Score and rank discovered jobs')
  .option('-n, --top <number>', 'Show top N jobs', '10')
  .option('--rescore', 'Re-score all unscored jobs')
  .action(async (opts) => {
    const { scoreCommand } = await import('./commands/score.js');
    await scoreCommand(opts);
  });

program
  .command('apply')
  .description('Generate proposal and apply to a job')
  .requiredOption('--job-id <id>', 'Job ID to apply for')
  .option('--auto-approve', 'Skip human approval (use with caution)')
  .action(async (opts) => {
    const { applyCommand } = await import('./commands/apply.js');
    await applyCommand(opts);
  });

program
  .command('status')
  .description('Show daily status and statistics')
  .option('-d, --days <number>', 'Show history for N days', '7')
  .action(async (opts) => {
    const { statusCommand } = await import('./commands/status.js');
    await statusCommand(opts);
  });

program
  .command('profile')
  .description('Manage platform profiles')
  .option('--sync', 'Sync all platform profiles')
  .option('--show <platform>', 'Show profile for specific platform')
  .action(async (opts) => {
    const { profileCommand } = await import('./commands/profile.js');
    await profileCommand(opts);
  });

program
  .command('approve')
  .description('Manage pending approvals')
  .option('--list', 'List pending approvals')
  .option('--approve <id>', 'Approve a pending action')
  .option('--reject <id>', 'Reject a pending action')
  .option('--expire', 'Expire stale approvals')
  .action(async (opts) => {
    const { approveCommand } = await import('./commands/approve.js');
    await approveCommand(opts);
  });

program.parse();
