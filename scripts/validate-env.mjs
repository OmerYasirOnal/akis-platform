#!/usr/bin/env node
/**
 * Environment Validation Script
 * Checks if all required environment variables are set
 * 
 * Usage: node scripts/validate-env.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(condition, successMsg, failMsg) {
  if (condition) {
    log(`✅ ${successMsg}`, 'green');
    return true;
  } else {
    log(`❌ ${failMsg}`, 'red');
    return false;
  }
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Load .env.local
function loadEnv() {
  const envPath = join(rootDir, '.env.local');
  
  if (!existsSync(envPath)) {
    log('❌ .env.local file not found!', 'red');
    log('', 'reset');
    info('Create .env.local file in the devagents/ directory');
    info('Copy the template from docs/ENV_LOCAL_TEMPLATE.md');
    return null;
  }

  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    }
  });

  return env;
}

async function main() {
  log('', 'reset');
  log('═══════════════════════════════════════════════', 'cyan');
  log('  AKIS Platform - Environment Validation', 'cyan');
  log('═══════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  const env = loadEnv();
  if (!env) {
    process.exit(1);
  }

  let allPassed = true;
  let criticalFailed = false;

  // ========================================
  // AI/LLM Configuration (CRITICAL)
  // ========================================
  log('🤖 AI/LLM Configuration', 'blue');
  log('─'.repeat(47), 'blue');

  const hasOpenRouter = check(
    env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY !== '',
    'OPENROUTER_API_KEY is set',
    'OPENROUTER_API_KEY is missing'
  );

  const hasOpenAI = check(
    env.OPENAI_API_KEY && env.OPENAI_API_KEY !== '',
    'OPENAI_API_KEY is set (fallback)',
    'OPENAI_API_KEY is not set (optional)'
  );

  if (!hasOpenRouter && !hasOpenAI) {
    log('', 'reset');
    log('🚨 CRITICAL: No AI API key found!', 'red');
    log('', 'reset');
    info('You need at least one of:');
    info('  1. OPENROUTER_API_KEY (recommended - FREE)');
    info('  2. OPENAI_API_KEY (alternative)');
    log('', 'reset');
    info('Get FREE OpenRouter key at: https://openrouter.ai/keys');
    criticalFailed = true;
  } else if (hasOpenRouter) {
    info('Using OpenRouter API (recommended)');
  } else if (hasOpenAI) {
    warn('Using OpenAI API (may have compatibility issues with OpenRouter models)');
  }

  log('', 'reset');

  // ========================================
  // GitHub OAuth (IMPORTANT)
  // ========================================
  log('🔐 GitHub OAuth Configuration', 'blue');
  log('─'.repeat(47), 'blue');

  const hasGitHubClientId = check(
    env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_ID !== '',
    'GITHUB_CLIENT_ID is set',
    'GITHUB_CLIENT_ID is missing'
  );

  const hasGitHubClientSecret = check(
    env.GITHUB_CLIENT_SECRET && env.GITHUB_CLIENT_SECRET !== '',
    'GITHUB_CLIENT_SECRET is set',
    'GITHUB_CLIENT_SECRET is missing'
  );

  const hasPublicGitHubClientId = check(
    env.NEXT_PUBLIC_GITHUB_CLIENT_ID && env.NEXT_PUBLIC_GITHUB_CLIENT_ID !== '',
    'NEXT_PUBLIC_GITHUB_CLIENT_ID is set',
    'NEXT_PUBLIC_GITHUB_CLIENT_ID is missing'
  );

  if (!hasGitHubClientId || !hasGitHubClientSecret || !hasPublicGitHubClientId) {
    log('', 'reset');
    warn('GitHub OAuth is not fully configured');
    warn('User login and repository access may not work');
    info('Create OAuth App at: https://github.com/settings/developers');
    allPassed = false;
  } else {
    info('GitHub OAuth is ready');
  }

  log('', 'reset');

  // ========================================
  // GitHub App (OPTIONAL)
  // ========================================
  log('🤖 GitHub App Configuration (Optional)', 'blue');
  log('─'.repeat(47), 'blue');

  const hasGitHubAppId = env.GITHUB_APP_ID && env.GITHUB_APP_ID !== '';
  const hasGitHubAppInstallationId = env.GITHUB_APP_INSTALLATION_ID && env.GITHUB_APP_INSTALLATION_ID !== '';
  const hasGitHubAppPrivateKey = env.GITHUB_APP_PRIVATE_KEY_PEM && env.GITHUB_APP_PRIVATE_KEY_PEM !== '';

  if (hasGitHubAppId && hasGitHubAppInstallationId && hasGitHubAppPrivateKey) {
    log('✅ GitHub App is fully configured', 'green');
    info('Agents can use GitHub App authentication (recommended)');
  } else if (hasGitHubAppId || hasGitHubAppInstallationId || hasGitHubAppPrivateKey) {
    warn('GitHub App is partially configured');
    warn('Missing variables will cause GitHub App auth to fail');
    if (!hasGitHubAppId) warn('  - GITHUB_APP_ID is missing');
    if (!hasGitHubAppInstallationId) warn('  - GITHUB_APP_INSTALLATION_ID is missing');
    if (!hasGitHubAppPrivateKey) warn('  - GITHUB_APP_PRIVATE_KEY_PEM is missing');
  } else {
    info('GitHub App is not configured (using OAuth only)');
    info('This is OK, but GitHub App is more secure');
  }

  log('', 'reset');

  // ========================================
  // Agent Configuration
  // ========================================
  log('⚙️  Agent Configuration', 'blue');
  log('─'.repeat(47), 'blue');

  check(
    env.ALLOW_LOW_DAS !== undefined,
    `ALLOW_LOW_DAS = ${env.ALLOW_LOW_DAS || 'false'}`,
    'ALLOW_LOW_DAS is not set (using default: false)'
  );

  check(
    env.MAX_FILES_TO_SCAN !== undefined,
    `MAX_FILES_TO_SCAN = ${env.MAX_FILES_TO_SCAN || '200'}`,
    'MAX_FILES_TO_SCAN is not set (using default: 200)'
  );

  check(
    env.MAX_RUN_TIME !== undefined,
    `MAX_RUN_TIME = ${env.MAX_RUN_TIME || '180'}`,
    'MAX_RUN_TIME is not set (using default: 180)'
  );

  log('', 'reset');

  // ========================================
  // Summary
  // ========================================
  log('═══════════════════════════════════════════════', 'cyan');
  log('  Validation Summary', 'cyan');
  log('═══════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  if (criticalFailed) {
    log('❌ CRITICAL ISSUES FOUND', 'red');
    log('', 'reset');
    log('The application WILL NOT WORK without fixing these issues:', 'red');
    log('  1. Add OPENROUTER_API_KEY or OPENAI_API_KEY to .env.local', 'red');
    log('', 'reset');
    log('Get FREE OpenRouter API key:', 'yellow');
    log('  → https://openrouter.ai/keys', 'cyan');
    log('', 'reset');
    process.exit(1);
  } else if (!allPassed) {
    log('⚠️  WARNINGS FOUND', 'yellow');
    log('', 'reset');
    log('The application may work with limited functionality.', 'yellow');
    log('Consider fixing the warnings for full features.', 'yellow');
    log('', 'reset');
    process.exit(0);
  } else {
    log('✅ ALL CHECKS PASSED', 'green');
    log('', 'reset');
    log('Your environment is properly configured!', 'green');
    log('You can now run: npm run dev', 'cyan');
    log('', 'reset');
    process.exit(0);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

