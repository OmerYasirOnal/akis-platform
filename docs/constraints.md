# Platform Constraints (OCI Free Tier)
- Memory/CPU mindful: single Node process; avoid large transitive deps.
- Lazy import deep modules; no synchronous/blocking work in routes.
- Conservative DB pooling (e.g., 5–10 conns).
- HTTP client: timeouts + exponential backoff; streaming for large payloads.
- Container later: node:20-alpine, multi-stage build.
