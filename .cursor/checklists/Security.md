# Security
- Secrets only via environment; validated at startup (fail-fast).
- No tokens/PII in logs; redact on error.
- Input validation at API boundary; sanitize outputs.
- Dependencies audited; avoid unmaintained packages.
- DB creds least privilege.
