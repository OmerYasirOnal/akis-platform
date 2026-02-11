/**
 * Prompt Constants for AKIS Agent Playbooks (S0.5.1-AGT-2)
 *
 * All system prompts and configuration constants are centralised here
 * for version control, reproducibility, and determinism.
 *
 * IMPORTANT: Changes to these prompts directly affect agent output.
 * Always test changes with the golden path validation tests.
 */

// =============================================================================
// Temperature presets — Deterministic mode (pilot-safe)
// =============================================================================

/**
 * Temperature settings for deterministic (pilot) mode.
 * Lower temperatures = more predictable, reproducible output.
 */
export const DETERMINISTIC_TEMPERATURES = {
  plan: 0.2,
  generate: 0.3,
  reflect: 0.1,
  validate: 0.1,
  repair: 0,
} as const;

/**
 * Temperature settings for creative (development) mode.
 * Higher temperatures = more varied, creative output.
 */
export const CREATIVE_TEMPERATURES = {
  plan: 0.5,
  generate: 0.7,
  reflect: 0.3,
  validate: 0.2,
  repair: 0,
} as const;

/**
 * Temperature settings for balanced mode.
 * Middle ground between deterministic and creative.
 */
export const BALANCED_TEMPERATURES = {
  plan: 0.35,
  generate: 0.5,
  reflect: 0.2,
  validate: 0.15,
  repair: 0,
} as const;

/**
 * Default seed for deterministic reproducibility.
 * OpenAI/OpenRouter support `seed` for cache-friendly deterministic outputs.
 * null = no seed (non-deterministic).
 */
export const DETERMINISTIC_SEED = 42;

// =============================================================================
// System prompts — Planning
// =============================================================================

export const PLAN_SYSTEM_PROMPT = `You are an AI planning assistant for the AKIS platform.
Your task is to create execution plans for autonomous agents.

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:
{
  "steps": [
    { "id": "step-1", "title": "Step title", "detail": "Optional detailed description" }
  ],
  "rationale": "Brief explanation of why this plan achieves the goal"
}

Requirements:
- steps array MUST have at least 1 step
- Each step MUST have "id" and "title" fields
- "detail" is optional but recommended
- "rationale" explains the plan approach
- NO text before or after the JSON
- NO markdown code blocks` as const;

export function buildPlanUserPrompt(agent: string, goal: string, context?: unknown): string {
  return `Create an execution plan for the ${agent} agent.
Goal: ${goal}
${context ? `Context: ${JSON.stringify(context)}` : ''}

Respond with ONLY the JSON plan object.`;
}

// =============================================================================
// System prompts — Generation
// =============================================================================

export const GENERATE_SYSTEM_PROMPT = `You are an AI code and content generation assistant for the AKIS platform.
Generate high-quality output based on the given task.
Be concise, accurate, and follow best practices.` as const;

export function buildGenerateUserPrompt(
  task: string,
  context?: unknown,
  previousSteps?: string[]
): string {
  return `Task: ${task}
${context ? `Context: ${JSON.stringify(context)}` : ''}
${previousSteps?.length ? `Previous steps completed: ${previousSteps.join(', ')}` : ''}

Generate the requested content.`;
}

// =============================================================================
// System prompts — Reflection
// =============================================================================

export const REFLECT_SYSTEM_PROMPT = `You are an AI code review and quality assessment assistant for the AKIS platform.
Analyze the given artifact and provide constructive feedback.

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:
{
  "issues": ["List of identified issues or problems"],
  "recommendations": ["List of specific recommendations for improvement"],
  "severity": "low" | "medium" | "high"
}

Requirements:
- "issues" MUST be an array of strings (can be empty if no issues)
- "recommendations" MUST be an array of strings
- "severity" MUST be exactly one of: "low", "medium", or "high"
- NO text before or after the JSON
- NO markdown code blocks` as const;

// =============================================================================
// System prompts — Validation
// =============================================================================

export const VALIDATE_SYSTEM_PROMPT = `You are an expert AI validator for the AKIS platform.
Your job is to perform final quality validation before marking a job as complete.
Be thorough and critical. Only pass artifacts that meet high quality standards.

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:
{
  "passed": true | false,
  "confidence": 0.0 to 1.0,
  "issues": ["List of any issues found"],
  "suggestions": ["List of improvement suggestions"],
  "summary": "Brief summary of validation result"
}

Requirements:
- "passed" MUST be a boolean (true or false)
- "confidence" MUST be a number between 0.0 and 1.0
- "issues" MUST be an array of strings
- "suggestions" MUST be an array of strings  
- "summary" MUST be a non-empty string
- NO text before or after the JSON
- NO markdown code blocks` as const;

// =============================================================================
// JSON Repair prompt
// =============================================================================

export function buildRepairPrompt(schemaDefinition: string, rawResponse: string): string {
  return `The following text was supposed to be valid JSON but failed to parse. 
Return ONLY the corrected JSON with no explanation or additional text.
The JSON should match this structure: ${schemaDefinition}

Original response:
${rawResponse.substring(0, 2000)}

Return ONLY valid JSON:`;
}
