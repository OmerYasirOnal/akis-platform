# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **[BREAKING REFACTOR]** Complete structural refactor to feature-sliced architecture
  - Migrated from flat `lib/` structure to domain-organized `modules/` + `shared/`
  - Moved 35 files: agents, AI utils, auth, GitHub operations, components
  - Removed 6 deprecated files (1,831 lines, ~47KB): duplicate GitHub implementations, unused legacy utils
  - **100% `@/lib/` import elimination** (43 → 0 imports)
  - Established `modules/github/token-provider.ts` as Single Source of Truth for GitHub authentication
  - All GitHub calls now use centralized SSOT with 5-minute token caching
  - Path alias `@/*` fully enabled and validated
  - Zero TypeScript errors in application code
  - Build succeeds after Next.js cache clear
  - See: `docs/PHASE_2_REPORT.md`, `docs/PHASE_3_REPORT.md`, `docs/PHASE_4_REPORT.md` for complete details

### Added
- Comprehensive documentation structure (PLAN.md, CONTRIBUTING.md, GETTING_STARTED.md, ARCHITECTURE.md, API.md)
- CI/CD Documentation Quality Gate workflow
- GitHub PR and Issue templates
- CODEOWNERS file for code ownership
- Scribe heuristics improvement specification
- Enhanced README with detailed project information
- **Feature-sliced architecture** with clear module boundaries
- **GitHub SSOT** with JWT creation, token caching (5-min safety window), clock skew tolerance (2-min)
- **PEM format normalization** for private keys (`\n` → newline)
- **Server-only enforcement** for token provider (build-time)

### Removed
- `modules/github/auth/github-app.ts` (merged into token-provider.ts)
- `lib/github/token-provider.ts` (legacy duplicate)
- `lib/github/client.ts` (legacy duplicate, no upsert support)
- `lib/github/operations.ts` (legacy duplicate)
- `lib/auth/github-token.ts` (deprecated OAuth wrapper)
- `lib/agents/utils/github-utils-legacy.ts` (unused, 660 lines)

### Fixed
- Documentation coverage issues (target: DAS ≥ 80%)
- **Import chaos**: eliminated all `@/lib/` imports
- **GitHub auth duplication**: consolidated 3 token implementations into 1 SSOT
- **Module boundary violations**: established clear feature/shared separation

## [0.1.0] - 2025-01-27

### Added
- Initial release of AKIS DevAgents platform
- GitHub App integration for secure authentication
- Scribe Agent for automated documentation generation
- Documentation Agent with DAS scoring
- Multi-model AI support via OpenRouter
- Actor-based authentication system
- Branch creation and PR automation
- RESTful API endpoints for GitHub operations
- React-based UI with Tailwind CSS
- Environment validation scripts
- Documentation quality check scripts (markdown-lint, link-check, doc-proof)

### Infrastructure
- Next.js 16 with App Router
- TypeScript for type safety
- Zod for schema validation
- JWT-based GitHub App authentication
- Token management with caching and refresh logic

### Documentation
- GitHub App setup guide
- Environment configuration guide
- Authentication system documentation
- Agent system documentation
- API route documentation

---

## Version History Format

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements or vulnerability fixes

