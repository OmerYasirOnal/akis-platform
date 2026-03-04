# API Spesifikasyonu (Canonical İndeks)

Bu dosya S0.5 için canonical API indeksidir.

## Birincil Kaynak

- `backend/docs/API_SPEC.md`

## Zorunlu Health Endpoint'leri

- `GET /health` -> `{"status":"ok"}`
- `GET /ready` -> `{"ready":true}`
- `GET /version` -> `{"version":"<semver>"}`
