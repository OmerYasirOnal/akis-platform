/**
 * Demo Scribe Runner - Deterministic simulation for single-page console demo
 * 
 * This module provides a lightweight, backend-independent simulator that drives:
 * - Step transitions (Scanning → Analyzing → Drafting → Reviewing → Finalizing → PR-ready)
 * - Streaming log lines over time
 * - Evolving Markdown preview content
 * - Optional diff/patch payload for preview
 * 
 * No heavy dependencies - designed for OCI Free Tier constraints.
 */

export type ScribeRunStep = 
  | 'idle'
  | 'scanning'
  | 'analyzing'
  | 'drafting'
  | 'reviewing'
  | 'finalizing'
  | 'complete'
  | 'cancelled'
  | 'error';

export interface ScribeLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  step?: ScribeRunStep;
}

export interface ScribeRunState {
  status: ScribeRunStep;
  logs: ScribeLogEntry[];
  progress: number; // 0-100
  preview: string;
  diff: string;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

export interface ScribeRunConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  targetPath: string;
  dryRun: boolean;
}

type Listener = (state: ScribeRunState) => void;

// Demo log templates per step
const STEP_LOGS: Record<ScribeRunStep, string[]> = {
  idle: [],
  scanning: [
    '🔍 Scanning repository structure...',
    '📂 Found {count} markdown files in {path}',
    '📝 Analyzing file tree for documentation candidates',
    '✓ Repository scan complete',
  ],
  analyzing: [
    '🧠 Analyzing code structure and documentation gaps...',
    '📊 Processing {count} source files for API changes',
    '🔄 Comparing documentation against current codebase',
    '✓ Analysis phase complete - {issues} documentation gaps identified',
  ],
  drafting: [
    '✍️ Drafting documentation updates...',
    '📝 Generating README.md improvements',
    '📝 Updating API reference sections',
    '📝 Creating new component documentation',
    '✓ Draft generation complete',
  ],
  reviewing: [
    '🔍 Reviewing generated content for quality...',
    '✅ Grammar and style check passed',
    '✅ Technical accuracy verified',
    '✅ Link validation complete',
    '✓ Review phase complete',
  ],
  finalizing: [
    '📦 Finalizing documentation package...',
    '🔧 Formatting markdown files',
    '📋 Generating change summary',
    '✓ Documentation package ready',
  ],
  complete: [
    '🎉 Scribe run completed successfully!',
    '📄 {filesUpdated} files updated, {linesAdded} lines added',
    '🔗 Ready for PR creation',
  ],
  cancelled: ['⚠️ Run cancelled by user'],
  error: ['❌ Error occurred during execution'],
};

// Demo preview content that evolves
const PREVIEW_STAGES = {
  scanning: `# Documentation Preview
  
*Scanning repository...*

\`\`\`
Loading file structure...
\`\`\`
`,
  analyzing: `# Documentation Preview

## Analysis in Progress

📊 **Identified Documentation Gaps:**

- API reference needs updates for new endpoints
- Component documentation is outdated
- README installation steps need revision

*Preparing draft...*
`,
  drafting: `# Documentation Preview

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/auth/login\` | POST | User login |
| \`/auth/signup\` | POST | User registration |
| \`/auth/me\` | GET | Current user info |

### Agent Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/agents/jobs\` | POST | Create new job |
| \`/api/agents/jobs/:id\` | GET | Get job details |

*Continuing draft generation...*
`,
  reviewing: `# Documentation Preview

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/auth/login\` | POST | User login with email/password |
| \`/auth/signup\` | POST | New user registration |
| \`/auth/me\` | GET | Get authenticated user info |
| \`/auth/logout\` | POST | End user session |

### Agent Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/agents/jobs\` | POST | Create and start new agent job |
| \`/api/agents/jobs\` | GET | List jobs with pagination |
| \`/api/agents/jobs/:id\` | GET | Get job details with traces |
| \`/api/agents/jobs/:id/approve\` | POST | Approve pending job |

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

*Review in progress...*
`,
  complete: `# Documentation Preview

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/auth/login\` | POST | User login with email/password |
| \`/auth/signup\` | POST | New user registration |
| \`/auth/me\` | GET | Get authenticated user info |
| \`/auth/logout\` | POST | End user session |

### Agent Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/agents/jobs\` | POST | Create and start new agent job |
| \`/api/agents/jobs\` | GET | List jobs with pagination |
| \`/api/agents/jobs/:id\` | GET | Get job details with traces |
| \`/api/agents/jobs/:id/approve\` | POST | Approve pending job |

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
\`\`\`

## Configuration

Create \`.env.local\` with:

\`\`\`env
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=your-secret-key
\`\`\`

---

✅ **Documentation updated successfully**
`,
};

// Demo diff content
const DEMO_DIFF = `diff --git a/docs/README.md b/docs/README.md
index 1234567..abcdefg 100644
--- a/docs/README.md
+++ b/docs/README.md
@@ -1,5 +1,12 @@
 # AKIS Platform Documentation

+## Quick Start
+
+\`\`\`bash
+pnpm install
+pnpm dev
+\`\`\`
+
 ## Overview

 AKIS Platform provides autonomous AI agents for software development.
@@ -15,6 +22,15 @@ AKIS Platform provides autonomous AI agents for software development.
 | \`/auth/login\` | POST | User login |
 | \`/auth/signup\` | POST | User registration |
+| \`/auth/me\` | GET | Current user info |
+| \`/auth/logout\` | POST | End session |
+
+### Agent Endpoints
+
+| Endpoint | Method | Description |
+|----------|--------|-------------|
+| \`/api/agents/jobs\` | POST | Create job |
+| \`/api/agents/jobs/:id\` | GET | Get job |
`;

/**
 * DemoScribeRunner class
 * Manages the demo run lifecycle with controllable start/cancel/reset
 */
export class DemoScribeRunner {
  private state: ScribeRunState;
  private listeners: Set<Listener> = new Set();
  private timers: number[] = [];
  private config: ScribeRunConfig | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): ScribeRunState {
    return {
      status: 'idle',
      logs: [],
      progress: 0,
      preview: '',
      diff: '',
      startedAt: null,
      completedAt: null,
      error: null,
    };
  }

  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private addLog(level: ScribeLogEntry['level'], message: string, step?: ScribeRunStep): void {
    const entry: ScribeLogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      message,
      step,
    };
    this.state = {
      ...this.state,
      logs: [...this.state.logs, entry],
    };
    this.notify();
  }

  private setStatus(status: ScribeRunStep, progress: number): void {
    this.state = {
      ...this.state,
      status,
      progress,
    };
    this.notify();
  }

  private setPreview(preview: string): void {
    this.state = {
      ...this.state,
      preview,
    };
    this.notify();
  }

  private setDiff(diff: string): void {
    this.state = {
      ...this.state,
      diff,
    };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  private clearTimers(): void {
    this.timers.forEach((timerId) => window.clearTimeout(timerId));
    this.timers = [];
  }

  private scheduleTimer(callback: () => void, delay: number): void {
    const timerId = window.setTimeout(callback, delay);
    this.timers.push(timerId);
  }

  private interpolateLog(template: string): string {
    const replacements: Record<string, string> = {
      '{count}': String(Math.floor(Math.random() * 50) + 10),
      '{path}': this.config?.targetPath || 'docs/',
      '{issues}': String(Math.floor(Math.random() * 5) + 2),
      '{filesUpdated}': String(Math.floor(Math.random() * 8) + 3),
      '{linesAdded}': String(Math.floor(Math.random() * 200) + 50),
    };

    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(key, value);
    }
    return result;
  }

  private runStep(step: ScribeRunStep, progress: number, delay: number): Promise<void> {
    return new Promise((resolve) => {
      this.scheduleTimer(() => {
        if (this.state.status === 'cancelled') {
          resolve();
          return;
        }

        this.setStatus(step, progress);

        // Update preview based on step
        const previewKey = step as keyof typeof PREVIEW_STAGES;
        if (PREVIEW_STAGES[previewKey]) {
          this.setPreview(PREVIEW_STAGES[previewKey]);
        }

        // Add logs for this step with staggered timing
        const logs = STEP_LOGS[step] || [];
        logs.forEach((logTemplate, index) => {
          this.scheduleTimer(() => {
            if (this.state.status !== 'cancelled') {
              const level = logTemplate.startsWith('✓') || logTemplate.startsWith('✅') || logTemplate.startsWith('🎉')
                ? 'success'
                : logTemplate.startsWith('❌') || logTemplate.startsWith('⚠️')
                  ? 'error'
                  : 'info';
              this.addLog(level, this.interpolateLog(logTemplate), step);
            }
          }, index * 400);
        });

        // Update diff on finalizing step
        if (step === 'finalizing') {
          this.scheduleTimer(() => {
            this.setDiff(DEMO_DIFF);
          }, 500);
        }

        resolve();
      }, delay);
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener({ ...this.state });
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current state snapshot
   */
  getState(): ScribeRunState {
    return { ...this.state };
  }

  /**
   * Start a demo run
   */
  async start(config: ScribeRunConfig): Promise<void> {
    this.clearTimers();
    this.config = config;
    
    this.state = {
      ...this.getInitialState(),
      status: 'scanning',
      startedAt: Date.now(),
    };
    this.notify();

    this.addLog('info', `🚀 Starting Scribe run for ${config.owner}/${config.repo}`);
    this.addLog('info', `📁 Target path: ${config.targetPath}`);
    this.addLog('info', `🌿 Base branch: ${config.baseBranch}`);
    if (config.dryRun) {
      this.addLog('warning', '⚠️ Dry run mode - no changes will be committed');
    }

    // Run through steps with delays
    await this.runStep('scanning', 15, 800);
    await this.runStep('analyzing', 35, 2000);
    await this.runStep('drafting', 55, 2500);
    await this.runStep('reviewing', 75, 2000);
    await this.runStep('finalizing', 90, 1500);

    // Complete
    this.scheduleTimer(() => {
      if (this.state.status !== 'cancelled') {
        this.state = {
          ...this.state,
          status: 'complete',
          progress: 100,
          completedAt: Date.now(),
        };
        this.setPreview(PREVIEW_STAGES.complete);
        this.addLog('success', '🎉 Scribe run completed successfully!');
        this.addLog('success', `📄 Documentation updated in ${((Date.now() - (this.state.startedAt || Date.now())) / 1000).toFixed(1)}s`);
        this.notify();
      }
    }, 1000);
  }

  /**
   * Cancel the current run
   */
  cancel(): void {
    this.clearTimers();
    this.state = {
      ...this.state,
      status: 'cancelled',
    };
    this.addLog('warning', '⚠️ Run cancelled by user');
    this.notify();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.clearTimers();
    this.config = null;
    this.state = this.getInitialState();
    this.notify();
  }

  /**
   * Cleanup - call when unmounting
   */
  destroy(): void {
    this.clearTimers();
    this.listeners.clear();
  }
}

// Singleton instance for the demo
let demoRunnerInstance: DemoScribeRunner | null = null;

export function getDemoScribeRunner(): DemoScribeRunner {
  if (!demoRunnerInstance) {
    demoRunnerInstance = new DemoScribeRunner();
  }
  return demoRunnerInstance;
}

export function resetDemoScribeRunner(): void {
  if (demoRunnerInstance) {
    demoRunnerInstance.destroy();
    demoRunnerInstance = null;
  }
}

