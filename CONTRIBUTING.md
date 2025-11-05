# Contributing to AKIS Platform

## Development Setup

1. Install dependencies:
```bash
cd backend
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Run development server:
```bash
pnpm dev
```

## Code Quality

Before committing, ensure:

- ✅ TypeScript strict mode passes: `pnpm typecheck`
- ✅ ESLint passes: `pnpm lint`
- ✅ Prettier formatting: Run formatter before commit
- ✅ Server starts: `pnpm dev` → `/health` returns `{status:"ok"}`

## Architecture Compliance

Please review:
- [Rules & Guardrails](.cursor/rules/rules.mdc)
- [Architecture Context](.cursor/context/CONTEXT_ARCHITECTURE.md)
- [Definition of Done](.cursor/checklists/DoD.md)

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance tasks
- `docs:` - Documentation changes
- `refactor:` - Code refactoring

## Checklist References

- [DoD Checklist](.cursor/checklists/DoD.md)
- [Security Checklist](.cursor/checklists/Security.md)
- [Performance Checklist](.cursor/checklists/Performance.md)

