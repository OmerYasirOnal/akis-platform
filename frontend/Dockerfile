# AKIS Frontend Dockerfile
# Multi-stage build — produces static files for Caddy to serve
#
# NOTE: Frontend does not run as a standalone container.
# Build output (dist/) is served by the Caddy container.

# ── Build stage ──
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && pnpm install --frozen-lockfile; \
    else \
      npm ci; \
    fi

COPY . .

# Vite build — output goes to dist/
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Output stage — just the static files ──
FROM alpine:3.19 AS output
COPY --from=builder /app/dist /srv
