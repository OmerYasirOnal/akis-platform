# OCI A1 Bootstrap Guide

**Target**: Oracle Cloud Infrastructure (OCI) Always Free Tier - ARM64 A1 Compute  
**Date**: 2025-12-27  
**Goal**: Deploy AKIS + Local LLM stack on OCI A1 (CPU-optimized inference)

---

## OCI A1 Free Tier Specifications

Oracle offers generous ARM64 compute in Always Free tier:

| Resource | Allocation |
|----------|------------|
| **CPU** | 4 ARM Ampere cores (shared) |
| **RAM** | 24 GB |
| **Storage** | 200 GB block volume |
| **Network** | 10 TB egress/month |
| **Architecture** | ARM64 (aarch64) |

**Perfect for**:
- LocalAI inference (CPU-optimized models)
- Qdrant vector database
- AKIS backend (Node.js)
- Lightweight frontend serving

---

## Prerequisites

### 1. OCI Account Setup

1. Create OCI account: https://cloud.oracle.com/
2. Create compartment: `akis-production`
3. Create VCN (Virtual Cloud Network):
   - CIDR: `10.0.0.0/16`
   - Public subnet: `10.0.1.0/24`
4. Configure security list:
   - **Ingress**:
     - Port 22 (SSH) - **Your IP only**
     - Port 443 (HTTPS) - Public
   - **Egress**:
     - All ports (for package downloads)

### 2. Compute Instance Creation

```bash
# Instance Configuration:
- Shape: VM.Standard.A1.Flex
- OCPUs: 2-4 (adjust based on needs)
- RAM: 12-24 GB
- OS: Ubuntu 22.04 LTS (ARM64)
- Boot volume: 50 GB (SSD)
- Additional block volume: 150 GB (for models/data)
```

**CRITICAL**: Never expose LocalAI or Qdrant ports publicly. All services run on localhost, reverse-proxied via Nginx if needed.

### 3. SSH Key Setup

```bash
# Generate SSH key locally (if not exists)
ssh-keygen -t ed25519 -C "akis-oci-a1" -f ~/.ssh/akis_oci_a1

# Add public key to OCI instance during creation
cat ~/.ssh/akis_oci_a1.pub
```

---

## Bootstrap Steps (On OCI Instance)

### Step 1: Initial System Setup

```bash
# SSH into instance
ssh -i ~/.ssh/akis_oci_a1 ubuntu@<OCI_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git build-essential jq
```

### Step 2: Install Docker

```bash
# Install Docker (official script)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version

# Enable on boot
sudo systemctl enable docker
```

### Step 3: Mount Additional Block Volume (Optional)

```bash
# If you attached a block volume for model storage:

# List available disks
lsblk

# Format and mount (assuming /dev/sdb)
sudo mkfs.ext4 /dev/sdb
sudo mkdir -p /mnt/akis-data
sudo mount /dev/sdb /mnt/akis-data
sudo chown -R ubuntu:ubuntu /mnt/akis-data

# Add to /etc/fstab for persistence
echo "/dev/sdb /mnt/akis-data ext4 defaults 0 2" | sudo tee -a /etc/fstab

# Create directories
mkdir -p /mnt/akis-data/localai/models
mkdir -p /mnt/akis-data/localai/cache
mkdir -p /mnt/akis-data/qdrant/storage
mkdir -p /mnt/akis-data/postgres
```

### Step 4: Install Node.js (20.x)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be 20.x
npm --version

# Install pnpm globally
npm install -g pnpm
```

### Step 5: Clone AKIS Repository

```bash
# Clone repo (use deploy key or HTTPS)
cd ~
git clone https://github.com/<YOUR_ORG>/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents

# Checkout production branch
git checkout main
```

### Step 6: Configure Environment

```bash
# Create production env files
cp env.llm.local.example backend/.env.local

# Edit backend/.env.local
nano backend/.env.local

# Required changes for production:
AI_PROVIDER=openai
AI_BASE_URL=http://localhost:8080/v1
AI_API_KEY=local-dummy-key
AI_MODEL_DEFAULT=ggml-gpt4all-j  # Or your chosen model

DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@localhost:5432/akis_production
NODE_ENV=production
AUTH_COOKIE_SECURE=true

# IMPORTANT: Generate secure secrets
AUTH_JWT_SECRET=$(openssl rand -base64 32)
```

### Step 7: Download LLM Model

```bash
# Download model to block volume (if using)
cd /mnt/akis-data/localai/models

# Option A: GPT4All-J (small, fast)
curl -L "https://gpt4all.io/models/ggml-gpt4all-j.bin" -o ggml-gpt4all-j.bin

# Option B: Use any GGUF model compatible with llama.cpp
# Place in this directory

# Link to AKIS data directory (if using default paths)
ln -s /mnt/akis-data/localai ~/akis-platform-devolopment/devagents/data/localai
```

### Step 8: Start Services

```bash
cd ~/akis-platform-devolopment/devagents

# Start LocalAI + Qdrant
docker compose -f docker-compose.llm.local.yml up -d

# Wait for health check (30-60s)
docker compose -f docker-compose.llm.local.yml ps

# Verify health
./scripts/llm-contract-smoke.sh
./scripts/rag-smoke.sh
```

### Step 9: Build and Run Backend

```bash
cd ~/akis-platform-devolopment/devagents/backend

# Install dependencies
pnpm install --frozen-lockfile

# Run migrations
pnpm db:migrate

# Build
pnpm build

# Start (use PM2 for production)
npm install -g pm2
pm2 start dist/server.js --name akis-backend
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Step 10: Build and Serve Frontend (Optional)

```bash
cd ~/akis-platform-devolopment/devagents/frontend

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Serve with Nginx (recommended) or simple server
sudo apt install -y nginx

# Copy build to nginx
sudo cp -r dist/* /var/www/html/

# Configure nginx (example minimal config)
sudo nano /etc/nginx/sites-available/akis

# Add:
# server {
#   listen 80;
#   server_name your-domain.com;
#   root /var/www/html;
#   index index.html;
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
#   location /api {
#     proxy_pass http://localhost:3000;
#     proxy_set_header Host $host;
#     proxy_set_header X-Real-IP $remote_addr;
#   }
# }

sudo ln -s /etc/nginx/sites-available/akis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Security Hardening

### Firewall Rules

```bash
# Use OCI Security List (preferred) or ufw

# If using ufw on instance:
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH (restrict to your IP in OCI Security List)
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### Service Isolation

```bash
# LocalAI and Qdrant should NEVER be publicly accessible
# Verify they're bound to localhost only:

docker compose -f docker-compose.llm.local.yml exec localai netstat -tuln | grep 8080
# Should show: 0.0.0.0:8080 or 127.0.0.1:8080 (internal network only)

# If exposed publicly, update docker-compose.llm.local.yml:
# ports:
#   - "127.0.0.1:8080:8080"  # Bind to localhost only
```

### Secrets Management

```bash
# NEVER commit production secrets to git
# Use environment files with strict permissions

chmod 600 backend/.env.local
chmod 600 .env.mcp.local

# Verify no secrets in git history
git log --all --full-history --source -- "*/.env*"
```

---

## Monitoring and Maintenance

### Health Checks

```bash
# Check all services
docker compose -f docker-compose.llm.local.yml ps
pm2 status

# Check LocalAI
curl http://localhost:8080/v1/models

# Check Qdrant
curl http://localhost:6333/healthz

# Check backend
curl http://localhost:3000/health
```

### Logs

```bash
# Docker logs
docker compose -f docker-compose.llm.local.yml logs -f localai
docker compose -f docker-compose.llm.local.yml logs -f qdrant

# Backend logs (PM2)
pm2 logs akis-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates

```bash
# Update AKIS codebase
cd ~/akis-platform-devolopment/devagents
git pull origin main

# Rebuild backend
cd backend
pnpm install
pnpm build
pm2 restart akis-backend

# Rebuild frontend (if changed)
cd ../frontend
pnpm install
pnpm build
sudo cp -r dist/* /var/www/html/
```

---

## Troubleshooting

### Issue: LocalAI OOM (Out of Memory)

**Symptom**: LocalAI crashes or becomes unresponsive

**Remediation**:
1. Use smaller model (e.g., ggml-gpt4all-j instead of llama-70b)
2. Reduce concurrent requests (set `THREADS=2` in compose file)
3. Add swap space:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Issue: High CPU Usage

**Symptom**: Instance sluggish, CPU at 100%

**Remediation**:
1. Limit concurrent LLM requests in backend (queue system)
2. Use smaller model or quantized model (Q4/Q5 GGUF)
3. Increase OCI instance OCPUs (scale up to 4)

### Issue: Disk Full

**Symptom**: Services fail to start, "no space left on device"

**Remediation**:
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Clean logs
sudo journalctl --vacuum-time=7d
pm2 flush
```

---

## Cost Optimization

OCI A1 is **Always Free**, but:
- Block volumes > 200 GB incur charges (~$0.0255/GB/month)
- Egress > 10 TB/month incurs charges
- Additional public IPs incur charges

**Recommendations**:
- Use single public IP with reverse proxy
- Keep models under 50 GB total
- Monitor egress (avoid serving large files)

---

## Next Steps

1. **Set up SSL/TLS**: Use Let's Encrypt + certbot for HTTPS
2. **Configure backups**: Snapshot block volumes weekly
3. **Set up monitoring**: Prometheus + Grafana or OCI native monitoring
4. **Load testing**: Verify instance handles expected load

---

**Last Updated**: 2025-12-27

