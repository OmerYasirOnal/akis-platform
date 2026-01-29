# Scribe MVP: Contract-First Doc Specialist

## Overview

Scribe MVP is a major upgrade to the ScribeAgent that transforms it from a simple documentation updater into a contract-first, multi-file documentation specialist.

## What's New in v2

### 1. Contract-Driven Documentation

Scribe MVP uses **Documentation Contracts** that define:
- Required and optional sections for different doc types
- File patterns (README, guides, setup docs, API docs, ADRs, etc.)
- Quality requirements (minimum length, code examples, tone)

Contracts ensure consistent, high-quality documentation across the repository.

### 2. Multi-File Support

When `targetPath` points to a directory (e.g., `docs/`), Scribe MVP:
- Scans for existing documentation files
- Selects appropriate targets based on the task
- Updates or creates multiple files in a single operation

### 3. Playbook-Driven Workflow

Scribe MVP follows a structured playbook:

1. **Branch Management** - Create or use existing feature branch
2. **Repo Scan** - Discover documentation structure
3. **Scope Lock** - Select target files based on contracts
4. **Generate** - Create contract-compliant content using AI
5. **Review** - AI critique validates contract compliance
6. **Commit** - Save all changes (or simulate in dry-run)
7. **PR** - Open pull request with detailed file summary

### 4. Enhanced Explainability

Every phase emits detailed trace events:
- Tool calls with `asked`/`did`/`why`/`output` summaries
- Decision points with reasoning
- Document reads and file modifications
- No raw chain-of-thought exposure (secrets redacted)

### 5. Better AI Integration

- Contract-driven prompts guide AI to generate structured content
- Section requirements ensure completeness
- Tone and quality rules maintain consistency

## Documentation Contracts

### Supported Doc Types

| Type | Files | Required Sections | Use Case |
|------|-------|-------------------|----------|
| `readme` | README.md | Title, Installation, Usage | Project overview |
| `guide` | docs/**/*.md | Overview, Main Content | User/developer guides |
| `setup` | docs/DEV_SETUP.md, etc. | Prerequisites, Installation Steps, Configuration | Setup instructions |
| `changelog` | CHANGELOG.md | Version, Changes | Version history |
| `adr` | docs/adr/*.md | Title, Status, Context, Decision, Consequences | Architecture decisions |
| `api` | docs/API.md | Endpoint, Description, Request, Response | API documentation |
| `contributing` | CONTRIBUTING.md | Welcome, How to Contribute, Pull Request Process | Contributor guide |

### Contract Example

```typescript
export const README_CONTRACT: DocTypeContract = {
  fileType: 'readme',
  patterns: ['README.md'],
  sections: [
    {
      name: 'Title and Description',
      required: true,
      description: 'Project name and one-line summary',
    },
    {
      name: 'Installation',
      required: true,
      description: 'How to install/setup the project',
      hints: ['Step-by-step', 'Include prerequisites', 'Code snippets'],
    },
    // ... more sections
  ],
  qualityRules: {
    minLength: 500,
    requireCodeExamples: true,
    tone: 'friendly',
  },
};
```

## How to Use Scribe MVP

### Single File Update

```typescript
const task = {
  owner: 'myorg',
  repo: 'myrepo',
  baseBranch: 'main',
  targetPath: 'README.md', // Single file
  taskDescription: 'Add installation instructions for Docker setup',
  dryRun: false, // Set to true for testing
};
```

### Multi-File Update (docs/ directory)

```typescript
const task = {
  owner: 'myorg',
  repo: 'myrepo',
  baseBranch: 'main',
  targetPath: 'docs/', // Directory - Scribe will discover and update multiple files
  taskDescription: 'Update setup and configuration documentation',
  dryRun: true, // Start with dry-run to preview
};
```

### Dry-Run Mode

Always test with `dryRun: true` first:
- No branch creation
- No commits
- No PR
- Returns preview of what would be updated

Response includes:
```typescript
{
  ok: true,
  agent: 'scribe-v2',
  mode: 'contract-first-doc-specialist',
  filesUpdated: 2,
  preview: {
    branch: 'docs/scribe-20240101-120000',
    files: [
      { path: 'docs/README.md', contentLength: 1234, linesAdded: 50 },
      { path: 'docs/DEV_SETUP.md', contentLength: 2345, linesAdded: 75 },
    ],
    commitMessage: 'docs: update 2 files via Scribe MVP',
  },
  diagnostics: {
    mode: 'dry-run',
    operations: [...],
    targets: ['docs/README.md', 'docs/DEV_SETUP.md'],
  },
}
```

## Quality Assurance

Scribe MVP includes built-in quality checks:

1. **Contract Validation**: Ensures all required sections are present
2. **AI Review**: Critiques generated content before commit
3. **Explainability Timeline**: Full trace of decisions and actions
4. **Safe Defaults**: Dry-run mode for testing
5. **Secret Redaction**: Never exposes tokens or sensitive data

## Migration from v1

### Breaking Changes

- `agent` field now returns `'scribe-v2'` instead of `'scribe'`
- Response includes `diagnostics` object
- Multiple files may be updated in a single run
- `preview` structure changed for multi-file support

### Backward Compatibility

- Single-file mode still works (use `targetPath: 'README.md'`)
- Existing v1 tests updated to match v2 response format
- All v1 features preserved

## Architecture

```
backend/src/agents/scribe/
├── ScribeAgent.ts         # Main agent (v2 implementation)
├── DocContract.ts         # Contract definitions and utilities
```

### Key Components

1. **DocContract.ts**: Defines documentation standards
   - Contract types for different doc files
   - Section requirements
   - Quality rules
   - Contract selection logic

2. **ScribeAgent.ts**: Implements playbook-driven workflow
   - Repo scanning for multi-file mode
   - Contract-driven content generation
   - Multi-file commit support
   - Enhanced tracing and explainability

## Security

Scribe MVP maintains strict security:

- **No Raw Chain-of-Thought**: Only user-facing reasoning summaries
- **Secret Redaction**: Tokens, keys, and credentials never logged
- **Safe Contracts**: No executable code in generated docs
- **Audit Trail**: Full trace of actions for compliance

## Performance

- **Caching**: MCP tool lists cached with TTL
- **Parallel Operations**: Multiple files processed efficiently
- **Smart Scanning**: Only reads relevant doc files
- **Dry-Run First**: Test without side effects

## Testing

Run Scribe MVP tests:

```bash
# Backend tests (includes v2 dry-run test)
pnpm -C backend test

# Specific v2 test
pnpm -C backend test -- --grep "ScribeAgent.*dryRun"
```

## Future Enhancements

Planned improvements for future versions:

- [ ] Batch commits (single commit for multiple files)
- [ ] Template library for common doc structures
- [ ] Auto-detect documentation gaps
- [ ] Integration with CI/CD for automated doc updates
- [ ] Multi-language documentation support
- [ ] Documentation quality scoring

## Examples

### Example 1: Update README

```typescript
// Task: Add Docker setup instructions to README
const result = await scribeAgent.executeWithTools({}, undefined, {
  owner: 'myorg',
  repo: 'api-server',
  baseBranch: 'main',
  targetPath: 'README.md',
  taskDescription: 'Add Docker setup and configuration instructions',
  dryRun: false,
});

// Result includes:
// - Updated README.md with Docker section
// - AI review confirming quality
// - Pull request created
// - Full timeline of actions
```

### Example 2: Create docs/ Structure

```typescript
// Task: Bootstrap documentation for a new project
const result = await scribeAgent.executeWithTools({}, undefined, {
  owner: 'myorg',
  repo: 'new-service',
  baseBranch: 'main',
  targetPath: 'docs/',
  taskDescription: 'Create comprehensive documentation structure: setup, architecture, and API guides',
  dryRun: true, // Preview first
});

// Result includes:
// - docs/README.md (overview)
// - docs/DEV_SETUP.md (setup guide)
// - docs/ARCHITECTURE.md (system design)
// - docs/API.md (API reference)
// All following their respective contracts
```

## Troubleshooting

### Issue: "No files found in target directory"

**Solution**: Scribe MVP will create a default `docs/README.md` if no docs exist. Ensure the directory path ends with `/`.

### Issue: "Contract validation failed"

**Solution**: Review the `critiques` in the response. The AI will identify missing required sections or quality issues.

### Issue: "Multiple files updated but PR shows only one commit"

**Expected**: Each file gets its own commit for traceability. The PR will show all commits.

## Summary

Scribe MVP transforms documentation updates from a simple file append operation into a contract-driven, multi-file, quality-assured process. It ensures consistent, complete, and maintainable documentation across your entire repository.

**Key Benefits:**
- ✅ Contract-enforced documentation structure
- ✅ Multi-file updates in one operation
- ✅ AI-powered content generation with quality review
- ✅ Full explainability and audit trail
- ✅ Safe dry-run testing mode
- ✅ Backward compatible with v1 workflows

