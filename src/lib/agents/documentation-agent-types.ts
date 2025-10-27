/**
 * Documentation Agent Types
 * Specialized types for documentation analysis and generation
 */

// Input types
export interface DocumentationAgentInput {
  action: 'repo_summary' | 'doc_gap_analysis' | 'generate_proposal' | 'validate_docs' | 'create_branch_pr' | 'full_workflow';
  repoUrl: string;
  branch?: string;
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken?: string; // GitHub PAT (client-side only)
  options?: {
    maxFilesToScan?: number;
    maxRunTime?: number; // in seconds
    skipValidation?: boolean;
    humanReviewers?: string[];
  };
}

// Repository summary
export interface RepoSummary {
  repoUrl: string;
  branch: string;
  analyzedAt: string;
  stack: {
    language: string;
    framework?: string;
    runtime?: string;
    database?: string[];
    other?: string[];
  };
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'maven' | 'gradle' | 'go' | 'cargo' | 'swift';
  scripts: Array<{
    name: string;
    command: string;
    source: string; // e.g., "package.json:5"
  }>;
  entryPoints: string[];
  existingDocs: Array<{
    path: string;
    type: 'readme' | 'changelog' | 'contributing' | 'license' | 'other';
    lineCount: number;
    lastModified?: string;
  }>;
  keyFiles: Array<{
    path: string;
    purpose: string;
  }>;
}

// Documentation gap analysis
export interface DocGapAnalysis {
  coverage: {
    hasReadme: boolean;
    hasChangelog: boolean;
    hasContributing: boolean;
    hasLicense: boolean;
    hasGettingStarted: boolean;
    hasArchitecture: boolean;
    hasAPI: boolean;
    hasEnvExample: boolean;
  };
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    category: 'missing' | 'outdated' | 'broken-link' | 'invalid-command' | 'no-reference';
    description: string;
    evidence: string; // file path, line number, or command output
    impact: string;
  }>;
  suggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    wsjfScore?: number; // Weighted Shortest Job First
    action: string;
    rationale: string;
    effort: 'small' | 'medium' | 'large';
  }>;
}

// Proposed document
export interface ProposedDocument {
  type: 'readme' | 'changelog' | 'contributing' | 'architecture' | 'api' | 'env-example';
  path: string;
  content: string;
  metadata: {
    generatedAt: string;
    basedOn?: string; // original file path if updating
    changes: string[]; // list of major changes
  };
}

// Validation result (DAS metrics)
export interface ValidationResult {
  das: number; // 0-100
  refCoverage: {
    score: number; // 0-100
    totalReferences: number;
    foundReferences: number;
    missingReferences: Array<{
      reference: string;
      location: string; // where it's mentioned in the doc
    }>;
  };
  consistency: {
    score: number; // 0-100
    links: {
      total: number;
      working: number;
      broken: Array<{
        url: string;
        status: number | string;
        location: string;
      }>;
    };
    commands: {
      total: number;
      working: number;
      failing: Array<{
        command: string;
        error: string;
        location: string;
      }>;
    };
    envVars: {
      total: number;
      documented: number;
      missing: string[];
    };
  };
  spotCheck: {
    score: number; // 0-100
    checklist: Array<{
      item: string;
      passed: boolean;
      comment?: string;
    }>;
  };
  recommendation: 'approve' | 'needs-changes' | 'reject';
  issues: string[];
}

// Branch & PR info
export interface BranchPRInfo {
  branchName: string;
  baseBranch: string;
  commits: Array<{
    message: string;
    files: string[];
  }>;
  prUrl?: string;
  prNumber?: number;
  prStatus: 'draft' | 'open' | 'ready-for-review' | 'changes-requested' | 'approved';
}

// Full workflow output (combines all steps)
export interface DocumentationWorkflowOutput {
  step: 'repo_summary' | 'doc_gap_analysis' | 'generate_proposal' | 'validate_docs' | 'create_branch_pr' | 'complete';
  repoSummary?: RepoSummary;
  gapAnalysis?: DocGapAnalysis;
  proposedDocs?: ProposedDocument[];
  validation?: ValidationResult;
  branchPR?: BranchPRInfo;
  artifacts: {
    REPO_SUMMARY?: string;
    DOC_REPORT?: string;
    'README.proposed'?: string;
    'CHANGELOG.proposed'?: string;
    DAS_REPORT?: string;
    PR_DESCRIPTION?: string;
  };
  errors?: string[];
  warnings?: string[];
  timestamp: string;
}

// GitHub API helpers
export interface GitHubFileContent {
  path: string;
  content: string; // base64 or plain text
  sha: string;
  size: number;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

// Constraints
export interface DocumentationConstraints {
  maxFilesToScan: number;
  maxRunTime: number; // seconds
  noSecrets: boolean;
  humanReviewers: string[];
}

// PR Template data
export interface PRTemplateData {
  summary: string;
  changes: string[];
  proofs: Array<{
    type: 'file' | 'command' | 'link';
    description: string;
    evidence: string;
  }>;
  risks: string[];
  rollbackPlan: string;
  metrics: {
    das: number;
    refCoverage: number;
    consistency: number;
    spotCheck: number;
  };
  checklist: Array<{
    item: string;
    status: 'checked' | 'unchecked' | 'warning';
  }>;
  reviewerNotes: string[];
}

