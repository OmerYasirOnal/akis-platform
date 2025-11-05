# Security Policy

## Security Practices

AKIS Platform follows security best practices as outlined in the [Security Checklist](.cursor/checklists/Security.md).

### Key Principles

1. **Secrets Management**
   - No secrets in repository
   - Use environment variables only
   - Validate env at startup (fail-fast)
   - `.env.example` provided for reference

2. **Logging & Data**
   - No tokens/PII in logs
   - Redact sensitive values on error
   - Least-privilege database credentials

3. **Input Validation**
   - Validate all inputs at API boundary
   - Use Zod for schema validation
   - Sanitize outputs

4. **Dependencies**
   - Regular dependency audits
   - Avoid unmaintained packages
   - Keep dependencies minimal (OCI Free Tier constraints)

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers.

## References

- [Security Checklist](.cursor/checklists/Security.md)
- [Architecture Context](.cursor/context/CONTEXT_ARCHITECTURE.md)

