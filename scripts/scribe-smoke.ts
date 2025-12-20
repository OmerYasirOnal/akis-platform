#!/usr/bin/env tsx
/**
 * Deterministic Scribe smoke test (API-only, no UI)
 *
 * Usage:
 *   SCRIBE_SMOKE_EMAIL="qa@example.com" \
 *   SCRIBE_SMOKE_PASSWORD="Pass123!" \
 *   SCRIBE_SMOKE_OWNER="my-org" \
 *   SCRIBE_SMOKE_REPO="my-repo" \
 *   SCRIBE_SMOKE_BRANCH="main" \
 *   pnpm exec tsx scripts/scribe-smoke.ts
 *
 * Requirements:
 *   - Backend running at SCRIBE_SMOKE_BACKEND_URL (default http://localhost:3000)
 *   - SCRIBE_DEV_GITHUB_BOOTSTRAP=true and helper route enabled
 *   - Test user credentials with email/password login enabled
 */

import { randomUUID } from 'crypto';

type StepStatus = 'PASS' | 'FAIL';

interface StepResult {
  name: string;
  status: StepStatus;
  detail?: string;
}

class CookieJar {
  private cookies: Record<string, string> = {};

  apply(headers: Record<string, string>): Record<string, string> {
    if (Object.keys(this.cookies).length > 0) {
      headers['cookie'] = Object.entries(this.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }
    return headers;
  }

  capture(setCookieHeaders: string[] = []) {
    setCookieHeaders.forEach((cookieHeader) => {
      const [pair] = cookieHeader.split(';');
      const [key, ...rest] = pair.split('=');
      if (!key) return;
      this.cookies[key.trim()] = rest.join('=').trim();
    });
  }
}

interface SmokeConfig {
  backendUrl: string;
  owner: string;
  repo: string;
  branch: string;
  email: string;
  password: string;
  timeoutMs: number;
}

const steps: StepResult[] = [];

function recordStep(name: string, status: StepStatus, detail?: string) {
  const entry = { name, status, detail };
  steps.push(entry);
  const summary = detail ? `${name} → ${status} (${detail})` : `${name} → ${status}`;
  console.log(summary);
  if (status === 'FAIL') {
    throw new Error(detail ? `${name}: ${detail}` : `${name} failed`);
  }
}

async function fetchJson(
  config: SmokeConfig,
  jar: CookieJar,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
) {
  const url = `${config.backendUrl}${path}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': 'scribe-smoke/1.0',
  };
  jar.apply(headers);

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    jar.capture([setCookieHeader]);
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Unexpected non-JSON response from ${path}: ${text.slice(0, 200)}`);
  }

  return { response, data };
}

async function login(config: SmokeConfig, jar: CookieJar) {
  const { response } = await fetchJson(
    config,
    jar,
    'POST',
    '/auth/login',
    {
      email: config.email,
      password: config.password,
    }
  );

  if (!response.ok) {
    throw new Error(`Login failed (${response.status})`);
  }
}

async function bootstrapGitHub(config: SmokeConfig, jar: CookieJar) {
  const { response } = await fetchJson(config, jar, 'POST', '/test/github/bootstrap', {});
  if (!response.ok) {
    throw new Error(`GitHub bootstrap failed (${response.status})`);
  }
}

async function createScribeJob(config: SmokeConfig, jar: CookieJar, userId: string) {
  const payload = {
    type: 'scribe',
    payload: {
      owner: config.owner,
      repo: config.repo,
      baseBranch: config.branch,
      dryRun: true,
      userId,
    },
  };

  const { response, data } = await fetchJson(config, jar, 'POST', '/api/agents/jobs', payload);
  if (!response.ok) {
    throw new Error(`Failed to create job (${response.status})`);
  }
  return data.jobId as string;
}

async function fetchCurrentUser(config: SmokeConfig, jar: CookieJar) {
  const { response, data } = await fetchJson(config, jar, 'GET', '/auth/me');
  if (!response.ok || !data?.id) {
    throw new Error('Unable to fetch authenticated user');
  }
  return { id: data.id as string, email: data.email as string };
}

async function pollJob(config: SmokeConfig, jar: CookieJar, jobId: string) {
  const start = Date.now();
  while (Date.now() - start < config.timeoutMs) {
    const { data } = await fetchJson(
      config,
      jar,
      'GET',
      `/api/agents/jobs/${jobId}?include=trace,artifacts`
    );
    if (data?.state === 'completed' || data?.state === 'failed') {
      return data;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`Job ${jobId} did not complete within ${config.timeoutMs}ms`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const config: SmokeConfig = {
    backendUrl: process.env.SCRIBE_SMOKE_BACKEND_URL || 'http://localhost:3000',
    owner: requireEnv('SCRIBE_SMOKE_OWNER'),
    repo: requireEnv('SCRIBE_SMOKE_REPO'),
    branch: process.env.SCRIBE_SMOKE_BRANCH || 'main',
    email: requireEnv('SCRIBE_SMOKE_EMAIL'),
    password: requireEnv('SCRIBE_SMOKE_PASSWORD'),
    timeoutMs: Number(process.env.SCRIBE_SMOKE_TIMEOUT_MS || 120000),
  };

  if (process.env.SCRIBE_DEV_GITHUB_BOOTSTRAP !== 'true') {
    throw new Error('SCRIBE_DEV_GITHUB_BOOTSTRAP must be enabled for this smoke test.');
  }

  const jar = new CookieJar();

  try {
    await login(config, jar);
    recordStep('login', 'PASS');

    const user = await fetchCurrentUser(config, jar);
    recordStep('current-user', 'PASS', user.email);

    await bootstrapGitHub(config, jar);
    recordStep('github-bootstrap', 'PASS');

    const jobId = await createScribeJob(config, jar, user.id);
    recordStep('scribe-job-created', 'PASS', `jobId=${jobId}`);

    const jobDetails = await pollJob(config, jar, jobId);
    const traceCount = Array.isArray(jobDetails.trace) ? jobDetails.trace.length : 0;
    const artifactsCount = Array.isArray(jobDetails.artifacts) ? jobDetails.artifacts.length : 0;

    if (jobDetails.state !== 'completed') {
      throw new Error(`Job ended with state=${jobDetails.state}`);
    }
    if (traceCount === 0) {
      throw new Error('Job completed but produced no trace events');
    }

    recordStep(
      'scribe-job-completed',
      'PASS',
      `trace=${traceCount}, artifacts=${artifactsCount}, correlationId=${jobDetails.correlationId ?? 'n/a'}`
    );

    console.log('\nScribe smoke: PASS ✅');
  } catch (error) {
    recordStep('scribe-smoke', 'FAIL', (error as Error).message);
    console.error('\nScribe smoke: FAIL ❌');
    console.error((error as Error).stack);
    console.log('\nStep summary:');
    steps.forEach((step) => {
      console.log(`- ${step.name}: ${step.status}${step.detail ? ` → ${step.detail}` : ''}`);
    });
    process.exit(1);
  }

  console.log('\nStep summary:');
  steps.forEach((step) => {
    console.log(`- ${step.name}: ${step.status}${step.detail ? ` → ${step.detail}` : ''}`);
  });
}

main().catch((error) => {
  console.error('Unexpected error in Scribe smoke runner:', error);
  process.exit(1);
});

