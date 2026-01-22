# AKIS Platform - OCI Staging Deployment Scaffolding
#
# This directory contains deployment configuration for staging on OCI Free Tier.
#
# ## Usage
#
# 1. Copy docker-compose.yml to /opt/akis/ on OCI VM
# 2. Copy Caddyfile to /opt/akis/Caddyfile
# 3. Create .env file from env.example template
# 4. Run: docker compose up -d
#
# ## Services
#
# - caddy: Reverse proxy, HTTPS termination, static file serving
# - backend: Fastify API server
# - db: PostgreSQL 16 database
# - mcp-gateway: Optional GitHub/Jira/Confluence MCP bridge
#
# ## Promotion to Production
#
# When promoting to production, update:
# - Domain in Caddyfile (staging.akisflow.com → akisflow.com)
# - AUTH_COOKIE_SECURE=true (mandatory in production)
# - Separate OAuth credentials for production
# - Stricter rate limits
# - LOG_LEVEL=info (not debug)
#
# See: docs/deploy/OCI_STAGING_RUNBOOK.md for detailed procedures
