# AKIS Observability Guide

**Version:** 1.0  
**Last Updated:** 2025-10-27

## 📊 Overview

This document describes logging, metrics, and monitoring for AKIS Scribe Agent.

## 🪵 Logging

### Log Structure

All logs follow a structured format:

```
<emoji> [timestamp] [scope] message {meta}
```

**Example:**
```
ℹ️ [2025-10-27T10:30:00.123Z] [GitHubOps] Creating PR for docs update {"repo":"owner/repo","branch":"docs/update"}
```

### Log Levels

| Level | Emoji | When to Use | Example |
|---|---|---|---|
| **info** | ℹ️ | Normal operations | `Token acquired`, `PR created` |
| **warn** | ⚠️ | Recoverable issues | `Rate limit approaching`, `Fallback to OAuth` |
| **error** | ❌ | Failures | `Token acquisition failed`, `API error` |
| **debug** | 🔍 | Dev/troubleshooting | `Request payload`, `Cache hit` |

### Scopes

Logs are categorized by scope:

| Scope | Component | Example Messages |
|---|---|---|
| `TokenProvider` | GitHub token management | `Using GitHub App token`, `Token expired` |
| `GitHubClient` | HTTP client | `GET /repos/owner/repo`, `Rate limited` |
| `GitHubOps` | High-level operations | `Branch created`, `Default branch: main` |
| `ScribeRunner` | Agent orchestration | `Agent started`, `PR created: #123` |
| `DocumentationAgent` | AI analysis | `Analyzing repo`, `Generated README` |

### Secret Redaction

Secrets are automatically redacted:

```typescript
// Input
logger.info('Auth', 'Token: ghp_abc123xyz456');

// Output
ℹ️ [2025-10-27T10:30:00.123Z] [Auth] Token: ghp_***REDACTED***
```

**Redacted patterns:**
- `ghp_*` (Personal Access Token)
- `gho_*` (OAuth token)
- `ghs_*` (Server token)
- `Bearer <token>`
- `sk-*` (OpenRouter API key)

### Usage

```typescript
import { logger } from '@/lib/utils/logger';

// Info
logger.info('GitHubOps', 'Creating branch', {
  repo: 'owner/repo',
  branch: 'docs/update',
});

// Warning
logger.warn('TokenProvider', 'GitHub App token unavailable, using OAuth');

// Error
logger.error('GitHubClient', 'API request failed', {
  status: 403,
  error: 'Forbidden',
});

// Debug (only in development)
logger.debug('GitHubOps', 'Request payload', {
  method: 'POST',
  url: '/repos/owner/repo/pulls',
  body: { title: 'docs: update' },
});
```

## 📈 Metrics

### Key Metrics to Track

#### Authentication

| Metric | Type | Description | Target |
|---|---|---|---|
| `github_token_acquisition_total` | Counter | Total token acquisitions | - |
| `github_token_acquisition_success` | Counter | Successful acquisitions | > 99% |
| `github_token_acquisition_failure` | Counter | Failed acquisitions | < 1% |
| `github_token_cache_hit_rate` | Gauge | % of cached token uses | > 80% |
| `github_token_ttl_seconds` | Histogram | Remaining token lifetime | - |

#### GitHub API

| Metric | Type | Description | Target |
|---|---|---|---|
| `github_api_requests_total` | Counter | Total API requests | - |
| `github_api_requests_by_endpoint` | Counter | Requests per endpoint | - |
| `github_api_errors_total` | Counter | API errors | < 5% |
| `github_api_rate_limit_remaining` | Gauge | Remaining rate limit | > 1000 |
| `github_api_response_time_ms` | Histogram | API response time | p95 < 500ms |

#### Agent Operations

| Metric | Type | Description | Target |
|---|---|---|---|
| `agent_run_total` | Counter | Total agent runs | - |
| `agent_run_success` | Counter | Successful runs | > 90% |
| `agent_run_failure` | Counter | Failed runs | < 10% |
| `agent_run_duration_seconds` | Histogram | Run duration | p95 < 60s |
| `pr_created_total` | Counter | PRs created | - |
| `das_score_distribution` | Histogram | DAS score distribution | avg > 70 |

### Implementation

**Using Prometheus client (example):**

```typescript
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

const register = new Registry();

// Token acquisition counter
const tokenAcquisitionTotal = new Counter({
  name: 'github_token_acquisition_total',
  help: 'Total GitHub token acquisitions',
  labelNames: ['source'], // 'github_app' or 'oauth'
  registers: [register],
});

// Track acquisition
tokenAcquisitionTotal.inc({ source: 'github_app' });

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 🔍 Correlation IDs

Every request gets a unique correlation ID for tracing across logs:

```typescript
const correlationId = Math.random().toString(36).substring(7);

logger.info('Agent', `[${correlationId}] Starting workflow`);
// ...API calls...
logger.info('Agent', `[${correlationId}] Workflow completed`);
```

**Example logs:**
```
ℹ️ [2025-10-27T10:30:00.000Z] [Agent] [abc123] Starting workflow
ℹ️ [2025-10-27T10:30:05.000Z] [GitHubOps] [abc123] Fetching default branch
ℹ️ [2025-10-27T10:30:10.000Z] [Agent] [abc123] Workflow completed
```

## 📉 Error Tracking

### Error Categories

| Category | HTTP Status | Client Action | Example |
|---|---|---|---|
| **Auth** | 401 | Show CTA (Install App / Connect OAuth) | `No auth credentials found` |
| **Permission** | 403 | Request access | `Resource not accessible` |
| **Not Found** | 404 | Check repo URL | `Repository not found` |
| **Rate Limit** | 429 | Retry with backoff | `Rate limit exceeded` |
| **Server Error** | 500 | Retry or report | `Internal server error` |

### Error Response Format

```json
{
  "success": false,
  "error": "GitHub App not configured",
  "actionable": {
    "type": "install_app",
    "message": "Install AKIS GitHub App or configure environment variables.",
    "ctaText": "Install AKIS GitHub App"
  },
  "correlationId": "abc123",
  "requiresAuth": true
}
```

### Error Alerting

**Alert on:**
- Error rate > 5% (5 minutes)
- Auth failure rate > 10% (1 minute)
- Rate limit < 100 remaining
- PR creation failure rate > 10%

## 📊 Dashboards

### Recommended Dashboards

#### 1. **Agent Health**

**Panels:**
- Agent run success rate (gauge)
- Agent run duration (graph)
- DAS score distribution (histogram)
- PR creation rate (graph)

#### 2. **GitHub API**

**Panels:**
- API request rate (graph)
- API error rate (graph)
- Rate limit remaining (gauge)
- Response time p50/p95/p99 (graph)

#### 3. **Authentication**

**Panels:**
- Token acquisition success rate (gauge)
- Token cache hit rate (gauge)
- Token source (pie: GitHub App vs OAuth)
- Auth failures (graph)

### Example Queries (Prometheus)

```promql
# Agent success rate (last 5m)
sum(rate(agent_run_success[5m])) / sum(rate(agent_run_total[5m]))

# API rate limit remaining (current)
github_api_rate_limit_remaining

# Token acquisition failures (last 1h)
increase(github_token_acquisition_failure[1h])

# Average agent run duration (last 5m)
histogram_quantile(0.95, rate(agent_run_duration_seconds_bucket[5m]))
```

## 🚨 Alerting

### Alert Rules

**Critical:**

```yaml
- alert: GitHubAppTokenAcquisitionFailed
  expr: rate(github_token_acquisition_failure{source="github_app"}[5m]) > 0.1
  for: 1m
  annotations:
    summary: "GitHub App token acquisition failing"
    description: "{{ $value }} failures per second"

- alert: GitHubRateLimitLow
  expr: github_api_rate_limit_remaining < 100
  for: 1m
  annotations:
    summary: "GitHub API rate limit critically low"
    description: "Only {{ $value }} requests remaining"
```

**Warning:**

```yaml
- alert: AgentSuccessRateLow
  expr: sum(rate(agent_run_success[5m])) / sum(rate(agent_run_total[5m])) < 0.9
  for: 5m
  annotations:
    summary: "Agent success rate below 90%"
    description: "Current rate: {{ $value | humanizePercentage }}"
```

## 🔧 Tools & Integration

### Recommended Stack

**Logging:**
- [Papertrail](https://www.papertrail.com/) (simple)
- [Datadog Logs](https://www.datadoghq.com/) (advanced)
- [Elasticsearch + Kibana](https://www.elastic.co/) (self-hosted)

**Metrics:**
- [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)
- [Datadog Metrics](https://www.datadoghq.com/)
- [New Relic](https://newrelic.com/)

**Error Tracking:**
- [Sentry](https://sentry.io/)
- [Rollbar](https://rollbar.com/)
- [Bugsnag](https://www.bugsnag.com/)

**APM (Application Performance Monitoring):**
- [Datadog APM](https://www.datadoghq.com/product/apm/)
- [New Relic APM](https://newrelic.com/products/application-monitoring)

### Integration Example (Datadog)

```typescript
// lib/utils/logger.ts
import { StatsD } from 'node-dogstatsd';

const statsd = new StatsD({
  host: process.env.DATADOG_HOST || 'localhost',
  port: 8125,
});

export function logWithMetrics(
  level: LogLevel,
  scope: string,
  message: string,
  meta?: any
) {
  // Log
  logger[level](scope, message, meta);

  // Metric
  statsd.increment(`akis.${scope.toLowerCase()}.${level}`);
}
```

## 📋 Runbook

### Investigation Workflow

**Problem:** Agent run failed

**Steps:**

1. **Get correlation ID:**
   ```bash
   curl -X POST /api/agent/documentation/analyze \
     -H "Content-Type: application/json" \
     -d '{"repoUrl": "..."}'
   # Response includes correlationId
   ```

2. **Search logs:**
   ```bash
   docker logs akis-app | grep "<correlationId>"
   ```

3. **Check error type:**
   - Auth? → Verify GitHub App credentials
   - Rate limit? → Check rate limit remaining
   - API error? → Check GitHub status page

4. **Review metrics:**
   - Dashboard: Agent Health
   - Time range: Last 1 hour

5. **Fix and retry:**
   - Apply fix (e.g., reinstall GitHub App)
   - Retry request with same correlationId
   - Verify success in logs/metrics

## 🧪 Testing Observability

### Test Logging

```bash
# Run agent with verbose logs
LOG_LEVEL=debug npm run dev

# Trigger operation
curl -X POST http://localhost:3000/api/agent/documentation/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/owner/repo"}'

# Check logs
docker logs akis-app | tail -50
```

### Test Metrics

```bash
# Expose metrics endpoint
npm run dev

# Scrape metrics
curl http://localhost:3000/metrics

# Should see:
# github_token_acquisition_total{source="github_app"} 10
# github_api_requests_total{endpoint="/repos/owner/repo"} 5
```

## 📚 Best Practices

1. **Structured Logging**
   - ✅ Always include scope and correlation ID
   - ✅ Use consistent log format
   - ✅ Log both success and failure

2. **Metrics**
   - ✅ Track both counts and rates
   - ✅ Use histograms for durations
   - ✅ Label metrics appropriately

3. **Alerting**
   - ✅ Alert on symptoms, not causes
   - ✅ Set appropriate thresholds
   - ✅ Include actionable context

4. **Performance**
   - ✅ Don't log sensitive data
   - ✅ Async log shipping
   - ✅ Sample high-volume logs

---

**Maintained by:** AKIS Platform Team  
**Next Review:** 2025-11-27

