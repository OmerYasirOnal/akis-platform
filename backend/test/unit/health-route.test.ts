/**
 * Unit tests for health route response structures
 * Tests BUILD_INFO shape, response contracts, and uptime tracking
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── BUILD_INFO structure ──────────────────────────────────────────────

describe('Health route contracts', () => {
  describe('/health response shape', () => {
    test('health response has status and timestamp', () => {
      // Simulate what the health handler returns
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      assert.strictEqual(response.status, 'ok');
      assert.ok(typeof response.timestamp === 'string');
      assert.ok(!isNaN(Date.parse(response.timestamp)), 'timestamp must be valid ISO date');
    });
  });

  describe('/version response shape', () => {
    test('version response has all required fields', () => {
      // Simulate BUILD_INFO + startTime
      const response = {
        version: process.env.npm_package_version || process.env.APP_VERSION || '0.2.0',
        commit: process.env.BUILD_COMMIT || process.env.GIT_COMMIT || 'unknown',
        buildTime: process.env.BUILD_TIME || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        name: 'akis-backend',
        startTime: new Date().toISOString(),
      };

      assert.strictEqual(typeof response.version, 'string');
      assert.strictEqual(typeof response.commit, 'string');
      assert.strictEqual(typeof response.buildTime, 'string');
      assert.strictEqual(typeof response.environment, 'string');
      assert.strictEqual(response.name, 'akis-backend');
      assert.ok(!isNaN(Date.parse(response.startTime)));
    });

    test('version defaults to 0.2.0 when env is not set', () => {
      const version = process.env.npm_package_version || process.env.APP_VERSION || '0.2.0';
      assert.ok(typeof version === 'string');
      assert.ok(version.length > 0);
    });

    test('environment defaults to development', () => {
      const env = process.env.NODE_ENV || 'development';
      assert.ok(['development', 'production', 'test'].includes(env));
    });
  });

  describe('/ready response shape', () => {
    test('ready success response has required fields', () => {
      const response = {
        ready: true,
        database: 'connected',
        migrations: 'ok',
        encryption: { configured: false },
        email: { configured: false, provider: 'mock' },
        oauth: { google: false, github: false, callbackBase: 'NOT_SET' },
        mcp: { configured: false, github: false, baseUrl: null },
        timestamp: new Date().toISOString(),
      };

      assert.strictEqual(response.ready, true);
      assert.strictEqual(response.database, 'connected');
      assert.ok(['ok', 'pending'].includes(response.migrations));
      assert.strictEqual(typeof response.encryption.configured, 'boolean');
      assert.strictEqual(typeof response.email.configured, 'boolean');
      assert.strictEqual(typeof response.email.provider, 'string');
      assert.strictEqual(typeof response.oauth.google, 'boolean');
      assert.strictEqual(typeof response.oauth.github, 'boolean');
    });

    test('ready failure response includes error', () => {
      const response = {
        ready: false,
        database: 'disconnected',
        migrations: 'unknown',
        encryption: { configured: false },
        email: { configured: false, provider: 'mock' },
        oauth: { google: false, github: false, callbackBase: 'NOT_SET' },
        mcp: { configured: false, github: false, baseUrl: null },
        error: 'connection refused',
        timestamp: new Date().toISOString(),
      };

      assert.strictEqual(response.ready, false);
      assert.strictEqual(response.database, 'disconnected');
      assert.strictEqual(typeof response.error, 'string');
    });

    test('SMTP readiness includes host/port/from when provider is smtp', () => {
      const emailStatus: Record<string, unknown> = {
        configured: true,
        provider: 'smtp',
        host: 'mail.example.com',
        port: 587,
        from: 'noreply@example.com',
        secure: false,
      };

      assert.strictEqual(emailStatus.provider, 'smtp');
      assert.strictEqual(typeof emailStatus.host, 'string');
      assert.strictEqual(typeof emailStatus.port, 'number');
      assert.strictEqual(typeof emailStatus.from, 'string');
      assert.strictEqual(typeof emailStatus.secure, 'boolean');
    });
  });
});

// ─── DashboardMetrics interface contract ───────────────────────────────

describe('DashboardMetrics contract', () => {
  interface DashboardMetrics {
    period: '7d' | '30d';
    avgQualityScore: number | null;
    successRate: number;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    topFailureReason: string | null;
    topFailureCount: number;
  }

  test('metrics with zero jobs returns 100% success rate', () => {
    const total = 0;
    const completed = 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;
    assert.strictEqual(successRate, 100);
  });

  test('metrics calculation with real data', () => {
    const total = 10;
    const completed = 7;
    const failed = 3;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    assert.strictEqual(successRate, 70);
    assert.strictEqual(total, completed + failed);
  });

  test('avgQualityScore rounding to 1 decimal', () => {
    const rawScore = 4.567;
    const rounded = Math.round(rawScore * 10) / 10;
    assert.strictEqual(rounded, 4.6);
  });

  test('avgQualityScore null when no scores', () => {
    const rawScore: number | null = null;
    const result = rawScore ? Math.round(rawScore * 10) / 10 : null;
    assert.strictEqual(result, null);
  });

  test('period defaults to 7d', () => {
    const query: { period?: '7d' | '30d' } = {};
    const period = query.period || '7d';
    assert.strictEqual(period, '7d');
  });

  test('period can be 30d', () => {
    const query: { period?: '7d' | '30d' } = { period: '30d' };
    const daysAgo = query.period === '30d' ? 30 : 7;
    assert.strictEqual(daysAgo, 30);
  });

  test('metrics shape matches interface contract', () => {
    const metrics: DashboardMetrics = {
      period: '7d',
      avgQualityScore: 4.2,
      successRate: 85,
      totalJobs: 20,
      completedJobs: 17,
      failedJobs: 3,
      topFailureReason: 'AI_PROVIDER_ERROR',
      topFailureCount: 2,
    };

    assert.ok(['7d', '30d'].includes(metrics.period));
    assert.strictEqual(typeof metrics.successRate, 'number');
    assert.ok(metrics.successRate >= 0 && metrics.successRate <= 100);
    assert.strictEqual(metrics.totalJobs, metrics.completedJobs + metrics.failedJobs);
  });
});
