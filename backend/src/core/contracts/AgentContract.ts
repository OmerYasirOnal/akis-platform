import { z } from 'zod';

/**
 * AgentContract - Input/output schema expectations for agents
 * Uses Zod for runtime validation
 */

export abstract class AgentContract<TInput = unknown, TOutput = unknown> {
  /**
   * Input schema validation
   */
  abstract inputSchema: z.ZodSchema<TInput>;

  /**
   * Output schema validation
   */
  abstract outputSchema: z.ZodSchema<TOutput>;

  /**
   * Validate input against contract
   */
  validateInput(input: unknown): TInput {
    return this.inputSchema.parse(input);
  }

  /**
   * Validate output against contract
   */
  validateOutput(output: unknown): TOutput {
    return this.outputSchema.parse(output);
  }
}

export type ContractAgentType = 'scribe' | 'trace' | 'proto';

type RuntimeContract = {
  readonly inputSchema: z.ZodTypeAny;
  readonly outputSchema: z.ZodTypeAny;
};

const nonEmptyObject = z
  .record(z.unknown())
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Output must contain at least one field',
      });
    }
  });

const scribeInputSchema = z
  .object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    baseBranch: z.string().min(1),
    featureBranch: z.string().optional(),
    targetPath: z.string().optional(),
    taskDescription: z.string().optional(),
    doc: z.string().optional(),
    docPack: z.enum(['readme', 'standard', 'full']).optional(),
    docDepth: z.enum(['lite', 'standard', 'deep']).optional(),
    outputTargets: z.array(z.string()).optional(),
    analyzeLastNCommits: z.number().int().min(1).max(100).optional(),
    maxOutputTokens: z.number().int().min(1000).max(64000).optional(),
    passes: z.number().int().min(1).max(2).optional(),
    skill: z.enum(['DocPackFromRepo', 'ReleaseNotesFromPRs', 'ChecklistFromRunbook']).optional(),
    skillInput: z.unknown().optional(),
    contextQuery: z.string().max(2000).optional(),
    additionalContext: z.string().max(10000).optional(),
    dryRun: z.boolean().optional(),
    userId: z.string().uuid().optional(),
  })
  .passthrough();

const traceInputSchema = z
  .object({
    spec: z.string().min(1),
    owner: z.string().optional(),
    repo: z.string().optional(),
    baseBranch: z.string().optional(),
    branchStrategy: z.enum(['auto', 'manual']).optional(),
    dryRun: z.boolean().optional(),
    automationMode: z.literal('generate_and_run').optional(),
    targetBaseUrl: z.string().url().optional(),
    featureLimit: z.number().int().min(1).max(100).optional(),
    tracePreferences: z
      .object({
        testDepth: z.enum(['smoke', 'standard', 'deep']),
        authScope: z.enum(['public', 'authenticated', 'mixed']),
        browserTarget: z.enum(['chromium', 'cross_browser', 'mobile']),
        strictness: z.enum(['fast', 'balanced', 'strict']),
      })
      .optional(),
    contextQuery: z.string().max(2000).optional(),
    additionalContext: z.string().max(10000).optional(),
    userId: z.string().uuid().optional(),
  })
  .passthrough();

const protoInputSchema = z
  .object({
    requirements: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    stack: z.string().optional(),
    owner: z.string().optional(),
    repo: z.string().optional(),
    baseBranch: z.string().optional(),
    branchStrategy: z.enum(['auto', 'manual']).optional(),
    dryRun: z.boolean().optional(),
    contextQuery: z.string().max(2000).optional(),
    additionalContext: z.string().max(10000).optional(),
    userId: z.string().uuid().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (!data.requirements && !data.goal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either "requirements" or "goal" field must be provided',
        path: ['requirements'],
      });
    }
  });

const scribeOutputSchema = nonEmptyObject;
const traceOutputSchema = nonEmptyObject;
const protoOutputSchema = nonEmptyObject;

const RUNTIME_CONTRACTS: Record<ContractAgentType, RuntimeContract> = {
  scribe: {
    inputSchema: scribeInputSchema,
    outputSchema: scribeOutputSchema,
  },
  trace: {
    inputSchema: traceInputSchema,
    outputSchema: traceOutputSchema,
  },
  proto: {
    inputSchema: protoInputSchema,
    outputSchema: protoOutputSchema,
  },
};

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
}

export function getRuntimeContract(agentType: string): RuntimeContract | null {
  if (agentType === 'scribe' || agentType === 'trace' || agentType === 'proto') {
    return RUNTIME_CONTRACTS[agentType];
  }
  return null;
}

export function validateRuntimeAgentInput(
  agentType: string,
  input: unknown
): { valid: true; value: unknown } | { valid: false; issues: string[] } {
  const contract = getRuntimeContract(agentType);
  if (!contract) {
    return { valid: true, value: input };
  }

  const parsed = contract.inputSchema.safeParse(input);
  if (parsed.success) {
    return { valid: true, value: parsed.data };
  }

  return {
    valid: false,
    issues: formatIssues(parsed.error),
  };
}

export function validateRuntimeAgentOutput(
  agentType: string,
  output: unknown
): { valid: true; value: unknown } | { valid: false; issues: string[] } {
  const contract = getRuntimeContract(agentType);
  if (!contract) {
    return { valid: true, value: output };
  }

  const parsed = contract.outputSchema.safeParse(output);
  if (parsed.success) {
    return { valid: true, value: parsed.data };
  }

  return {
    valid: false,
    issues: formatIssues(parsed.error),
  };
}

/**
 * Deterministic one-shot normalization used by `retry_once` policy.
 * Keeps original payload in `result` and annotates normalization metadata.
 */
export function normalizeContractOutputForRetry(output: unknown): Record<string, unknown> {
  if (output && typeof output === 'object' && !Array.isArray(output)) {
    const asRecord = output as Record<string, unknown>;
    if (Object.keys(asRecord).length > 0) {
      return asRecord;
    }
  }

  return {
    result: output ?? null,
    _contractRetry: {
      strategy: 'normalize_output',
      originalType: Array.isArray(output) ? 'array' : output === null ? 'null' : typeof output,
    },
  };
}
