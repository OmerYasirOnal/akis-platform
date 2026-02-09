/**
 * Navigation & Route Guard E2E (mocked backend)
 *
 * Verifies:
 * - Sidebar navigation links for Agents group (Scribe, Trace, Proto)
 * - ProtectedRoute redirects unauthenticated users to /login
 * - Deep links to dashboard pages work for authenticated users
 *
 * Run: npx playwright test navigation-guards
 */
import { test, expect } from '@playwright/test';
import {
  mockDashboardApis,
  mockUnauthenticated,
} from './helpers/mock-dashboard-apis';

test.describe('Sidebar Navigation', () => {
  /* ------------------------------------------------------------------ */
  /* N1 — Sidebar Agents group shows Hub, Scribe, Trace, Proto links     */
  /* ------------------------------------------------------------------ */
  test('N1: Sidebar shows Agents group with Hub, Scribe, Trace, Proto', async ({ page }) => {
    await mockDashboardApis(page);

    // Navigate to a known stable page within dashboard layout
    await page.goto('/dashboard/trace');
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();

    // Scope to the <nav> inside the visible desktop sidebar
    const sidebarNav = page.locator('aside nav').first();

    // Agents Hub link should be visible and point to /agents
    const hubLink = sidebarNav.getByRole('link', { name: 'Agents Hub' });
    await expect(hubLink).toBeVisible();
    await expect(hubLink).toHaveAttribute('href', '/agents');

    // Each agent link should be visible in sidebar
    const scribeLink = sidebarNav.getByRole('link', { name: 'Scribe' });
    const traceLink = sidebarNav.getByRole('link', { name: 'Trace' });
    const protoLink = sidebarNav.getByRole('link', { name: 'Proto' });

    await expect(scribeLink).toBeVisible();
    await expect(traceLink).toBeVisible();
    await expect(protoLink).toBeVisible();

    await expect(scribeLink).toHaveAttribute('href', '/dashboard/scribe');
    await expect(traceLink).toHaveAttribute('href', '/dashboard/trace');
    await expect(protoLink).toHaveAttribute('href', '/dashboard/proto');
  });

  /* ------------------------------------------------------------------ */
  /* N2 — Clicking Trace in sidebar navigates to /dashboard/trace         */
  /* ------------------------------------------------------------------ */
  test('N2: Clicking Trace in sidebar navigates to Trace console', async ({ page }) => {
    await mockDashboardApis(page);

    // Start at Proto so we can click to Trace
    await page.goto('/dashboard/proto');
    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible();

    // Click Trace in the sidebar nav
    const sidebarNav = page.locator('aside nav').first();
    await sidebarNav.getByRole('link', { name: 'Trace' }).click();

    await expect(page).toHaveURL(/\/dashboard\/trace$/);
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* N3 — Clicking Proto in sidebar navigates to /dashboard/proto         */
  /* ------------------------------------------------------------------ */
  test('N3: Clicking Proto in sidebar navigates to Proto console', async ({ page }) => {
    await mockDashboardApis(page);

    // Start at Trace so we can click to Proto
    await page.goto('/dashboard/trace');
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();

    // Click Proto in the sidebar nav
    const sidebarNav = page.locator('aside nav').first();
    await sidebarNav.getByRole('link', { name: 'Proto' }).click();

    await expect(page).toHaveURL(/\/dashboard\/proto$/);
    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible();
  });
});

test.describe('Route Guards', () => {
  /* ------------------------------------------------------------------ */
  /* G0 — Unauthenticated /agents redirects to /login                     */
  /* ------------------------------------------------------------------ */
  test('G0: /agents redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/agents');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G1 — Unauthenticated /dashboard redirects to /login                  */
  /* ------------------------------------------------------------------ */
  test('G1: /dashboard redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/dashboard');

    // ProtectedRoute should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G2 — Unauthenticated /dashboard/trace redirects to /login            */
  /* ------------------------------------------------------------------ */
  test('G2: /dashboard/trace redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/dashboard/trace');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G3 — Unauthenticated /dashboard/proto redirects to /login            */
  /* ------------------------------------------------------------------ */
  test('G3: /dashboard/proto redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/dashboard/proto');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G4 — Authenticated deep link to /dashboard/trace works               */
  /* ------------------------------------------------------------------ */
  test('G4: Authenticated deep link /dashboard/trace loads correctly', async ({ page }) => {
    await mockDashboardApis(page);

    const response = await page.goto('/dashboard/trace');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Content-Type is HTML (not JSON 404)
    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* G5 — Authenticated deep link to /dashboard/proto works               */
  /* ------------------------------------------------------------------ */
  test('G5: Authenticated deep link /dashboard/proto loads correctly', async ({ page }) => {
    await mockDashboardApis(page);

    const response = await page.goto('/dashboard/proto');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible();
  });
});
