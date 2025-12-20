/**
 * DocContract - Formal specification for documentation structure and requirements
 * 
 * Scribe v2 uses this contract to:
 * - Define expected documentation sections
 * - Specify file targets (README, docs/, CHANGELOG, ADR)
 * - Support multi-file documentation sets
 * - Ensure consistency across documentation updates
 */

/**
 * Supported documentation file types
 */
export type DocFileType = 
  | 'readme'          // README.md (project overview)
  | 'guide'           // User/developer guides in docs/
  | 'changelog'       // CHANGELOG.md (version history)
  | 'adr'             // Architecture Decision Records
  | 'api'             // API documentation
  | 'setup'           // Setup/installation guides
  | 'contributing'    // CONTRIBUTING.md
  | 'other';          // Other documentation files

/**
 * Required sections for different doc types
 */
export interface DocSection {
  name: string;
  required: boolean;
  description: string;
  /** Expected content structure/hints for AI */
  hints?: string[];
}

/**
 * Documentation contract for a specific file type
 */
export interface DocTypeContract {
  fileType: DocFileType;
  /** Typical file patterns (e.g., "README.md" or "docs slash star star slash star.md") */
  patterns: string[];
  /** Sections expected in this doc type */
  sections: DocSection[];
  /** Minimum content quality requirements */
  qualityRules: {
    minLength?: number;
    requireCodeExamples?: boolean;
    requireLinks?: boolean;
    tone?: 'technical' | 'friendly' | 'formal';
  };
}

/**
 * Standard README contract
 */
export const README_CONTRACT: DocTypeContract = {
  fileType: 'readme',
  patterns: ['README.md'],
  sections: [
    {
      name: 'Title and Description',
      required: true,
      description: 'Project name and one-line summary',
      hints: ['Clear, concise', 'Should explain "what" in one sentence'],
    },
    {
      name: 'Features',
      required: false,
      description: 'Key features and capabilities',
      hints: ['Bullet list format', 'Highlight unique selling points'],
    },
    {
      name: 'Installation',
      required: true,
      description: 'How to install/setup the project',
      hints: ['Step-by-step', 'Include prerequisites', 'Code snippets'],
    },
    {
      name: 'Usage',
      required: true,
      description: 'Basic usage examples',
      hints: ['Code examples', 'Common use cases', 'Quick start'],
    },
    {
      name: 'Configuration',
      required: false,
      description: 'Configuration options and environment variables',
      hints: ['Table format for env vars', 'Default values', 'Required vs optional'],
    },
    {
      name: 'Contributing',
      required: false,
      description: 'How to contribute to the project',
      hints: ['Link to CONTRIBUTING.md if exists', 'Brief guidelines'],
    },
    {
      name: 'License',
      required: false,
      description: 'License information',
      hints: ['License type', 'Link to LICENSE file'],
    },
  ],
  qualityRules: {
    minLength: 500,
    requireCodeExamples: true,
    tone: 'friendly',
  },
};

/**
 * Guide contract (for docs/ directory files)
 */
export const GUIDE_CONTRACT: DocTypeContract = {
  fileType: 'guide',
  patterns: ['docs/**/*.md', 'docs/*.md'],
  sections: [
    {
      name: 'Overview',
      required: true,
      description: 'What this guide covers',
      hints: ['Context setting', '2-3 sentences'],
    },
    {
      name: 'Prerequisites',
      required: false,
      description: 'What the reader should know/have before starting',
    },
    {
      name: 'Main Content',
      required: true,
      description: 'The core guide content',
      hints: ['Logical flow', 'Step-by-step where applicable', 'Code examples'],
    },
    {
      name: 'Examples',
      required: false,
      description: 'Practical examples',
      hints: ['Real-world scenarios', 'Code snippets', 'Common patterns'],
    },
    {
      name: 'Troubleshooting',
      required: false,
      description: 'Common issues and solutions',
      hints: ['Problem-solution format', 'Error messages with fixes'],
    },
    {
      name: 'Next Steps',
      required: false,
      description: 'Links to related guides or further reading',
    },
  ],
  qualityRules: {
    minLength: 300,
    requireCodeExamples: true,
    tone: 'technical',
  },
};

/**
 * Setup/Installation guide contract
 */
export const SETUP_CONTRACT: DocTypeContract = {
  fileType: 'setup',
  patterns: ['docs/setup.md', 'docs/installation.md', 'INSTALL.md', 'docs/DEV_SETUP.md'],
  sections: [
    {
      name: 'Prerequisites',
      required: true,
      description: 'System requirements and dependencies',
      hints: ['OS versions', 'Required software', 'Version numbers'],
    },
    {
      name: 'Installation Steps',
      required: true,
      description: 'Step-by-step installation process',
      hints: ['Numbered steps', 'Commands with explanations', 'Verification steps'],
    },
    {
      name: 'Configuration',
      required: true,
      description: 'Initial configuration required',
      hints: ['Environment variables', 'Config files', 'Secrets management'],
    },
    {
      name: 'Verification',
      required: false,
      description: 'How to verify successful installation',
      hints: ['Test commands', 'Expected outputs', 'Health checks'],
    },
    {
      name: 'Troubleshooting',
      required: false,
      description: 'Common installation issues',
      hints: ['Platform-specific issues', 'Error messages with solutions'],
    },
  ],
  qualityRules: {
    minLength: 400,
    requireCodeExamples: true,
    tone: 'technical',
  },
};

/**
 * Contract registry - maps patterns to contracts
 */
export const DOC_CONTRACTS: Record<DocFileType, DocTypeContract> = {
  readme: README_CONTRACT,
  guide: GUIDE_CONTRACT,
  setup: SETUP_CONTRACT,
  changelog: {
    fileType: 'changelog',
    patterns: ['CHANGELOG.md'],
    sections: [
      { name: 'Version Header', required: true, description: 'Version number and date' },
      { name: 'Added', required: false, description: 'New features' },
      { name: 'Changed', required: false, description: 'Changes to existing functionality' },
      { name: 'Deprecated', required: false, description: 'Soon-to-be removed features' },
      { name: 'Removed', required: false, description: 'Removed features' },
      { name: 'Fixed', required: false, description: 'Bug fixes' },
      { name: 'Security', required: false, description: 'Security improvements' },
    ],
    qualityRules: {
      minLength: 100,
      tone: 'formal',
    },
  },
  adr: {
    fileType: 'adr',
    patterns: ['docs/adr/*.md', 'docs/decisions/*.md'],
    sections: [
      { name: 'Title', required: true, description: 'Decision title' },
      { name: 'Status', required: true, description: 'Proposed, Accepted, Deprecated, Superseded' },
      { name: 'Context', required: true, description: 'Background and problem statement' },
      { name: 'Decision', required: true, description: 'The decision made' },
      { name: 'Consequences', required: true, description: 'Impact of this decision' },
    ],
    qualityRules: {
      minLength: 400,
      tone: 'formal',
    },
  },
  api: {
    fileType: 'api',
    patterns: ['docs/api/*.md', 'docs/API.md'],
    sections: [
      { name: 'Endpoint', required: true, description: 'API endpoint path and method' },
      { name: 'Description', required: true, description: 'What this endpoint does' },
      { name: 'Request', required: true, description: 'Request format and parameters' },
      { name: 'Response', required: true, description: 'Response format and examples' },
      { name: 'Authentication', required: false, description: 'Auth requirements' },
      { name: 'Examples', required: false, description: 'curl examples' },
    ],
    qualityRules: {
      minLength: 300,
      requireCodeExamples: true,
      tone: 'technical',
    },
  },
  contributing: {
    fileType: 'contributing',
    patterns: ['CONTRIBUTING.md', 'docs/CONTRIBUTING.md'],
    sections: [
      { name: 'Welcome', required: true, description: 'Welcoming message for contributors' },
      { name: 'Code of Conduct', required: false, description: 'Link or inline code of conduct' },
      { name: 'How to Contribute', required: true, description: 'Contribution workflow' },
      { name: 'Development Setup', required: true, description: 'How to set up dev environment' },
      { name: 'Coding Standards', required: false, description: 'Style guides and conventions' },
      { name: 'Pull Request Process', required: true, description: 'How to submit PRs' },
    ],
    qualityRules: {
      minLength: 500,
      tone: 'friendly',
    },
  },
  other: {
    fileType: 'other',
    patterns: ['**/*.md'],
    sections: [
      { name: 'Content', required: true, description: 'Main documentation content' },
    ],
    qualityRules: {
      minLength: 200,
      tone: 'technical',
    },
  },
};

/**
 * Determine doc file type from path
 */
export function detectDocFileType(path: string): DocFileType {
  const lower = path.toLowerCase();
  
  if (lower.includes('readme')) return 'readme';
  if (lower.includes('changelog')) return 'changelog';
  if (lower.includes('adr') || lower.includes('decisions')) return 'adr';
  if (lower.includes('api')) return 'api';
  if (lower.includes('contributing')) return 'contributing';
  if (lower.includes('setup') || lower.includes('install')) return 'setup';
  if (lower.startsWith('docs/')) return 'guide';
  
  return 'other';
}

/**
 * Get appropriate contract for a file path
 */
export function getContractForPath(path: string): DocTypeContract {
  const fileType = detectDocFileType(path);
  return DOC_CONTRACTS[fileType];
}

/**
 * Multi-file documentation task specification
 */
export interface DocSet {
  /** Primary file (required) */
  primaryFile: {
    path: string;
    contract: DocTypeContract;
    priority: number;
  };
  /** Additional related files (optional) */
  relatedFiles: Array<{
    path: string;
    contract: DocTypeContract;
    priority: number;
  }>;
}

/**
 * Build a contract-compliant content prompt for AI
 */
export function buildContractPrompt(
  contract: DocTypeContract,
  existingContent: string,
  taskDescription: string
): string {
  const requiredSections = contract.sections
    .filter(s => s.required)
    .map(s => `- ${s.name}: ${s.description}`)
    .join('\n');
  
  const optionalSections = contract.sections
    .filter(s => !s.required)
    .map(s => `- ${s.name}: ${s.description}`)
    .join('\n');

  return `You are a technical documentation specialist. Generate high-quality ${contract.fileType} documentation.

**Task**: ${taskDescription}

**Documentation Contract (${contract.fileType})**:
Required sections:
${requiredSections}

Optional sections (include if relevant):
${optionalSections}

**Quality Requirements**:
- Tone: ${contract.qualityRules.tone}
- Minimum length: ${contract.qualityRules.minLength || 200} characters
${contract.qualityRules.requireCodeExamples ? '- Must include code examples' : ''}
${contract.qualityRules.requireLinks ? '- Must include relevant links' : ''}

**Existing Content** (if any):
\`\`\`
${existingContent || '(none - creating new file)'}
\`\`\`

**Instructions**:
1. Analyze the existing content structure
2. Generate or update content following the contract
3. Ensure all required sections are present
4. Use appropriate Markdown formatting
5. Include practical examples where applicable
6. Maintain consistency with existing style if content exists
7. Output ONLY the complete updated Markdown content (no explanations, no meta-commentary)

**Output**:`;
}

