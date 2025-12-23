# Playbook for Reliable PR-Generating AI Agents - Research Summary

> Summarized from the research document "Playbook for Reliable PR-Generating AI Agents" (2025).
> This markdown serves as a reference without committing binary files to the repository.

## Core Principles

### 1. Contract-First Planning
Before any code generation, the agent must produce a **plan document** (contract) that includes:
- **Objective & Context**: Clear task definition with issue tracker links
- **Scope & Constraints**: What will/won't be done, coding standards, security rules
- **Proposed Solution Plan**: Design changes, functions to modify, rationale
- **Validation Strategy**: How the agent will verify changes (tests, linting, etc.)
- **Rollback/Mitigation Plan**: What to do if changes fail
- **Documentation Updates**: Required doc/comment changes
- **AI Usage Disclosure**: Transparency note in PR description
- **Evidence Checklist**: Proof required (test results, coverage, scan reports)

### 2. Evidence-First Delivery
Every quality gate must be accompanied by **documented proof**:
- Tests passed: CI run link, test report
- Code coverage: Before/after comparison with links
- Static analysis: Lint/type-check output
- Security scans: Scan results attached
- No assertions without evidence

### 3. Dry-Run → Approval → Execute Pipeline
1. **Task Intake**: Agent receives task, gathers context, summarizes requirements
2. **Planning Phase**: Agent creates plan using contract template; job pauses for human approval if required
3. **Execution Phase**: Dry-run mode - creates draft PR on agent branch, no merge
4. **Validation Phase**: Self-check via linting, tests, and AI critique/reflection
5. **PR Refinement**: Fill in template with evidence, attach artifacts
6. **Human Review**: Reviewer inspects, agent may iterate on feedback
7. **Approval & Merge**: Final CI check, human approval required, merge

### 4. Quality Gates Checklist
Before merge, PR must pass:
- [ ] All tests pass, no regressions
- [ ] Static analysis clean (lint, typecheck, format)
- [ ] Code review approved by human
- [ ] Documentation updated if API changed
- [ ] Security scan passed (no new vulnerabilities)
- [ ] Performance not degraded (if applicable)

### 5. Observability & Tracing
- **Step-level tracing**: Every step emits trace events with timing/status
- **Decision logging**: All tool calls and AI decisions logged
- **Artifact preservation**: Plan doc, diff, test output, coverage reports stored
- **Screenshots**: Visual evidence for UI changes
- **Audit trails**: Metadata tags (agent ID, job ID, model version)

### 6. Cost-Aware Execution
- **Default dry-run**: Never auto-merge without approval
- **Token budgets**: Track and limit AI usage
- **Model tiering**: Cheap models for drafting, strong models for validation
- **Circuit breakers**: Stop on repeated failures, escalate to human

## References

- [CodeMender - Google DeepMind](https://deepmind.google/blog/introducing-codemender-an-ai-agent-for-code-security/)
- [GitHub Copilot Coding Agent 101](https://github.blog/ai-and-ml/github-copilot/github-copilot-coding-agent-101-getting-started-with-agentic-workflows-on-github/)
- [Microsoft Azure Agent Factory Best Practices](https://azure.microsoft.com/en-us/blog/agent-factory-top-5-agent-observability-best-practices-for-reliable-ai/)
- [Anthropic: Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [AugmentCode AI Agent Workflow Guide](https://www.augmentcode.com/guides/ai-agent-workflow-implementation-guide)

## See Also

- [SCRIBE_PR_FACTORY_V1.md](./SCRIBE_PR_FACTORY_V1.md) - AKIS implementation of these principles

