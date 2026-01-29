# AKIS Platform Performance Guide

> **Purpose:** Performance budgets, optimization strategies, and monitoring practices  
> **Created:** 2026-01-29  
> **Status:** Active  
> **Constraints:** Oracle Cloud Free Tier (1 OCPU, 1GB RAM per instance)

---

## Quick Reference

| Metric | Target | Current | Budget | Priority |
|--------|--------|---------|--------|----------|
| Frontend Bundle  | <500KB gzip | 122KB gzip | ✅ PASS | High |
| Build Time | <60s | 5s | ✅ PASS | Medium |
| API Response (p95) | <200ms | TBD | N/A | High |
| Job Start Latency | <2s | TBD | N/A | Medium |
| Frontend LCP | <2.5s | TBD | Web Vitals | High |
| Frontend FID | <100ms | TBD | Web Vitals | High |
| Frontend CLS | <0.1 | TBD | Web Vitals | Medium |

---

## 1. Performance Philosophy

### OCI Free Tier Constraints

**Available Resources per Instance:**
- **CPU:** 1 OCPU (= 2 vCPUs)
- **RAM:** 1GB
- **Storage:** 200GB (across all instances)
- **Network:** 10TB/month outbound

**Design Implications:**
- ✅ Minimal dependencies (lightweight packages only)
- ✅ Efficient resource usage (connection pooling, caching)
- ✅ Async/non-blocking operations (Fastify, async/await)
- ❌ No heavy ML libraries (use external AI APIs)
- ❌ No in-memory caching beyond session store
- ❌ No video processing or large file operations

### Performance Priorities

1. **Frontend:** Fast initial load, smooth interactions
2. **Backend:** Low latency API responses, efficient database queries
3. **Jobs:** Reliable execution, graceful error handling
4. **Build:** Fast development feedback loop

---

## 2. Frontend Performance

### Build Performance

**Current Metrics (from QA evidence):**
```
vite v7.3.0 building for production...
✓ 123 modules transformed
✓ built in 1.01s
```

**Bundle Size:**
- **index.css:** 69.64 KB (11.05 KB gzip)
- **index.js:** 438.95 KB (121.75 KB gzip)
- **Total:** 508.59 KB (132.80 KB gzip) ✅ Under 500KB gzip budget

**Optimization Strategies:**

1. **Code Splitting:**
```typescript
// frontend/src/App.tsx
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ScribeConsolePage = lazy(() => import('./pages/dashboard/ScribeConsolePage'));
```

2. **Tree Shaking:**
   - Use ES modules exclusively
   - Import only what's needed (`import { X } from 'lib'` not `import * as lib`)
   - Avoid default exports for utilities

3. **Asset Optimization:**
   - SVG icons inlined (< 2KB each)
   - Images lazy-loaded with `loading="lazy"`
   - Fonts subset to Latin characters only

### Runtime Performance

#### Core Web Vitals

**Targets (from Lighthouse):**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Measurement:**
```bash
# Local Lighthouse audit
npx lighthouse http://localhost:5173 --view

# Chrome DevTools
# 1. Open DevTools
# 2. Lighthouse tab → Analyze page load
```

#### Animation Performance

**Motion Budget:**
- Respect `prefers-reduced-motion`
- GPU-accelerated transforms only (`transform`, `opacity`)
- 60 FPS target (16ms frame budget)

**Example:**
```css
/* Good: GPU-accelerated */
.liquid-neon-blob {
  transform: translate3d(var(--x), var(--y), 0);
  transition: transform 0.3s ease;
}

/* Bad: Triggers layout */
.liquid-neon-blob-bad {
  left: var(--x);
  top: var(--y);
  transition: left 0.3s ease, top 0.3s ease;
}
```

**Reduced Motion:**
```typescript
// frontend/src/hooks/useReducedMotion.ts
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
```

---

## 3. Backend Performance

### API Response Time

**Target:** p95 < 200ms (excluding AI calls)

**Measurement:**
```bash
# Fastify built-in logger shows response times
pnpm --filter backend dev

# Example log:
# {"level":30,"time":1706553600000,"pid":12345,"msg":"incoming request","reqId":"req-1"}
# {"level":30,"time":1706553600100,"pid":12345,"msg":"request completed","reqId":"req-1","responseTime":100}
```

**Optimization Strategies:**

1. **Database Query Optimization:**
```typescript
// Good: Select only needed columns
const jobs = await db.select({
  id: jobs.id,
  type: jobs.type,
  state: jobs.state,
  createdAt: jobs.createdAt
}).from(jobs).where(eq(jobs.userId, userId)).limit(20);

// Bad: Select all columns unnecessarily
const jobs = await db.select().from(jobs).where(eq(jobs.userId, userId));
```

2. **Connection Pooling:**
```typescript
// backend/src/db/index.ts
export const db = drizzle(postgresjs(DATABASE_URL, {
  max: 10,              // Max connections (OCI constraint)
  idle_timeout: 20,     // Close idle connections after 20s
  connect_timeout: 10   // Fail fast if can't connect
}));
```

3. **Caching Strategy:**
   - **Session store:** In-memory (limited to 1GB RAM)
   - **Database queries:** No caching yet (future: Redis on separate instance)
   - **AI responses:** No caching (responses are unique)

### Job Execution Performance

**Scribe Agent Performance:**
- **Start Latency:** < 2s (from API call to job state = `assigned`)
- **Execution Time:** Variable (depends on repo size, AI latency)
- **Timeout:** 5 minutes (configurable)

**Monitoring:**
```typescript
//  backend/src/agents/scribe/scribe-agent.ts
const startTime = Date.now();
console.log(`[Scribe] Job ${jobId} started`);

// ... agent logic ...

const duration = Date.now() - startTime;
console.log(`[Scribe] Job ${jobId} completed in ${duration}ms`);
```

---

## 4. Database Performance

### Query Optimization

**Indexes:**
```sql
-- Existing indexes (from schema)
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

**Query Patterns:**
```typescript
// Good: Use indexes
await db.select()
  .from(jobs)
  .where(and(
    eq(jobs.userId, userId),     // Uses idx_jobs_user_id
    eq(jobs.state, 'completed')   // Uses idx_jobs_state
  ))
  .orderBy(desc(jobs.createdAt))  // Uses idx_jobs_created_at
  .limit(20);

// Bad: Full table scan
await db.select().from(jobs); // No WHERE clause
```

### Connection Pool Sizing

**OCI Free Tier Constraints:**
- **Max Connections:** 10 (conservative for 1GB RAM)
- **Idle Timeout:** 20s (close idle connections quickly)
- **Connect Timeout:** 10s (fail fast)

**Configuration:**
```typescript
// backend/src/db/index.ts
const pool = postgresjs(DATABASE_URL, {
  max: process.env.NODE_ENV === 'production' ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {} // Suppress PostgreSQL notices
});
```

---

## 5. Monitoring and Observability

### Current Monitoring

**Backend Logs (Pino):**
```bash
# Development (pretty-printed)
pnpm --filter backend dev

# Production (JSON)
NODE_ENV=production pnpm --filter backend start | pnpm exec pino-pretty
```

**Frontend Logs (Console):**
```typescript
// frontend/src/utils/logger.ts
export const logger = {
  info: (msg: string, meta?: object) => console.log(`[INFO] ${msg}`, meta),
  warn: (msg: string, meta?: object) => console.warn(`[WARN] ${msg}`, meta),
  error: (msg: string, error?: Error) => console.error(`[ERROR] ${msg}`, error)
};
```

### Future Monitoring (Post-MVP)

**Planned:**
- **Metrics:** Prometheus (on separate OCI instance)
- **Tracing:** OpenTelemetry (job execution traces)
- **Alerts:** Grafana (on separate OCI instance)

**See:** `docs/OBSERVABILITY_TRACE_SPEC.md` for detailed tracing design

---

## 6. Resource Budgets

### Memory Budget (Backend: 1GB RAM)

**Breakdown:**
- **Node.js Process:** ~150MB (base)
- **PostgreSQL Client:** ~50MB (connection pool)
- **Session Store:** ~200MB (in-memory sessions)
- **Job Execution:** ~300MB (per concurrent job)
- **Buffer:** ~300MB (OS, other processes)

**Constraint:** **Max 2-3 concurrent jobs** (to avoid OOM)

**Monitoring:**
```bash
# Check memory usage
docker stats akis-backend

# Expected output:
# CONTAINER     MEM USAGE / LIMIT     MEM %
# akis-backend  450MiB / 1GiB        44%
```

### CPU Budget (Backend: 1 OCPU = 2 vCPUs)

**Constraints:**
- **Single-threaded Node.js** (no worker threads yet)
- **Async I/O** to maximize throughput
- **No CPU-intensive tasks** (offload to AI APIs)

**Monitoring:**
```bash
# Check CPU usage
docker stats akis-backend

# Expected output:
# CONTAINER     CPU %
# akis-backend  15-30%  (normal)
# akis-backend  70-90%  (under load, acceptable)
# akis-backend  >95%    (investigate)
```

### Disk Budget (200GB total, shared)

**Allocation:**
- **PostgreSQL Data:** ~10GB (expected growth)
- **Logs:** ~5GB (with rotation)
- **Docker Images:** ~10GB
- **Temp Files:** ~5GB
- **Reserved:** ~170GB

**Monitoring:**
```bash
# Check disk usage
df -h /var/lib/docker

# Clean up old logs
find /var/log -type f -name "*.log" -mtime +30 -delete
```

---

## 7. Optimization Checklist

### Pre-Deployment

- [ ] Frontend bundle < 500KB gzip
- [ ] Build time < 60s
- [ ] No console errors in production build
- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Backend memory usage < 800MB under load
- [ ] Database query response time < 100ms (p95)

### Post-Deployment

- [ ] Monitor memory usage for 24h
- [ ] Check for memory leaks (heap snapshots)
- [ ] Verify no disk space issues
- [ ] Test under simulated load (10 concurrent users)

---

## 8. Load Testing

### Current Status

**Not yet implemented** (planned for Phase 2.5 - Early Users)

### Future Plans

**Tool:** `k6` (lightweight, cloud-friendly)

**Example Scenario:**
```javascript
// tests/load/scribe-job-creation.js
import http from 'k6/http';
import { check, sleep} from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Hold at 10 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
  },
};

export default function () {
  const payload = JSON.stringify({
    type: 'scribe',
    payload: { mode: 'from_config' }
  });

  const res = http.post('http://localhost:3000/api/agents/jobs', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has jobId': (r) => r.json('jobId') !== undefined,
  });

  sleep(1);
}
```

---

## 9. Common Performance Issues

### Issue: High Memory Usage

**Symptoms:**
- Backend crashes with `JavaScript heap out of memory`
- `docker stats` shows > 900MB usage

**Diagnosis:**
```bash
# Take heap snapshot
kill -USR2 $(pgrep -f "node.*backend")

# Analyze with Chrome DevTools
# Memory tab → Load snapshot
```

**Solutions:**
- Reduce concurrent job limit
- Add pagination to large queries
- Close database connections aggressively

### Issue: Slow API Responses

**Symptoms:**
- Requests take > 1s
- Logs show high `responseTime`

**Diagnosis:**
```typescript
// Add query timing
const start = Date.now();
const jobs = await db.select().from(jobs).where(eq(jobs.userId, userId));
console.log(`Query took ${Date.now() - start}ms`);
```

**Solutions:**
- Add database indexes
- Reduce `SELECT *` to only needed columns
- Use connection pooling

### Issue: Frontend Lag

**Symptoms:**
- Janky animations
- Slow page transitions

**Diagnosis:**
```bash
# Chrome DevTools
# Performance tab → Record → Analyze

# Look for:
# - Long tasks (> 50ms)
# - Layout thrashing
# - Excessive re-renders
```

**Solutions:**
- Use React.memo for expensive components
- Debounce user input
- Lazy load heavy components

---

## 10. Related Documentation

- [ENV_SETUP.md](ENV_SETUP.md) - Resource allocation configuration
- [TESTING.md](TESTING.md) - Performance testing strategies
- [OBSERVABILITY_TRACE_SPEC.md](OBSERVABILITY_TRACE_SPEC.md) - Detailed tracing design
- [CI_AUTOMATION.md](CI_AUTOMATION.md) - Build performance optimization

---

*For real-time monitoring dashboards (post-MVP), see future Grafana setup in deployment docs.*
