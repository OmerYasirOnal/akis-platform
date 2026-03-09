.PHONY: dev build deploy-staging deploy-staging-dry deploy-staging-quick \
       staging-logs staging-status staging-health \
       logs logs-backend logs-caddy status stop clean quality

# ── Staging Deploy Defaults ──
STAGING_HOST ?= 141.147.25.123
STAGING_USER ?= ubuntu
STAGING_KEY  ?= ~/.ssh/id_ed25519

# ── Local Development ──
dev:
	@echo "Starting local DB..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "DB ready on localhost:5433"
	@echo ""
	@echo "Start backend:  cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true npx tsx watch src/server.ts"
	@echo "Start frontend: pnpm -C frontend dev"

# ── Build ──
build:
	pnpm -C frontend build
	pnpm -C backend build

# ── Quality Gate ──
quality:
	pnpm -C backend typecheck && pnpm -C backend lint
	pnpm -C frontend typecheck && pnpm -C frontend lint

# ── Staging Deploy (one-liner) ──
deploy-staging:
	./scripts/staging_deploy_manual.sh \
		--host $(STAGING_HOST) --user $(STAGING_USER) --key $(STAGING_KEY) --confirm

deploy-staging-dry:
	./scripts/staging_deploy_manual.sh \
		--host $(STAGING_HOST) --user $(STAGING_USER) --key $(STAGING_KEY)

deploy-staging-quick:
	./scripts/staging_deploy_manual.sh \
		--host $(STAGING_HOST) --user $(STAGING_USER) --key $(STAGING_KEY) \
		--skip-tests --confirm

# ── Remote Monitoring ──
staging-logs:
	ssh -i $(STAGING_KEY) $(STAGING_USER)@$(STAGING_HOST) \
		"cd /opt/akis && docker compose logs -f --tail=50 backend"

staging-status:
	ssh -i $(STAGING_KEY) $(STAGING_USER)@$(STAGING_HOST) \
		"cd /opt/akis && docker compose ps && echo '---' && docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.CreatedSince}}' | grep akis"

staging-health:
	@curl -sf https://staging.akisflow.com/health | python3 -m json.tool || echo "UNHEALTHY"

# ── Local Docker ──
logs:
	docker compose logs -f --tail=50

logs-backend:
	docker compose logs -f --tail=50 backend

logs-caddy:
	docker compose logs -f --tail=50 caddy

status:
	docker compose ps

# ── Cleanup ──
stop:
	docker compose down

clean:
	docker compose down -v --remove-orphans
	@echo "All containers and volumes removed."
