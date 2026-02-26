# API Specification (Canonical Index)

This file is the canonical API index for S0.5.

## Primary Source

- `backend/docs/API_SPEC.md`

## Required Health Endpoints

- `GET /health` -> `{"status":"ok"}`
- `GET /ready` -> `{"ready":true}`
- `GET /version` -> `{"version":"<semver>"}`
