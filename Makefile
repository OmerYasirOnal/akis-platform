.PHONY: dev build deploy deploy-remote logs logs-backend logs-caddy status stop clean

# ── Local Development ──
dev:
	@echo "Starting local DB..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "DB ready on localhost:5433"
	@echo ""
	@echo "Start backend:  cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true npx tsx watch src/server.ts"
	@echo "Start frontend: cd frontend && npm run dev"

# ── Build ──
build:
	cd frontend && npm run build
	cd backend && npm run build

# ── Local Docker Deploy ──
deploy:
	./deploy.sh staging

# ── Remote Deploy (SSH → OCI) ──
deploy-remote:
	./deploy-remote.sh

# ── Monitoring ──
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
