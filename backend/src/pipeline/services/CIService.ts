/**
 * CIService — triggers GitHub Actions workflow_dispatch, polls for results,
 * and downloads test artifacts.
 */

const GITHUB_API = 'https://api.github.com';
const POLL_INTERVAL_MS = 10_000; // 10s
const MAX_POLL_DURATION_MS = 10 * 60_000; // 10min

export interface CIResult {
  ok: boolean;
  runId: number;
  status: 'completed' | 'failure' | 'timed_out' | 'cancelled';
  conclusion: string | null;
  htmlUrl: string;
  testResults?: {
    passed: number;
    failed: number;
    total: number;
    failures: Array<{ file: string; line: number; message: string }>;
  };
}

async function ghFetch<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return {} as T;
}

/**
 * Trigger workflow_dispatch for the akis-tests.yml workflow.
 */
export async function triggerWorkflowDispatch(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<void> {
  await ghFetch(
    token,
    'POST',
    `/repos/${owner}/${repo}/actions/workflows/akis-tests.yml/dispatches`,
    { ref: branch },
  );
}

/**
 * Poll for the workflow run triggered by dispatch.
 * Returns the run when it completes or times out.
 */
export async function pollWorkflowRun(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  onProgress?: (status: string) => void,
): Promise<CIResult> {
  const startTime = Date.now();

  // Wait a few seconds for the run to appear
  await new Promise((r) => setTimeout(r, 5000));

  while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
    const runs = await ghFetch<{
      workflow_runs: Array<{
        id: number;
        status: string;
        conclusion: string | null;
        html_url: string;
        head_branch: string;
        event: string;
      }>;
    }>(token, 'GET', `/repos/${owner}/${repo}/actions/runs?branch=${branch}&event=workflow_dispatch&per_page=1`);

    const run = runs.workflow_runs?.[0];
    if (!run) {
      onProgress?.('Workflow run bekleniyor...');
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    if (run.status === 'completed') {
      return {
        ok: run.conclusion === 'success',
        runId: run.id,
        status: 'completed',
        conclusion: run.conclusion,
        htmlUrl: run.html_url,
      };
    }

    onProgress?.(`CI çalışıyor... (${run.status})`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  return {
    ok: false,
    runId: 0,
    status: 'timed_out',
    conclusion: null,
    htmlUrl: `https://github.com/${owner}/${repo}/actions`,
  };
}

/**
 * GitHub Actions workflow YAML template for Proto to include in scaffolds.
 */
export const AKIS_TESTS_WORKFLOW_YAML = `name: AKIS Tests
on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --reporter=json
        continue-on-error: true
      - uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
        if: always()
`;
