# QA Evidence: OCI A1 Prep

**Date**: 2025-12-27  
**Goal**: Prepare documentation and tooling for OCI A1 deployment  
**Scope**: Phase 3 - Docs-only (no actual deployment)

---

## Summary

This phase adds deployment readiness documentation:
1. **OCI_A1_BOOTSTRAP.md**: Step-by-step deployment guide
2. **scripts/oci/bootstrap.sh**: Automated setup script
3. **Security checklist**: Firewall rules, service isolation, secrets management
4. **Monitoring guide**: Health checks, logs, updates

**Not included**:
- Actual OCI deployment (manual process per docs)
- SSL/TLS setup (use Let's Encrypt separately)
- Monitoring stack (Prometheus/Grafana - future)

---

## Checklist (Pre-Deployment)

### Infrastructure

- [ ] OCI account created
- [ ] Compartment created: `akis-production`
- [ ] VCN configured (CIDR: `10.0.0.0/16`)
- [ ] Security list rules:
  - [ ] SSH (22) ingress restricted to your IP
  - [ ] HTTPS (443) ingress open
  - [ ] All other ports blocked (especially 8080, 6333, 5432)
- [ ] A1 instance created (2-4 OCPUs, 12-24 GB RAM)
- [ ] SSH key generated and added to instance
- [ ] (Optional) Block volume attached and mounted to `/mnt/akis-data`

### Software

- [ ] Bootstrap script executed: `./scripts/oci/bootstrap.sh`
- [ ] Docker installed and running
- [ ] Node.js 20.x installed
- [ ] pnpm installed globally
- [ ] Data directories created

### Configuration

- [ ] AKIS repository cloned
- [ ] LLM model downloaded to `~/akis-data/localai/models/`
- [ ] `backend/.env.local` configured with:
  - [ ] `AI_PROVIDER=openai`
  - [ ] `AI_BASE_URL=http://localhost:8080/v1`
  - [ ] `AI_MODEL_DEFAULT=<model_name>`
  - [ ] `DATABASE_URL` with secure password
  - [ ] `AUTH_JWT_SECRET` (32+ chars, generated via `openssl rand -base64 32`)
  - [ ] `NODE_ENV=production`
  - [ ] `AUTH_COOKIE_SECURE=true`

### Services

- [ ] LocalAI + Qdrant started: `docker compose -f docker-compose.llm.local.yml up -d`
- [ ] LocalAI health: `curl http://localhost:8080/v1/models` returns JSON
- [ ] Qdrant health: `curl http://localhost:6333/healthz` returns 200
- [ ] LLM contract smoke test: `./scripts/llm-contract-smoke.sh` passes
- [ ] RAG smoke test: `./scripts/rag-smoke.sh` passes

### Backend

- [ ] Dependencies installed: `pnpm -C backend install`
- [ ] Database migrations: `pnpm -C backend db:migrate`
- [ ] Build successful: `pnpm -C backend build`
- [ ] Backend starts: `pnpm -C backend start` (or PM2)
- [ ] Health endpoint: `curl http://localhost:3000/health` returns `{"status":"ok"}`

### Security

- [ ] Firewall configured (ufw or OCI Security List)
- [ ] SSH restricted to your IP
- [ ] LocalAI/Qdrant NOT publicly accessible
- [ ] Secrets NOT in git history
- [ ] Env files have correct permissions: `chmod 600 backend/.env.local`

---

## Verification Commands (On OCI Instance)

### Test 1: Bootstrap Script Execution

```bash
# Run bootstrap script
./scripts/oci/bootstrap.sh

# Expected output:
# [INFO] === Bootstrap Complete! ===
# [INFO] Next steps: ...
```

**Expected Results**:
- Docker installed and running
- Node.js 20.x installed
- pnpm installed
- Data directories created

### Test 2: Docker Functionality

```bash
# Verify Docker
docker --version
docker compose version

# Start test container
docker run --rm hello-world

# Expected: "Hello from Docker!" message
```

### Test 3: Service Startup

```bash
# Start LocalAI + Qdrant
docker compose -f docker-compose.llm.local.yml up -d

# Wait for health checks (30-60s)
docker compose -f docker-compose.llm.local.yml ps

# Expected: Both services "healthy"
```

### Test 4: Smoke Tests

```bash
# Test LLM contract
./scripts/llm-contract-smoke.sh

# Expected: [INFO] === ✅ ALL TESTS PASSED ===

# Test RAG stack
./scripts/rag-smoke.sh

# Expected: [INFO] === ✅ ALL TESTS PASSED ===
```

### Test 5: Backend Build

```bash
cd backend

# Install dependencies
pnpm install --frozen-lockfile

# Run migrations (ensure DATABASE_URL is set)
pnpm db:migrate

# Build
pnpm build

# Expected: dist/ directory created with JS files
```

### Test 6: Security Posture

```bash
# Verify LocalAI NOT publicly accessible
# From your local machine (NOT OCI instance):
curl http://<OCI_PUBLIC_IP>:8080/v1/models

# Expected: Connection refused or timeout (good!)

# Verify Qdrant NOT publicly accessible
curl http://<OCI_PUBLIC_IP>:6333/healthz

# Expected: Connection refused or timeout (good!)

# Verify backend accessible (if intended to be public)
curl http://<OCI_PUBLIC_IP>:3000/health

# Expected: {"status":"ok"} (or connection refused if behind reverse proxy)
```

---

## Security Checklist

### Network Security

- [ ] **OCI Security List**:
  - [ ] Ingress rule: SSH (22) from your IP only
  - [ ] Ingress rule: HTTPS (443) public
  - [ ] NO ingress rules for: 8080 (LocalAI), 6333 (Qdrant), 5432 (Postgres), 3000 (Backend dev)
- [ ] **UFW (if used)**:
  - [ ] Default deny incoming
  - [ ] Allow 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - [ ] Deny all other ports
- [ ] **Docker port bindings**:
  - [ ] LocalAI: `127.0.0.1:8080:8080` (localhost only)
  - [ ] Qdrant: `127.0.0.1:6333:6333` (localhost only)

### Secrets Management

- [ ] No secrets in git history: `git log --all --full-history --source -- "*/.env*"`
- [ ] Env files have restrictive permissions: `ls -l backend/.env.local` shows `-rw-------`
- [ ] `AUTH_JWT_SECRET` is 32+ characters and randomly generated
- [ ] Database password is strong and unique

### Service Hardening

- [ ] `NODE_ENV=production` in backend
- [ ] `AUTH_COOKIE_SECURE=true` in backend (requires HTTPS)
- [ ] Rate limiting enabled (default in Fastify)
- [ ] CORS origins restricted: `CORS_ORIGINS=https://yourdomain.com`

---

## Monitoring Commands

### Health Checks

```bash
# Check all Docker services
docker compose -f docker-compose.llm.local.yml ps

# Check LocalAI
curl http://localhost:8080/v1/models

# Check Qdrant
curl http://localhost:6333/healthz

# Check backend (if running)
curl http://localhost:3000/health
```

### Resource Usage

```bash
# CPU and memory
htop  # or: top

# Disk usage
df -h

# Docker stats
docker stats
```

### Logs

```bash
# Docker logs
docker compose -f docker-compose.llm.local.yml logs -f localai
docker compose -f docker-compose.llm.local.yml logs -f qdrant

# Backend logs (if using PM2)
pm2 logs akis-backend

# System logs
sudo journalctl -u docker -f
```

---

## Failure Scenarios and Remediation

### Issue: Bootstrap Script Fails

**Symptom**: Script exits with error

**Common Causes**:
1. No sudo access → Add user to sudo group
2. No internet → Check OCI egress rules
3. Architecture mismatch → Verify ARM64 instance

**Remediation**:
```bash
# Check sudo
sudo echo "OK"

# Check internet
ping -c 3 8.8.8.8

# Check architecture
uname -m  # Should be aarch64 or arm64
```

### Issue: Docker Permission Denied

**Symptom**: `docker: permission denied`

**Remediation**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
exit
# (SSH back in)

# Verify
docker ps
```

### Issue: Services Fail to Start

**Symptom**: `docker compose ps` shows unhealthy services

**Remediation**:
```bash
# Check logs
docker compose -f docker-compose.llm.local.yml logs localai
docker compose -f docker-compose.llm.local.yml logs qdrant

# Common issues:
# - No models in data/localai/models/ → Download model
# - Insufficient RAM → Use smaller model or add swap
# - Port conflict → Check with: netstat -tuln | grep 8080
```

---

## Cost Monitoring

OCI A1 is free within limits, but monitor:

- **Block volumes**: Free tier includes 200 GB
  - Check: OCI Console > Block Storage > Boot Volumes + Block Volumes
  - Over limit: ~$0.0255/GB/month
- **Egress**: Free tier includes 10 TB/month
  - Check: OCI Console > Networking > VCN > Metrics
  - Over limit: $0.0085/GB (varies by region)
- **Public IPs**: 1 free, additional IPs charged
  - Check: OCI Console > Networking > Public IPs

**Recommendation**: Set up billing alerts in OCI Console.

---

## Next Steps (Post-Bootstrap)

1. **SSL/TLS Setup**:
   - Install certbot: `sudo apt install certbot`
   - Get certificate: `sudo certbot certonly --standalone -d yourdomain.com`
   - Configure Nginx with SSL
2. **Reverse Proxy**:
   - Set up Nginx to proxy `/api` → `localhost:3000`
   - Serve frontend static files
3. **Monitoring**:
   - Set up Prometheus + Grafana (optional)
   - Or use OCI native monitoring
4. **Backups**:
   - Snapshot boot volume weekly
   - Backup Postgres: `pg_dump` to block volume
   - Backup models: sync to Object Storage (if needed)

---

**Last Updated**: 2025-12-27

