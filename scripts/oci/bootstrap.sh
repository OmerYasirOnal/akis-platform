#!/usr/bin/env bash
# scripts/oci/bootstrap.sh
# Bootstrap OCI A1 instance for AKIS deployment
#
# This script installs Docker, Node.js, and prepares the environment.
# Run as regular user (not root) on fresh Ubuntu 22.04 ARM64 instance.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/<YOUR_ORG>/akis-platform-devolopment/main/devagents/scripts/oci/bootstrap.sh | bash
#   # Or: ./scripts/oci/bootstrap.sh
#
# Prerequisites:
#   - Ubuntu 22.04 LTS ARM64
#   - Sudo access
#   - Internet connectivity

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
  echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  log_error "Do not run this script as root. Run as regular user with sudo access."
  exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [ "${ARCH}" != "aarch64" ] && [ "${ARCH}" != "arm64" ]; then
  log_warn "Architecture is ${ARCH} (expected aarch64/arm64 for OCI A1)"
  log_warn "Script may still work but OCI A1 specific optimizations assume ARM64"
fi

log_info "=== OCI A1 Bootstrap for AKIS Platform ==="
log_info "Architecture: ${ARCH}"
log_info "OS: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo ""

# Step 1: Update system
log_step "1/7 Updating system packages"
sudo apt update
sudo apt upgrade -y
log_info "✅ System updated"
echo ""

# Step 2: Install essentials
log_step "2/7 Installing essential packages"
sudo apt install -y curl git build-essential jq wget ca-certificates gnupg lsb-release
log_info "✅ Essentials installed"
echo ""

# Step 3: Install Docker
log_step "3/7 Installing Docker"
if command -v docker &> /dev/null; then
  log_info "Docker already installed ($(docker --version))"
else
  log_info "Downloading Docker install script..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
  rm /tmp/get-docker.sh
  
  # Add user to docker group
  sudo usermod -aG docker "${USER}"
  log_info "✅ Docker installed"
  log_warn "You may need to log out and back in for docker group membership to take effect"
fi
echo ""

# Step 4: Enable Docker on boot
log_step "4/7 Enabling Docker service"
sudo systemctl enable docker
sudo systemctl start docker
log_info "✅ Docker service enabled"
echo ""

# Step 5: Install Node.js 20.x
log_step "5/7 Installing Node.js 20.x"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  log_info "Node.js already installed (${NODE_VERSION})"
  
  # Check if version is 20.x
  if [[ ! "${NODE_VERSION}" =~ ^v20\. ]]; then
    log_warn "Node.js version is not 20.x, installing 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
else
  log_info "Installing Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_info "✅ Node.js ${NODE_VERSION} installed (npm ${NPM_VERSION})"
echo ""

# Step 6: Install pnpm
log_step "6/7 Installing pnpm"
if command -v pnpm &> /dev/null; then
  log_info "pnpm already installed ($(pnpm --version))"
else
  sudo npm install -g pnpm
  log_info "✅ pnpm installed ($(pnpm --version))"
fi
echo ""

# Step 7: Create data directories
log_step "7/7 Creating data directories"
mkdir -p ~/akis-data/localai/models
mkdir -p ~/akis-data/localai/cache
mkdir -p ~/akis-data/qdrant/storage
mkdir -p ~/akis-data/postgres
log_info "✅ Data directories created at ~/akis-data/"
echo ""

# Summary
log_info "=== Bootstrap Complete! ==="
echo ""
log_info "Next steps:"
echo "  1. Clone AKIS repository:"
echo "       git clone https://github.com/<YOUR_ORG>/akis-platform-devolopment.git"
echo "       cd akis-platform-devolopment/devagents"
echo ""
echo "  2. Download LLM model to ~/akis-data/localai/models/"
echo "       Example: curl -L 'https://gpt4all.io/models/ggml-gpt4all-j.bin' -o ~/akis-data/localai/models/ggml-gpt4all-j.bin"
echo ""
echo "  3. Configure environment:"
echo "       cp env.llm.local.example backend/.env.local"
echo "       nano backend/.env.local  # Set AI_MODEL_DEFAULT, DATABASE_URL, etc."
echo ""
echo "  4. Start services:"
echo "       docker compose -f docker-compose.llm.local.yml up -d"
echo "       ./scripts/llm-contract-smoke.sh  # Verify LocalAI"
echo "       ./scripts/rag-smoke.sh            # Verify Qdrant"
echo ""
echo "  5. Build and run backend:"
echo "       cd backend"
echo "       pnpm install"
echo "       pnpm db:migrate"
echo "       pnpm build"
echo "       pnpm start  # Or use PM2 for production"
echo ""
log_info "For detailed instructions, see docs/OCI_A1_BOOTSTRAP.md"
echo ""
log_warn "SECURITY REMINDER:"
echo "  - Never expose LocalAI/Qdrant ports publicly"
echo "  - Use firewall rules to restrict SSH to your IP"
echo "  - Generate secure AUTH_JWT_SECRET: openssl rand -base64 32"
echo "  - Set NODE_ENV=production in backend/.env.local"

