import type { StructuredSpec } from '../core/contracts/PipelineTypes.js';
import type { GitHubServiceLike } from '../core/pipeline-factory.js';

export interface GherkinFeature {
  featureName: string;
  filePath: string;       // e.g., "features/user-login.feature"
  content: string;        // Full Gherkin text
  scenarioCount: number;
  mappedCriteria: string[];
}

export interface StepDefinition {
  filePath: string;       // e.g., "features/steps/user-login.steps.ts"
  content: string;
}

export function generateGherkinFromSpec(spec: StructuredSpec): {
  features: GherkinFeature[];
  stepDefinitions: StepDefinition[];
} {
  const features: GherkinFeature[] = [];
  const stepDefinitions: StepDefinition[] = [];

  // Map each acceptance criterion to a Gherkin scenario (criteria have Given/When/Then)
  const criteriaById = new Map<string, { id: string; given: string; when: string; then: string }>();
  for (const ac of spec.acceptanceCriteria ?? []) {
    criteriaById.set(ac.id, ac);
  }

  // Group criteria by user story context
  for (const story of spec.userStories ?? []) {
    const featureName = story.action || story.benefit?.slice(0, 50) || 'Feature';
    const safeName = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const filePath = `features/${safeName}.feature`;

    let content = `Feature: ${featureName}\n`;
    content += `  As a ${story.persona || 'user'}\n`;
    content += `  I want to ${story.action || 'perform an action'}\n`;
    content += `  So that ${story.benefit || 'I achieve a goal'}\n\n`;

    let scenarioCount = 0;
    const mappedCriteria: string[] = [];

    // Map each acceptance criterion to a scenario with proper Given/When/Then
    for (const ac of spec.acceptanceCriteria ?? []) {
      scenarioCount++;
      mappedCriteria.push(ac.id);
      content += `  Scenario: ${ac.id}\n`;
      content += `    Given ${ac.given}\n`;
      content += `    When ${ac.when}\n`;
      content += `    Then ${ac.then}\n\n`;
    }

    if (scenarioCount > 0) {
      features.push({ featureName, filePath, content: content.trim(), scenarioCount, mappedCriteria });

      const stepContent = generateStepDefinitionStub(safeName, spec.acceptanceCriteria ?? []);
      stepDefinitions.push({
        filePath: `features/steps/${safeName}.steps.ts`,
        content: stepContent,
      });
    }

    // Only map criteria once (to the first story)
    break;
  }

  // If no user stories exist but we have acceptance criteria, create a general feature
  if (features.length === 0 && (spec.acceptanceCriteria?.length ?? 0) > 0) {
    let content = `Feature: ${spec.title || 'General Requirements'}\n`;
    content += `  ${spec.problemStatement || 'Project requirements'}\n\n`;

    const mappedCriteria: string[] = [];
    for (const ac of spec.acceptanceCriteria) {
      mappedCriteria.push(ac.id);
      content += `  Scenario: ${ac.id}\n`;
      content += `    Given ${ac.given}\n`;
      content += `    When ${ac.when}\n`;
      content += `    Then ${ac.then}\n\n`;
    }

    features.push({
      featureName: spec.title || 'General Requirements',
      filePath: 'features/general-requirements.feature',
      content: content.trim(),
      scenarioCount: spec.acceptanceCriteria.length,
      mappedCriteria,
    });

    const stepContent = generateStepDefinitionStub('general-requirements', spec.acceptanceCriteria);
    stepDefinitions.push({
      filePath: 'features/steps/general-requirements.steps.ts',
      content: stepContent,
    });
  }

  return { features, stepDefinitions };
}

/**
 * Push generated Gherkin feature files (and step stubs) to a GitHub branch.
 * Uses `pushFiles` for a single batched commit when available, otherwise
 * falls back to per-file `commitFile` calls.
 *
 * @returns Number of files pushed (features + step definitions).
 */
export async function pushGherkinToGitHub(
  github: GitHubServiceLike,
  owner: string,
  repo: string,
  branch: string,
  features: GherkinFeature[],
): Promise<{ pushedFiles: number }> {
  const { stepDefinitions } = generateStepDefinitionStubsForFeatures(features);

  const files: Array<{ path: string; content: string }> = [
    ...features.map((f) => ({ path: f.filePath, content: f.content })),
    ...stepDefinitions.map((s) => ({ path: s.filePath, content: s.content })),
  ];

  if (files.length === 0) {
    return { pushedFiles: 0 };
  }

  if (github.pushFiles) {
    await github.pushFiles(owner, repo, branch, files, 'chore: add Gherkin BDD feature files [akis-pipeline]');
  } else {
    for (const file of files) {
      await github.commitFile(
        owner, repo, branch, file.path, file.content,
        `chore: add ${file.path} [akis-pipeline]`,
      );
    }
  }

  return { pushedFiles: files.length };
}

/** Re-derive step definition stubs from already-generated features (avoids requiring the spec). */
function generateStepDefinitionStubsForFeatures(
  features: GherkinFeature[],
): { stepDefinitions: StepDefinition[] } {
  const stepDefinitions: StepDefinition[] = [];

  for (const feature of features) {
    // Parse Given/When/Then lines from the feature content
    const criteria: Array<{ id: string; given: string; when: string; then: string }> = [];
    const lines = feature.content.split('\n');
    let current: { id: string; given: string; when: string; then: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const scenarioMatch = trimmed.match(/^Scenario:\s*(.+)/);
      if (scenarioMatch) {
        if (current) criteria.push(current);
        current = { id: scenarioMatch[1], given: '', when: '', then: '' };
        continue;
      }
      if (!current) continue;
      const givenMatch = trimmed.match(/^Given\s+(.+)/);
      if (givenMatch) { current.given = givenMatch[1]; continue; }
      const whenMatch = trimmed.match(/^When\s+(.+)/);
      if (whenMatch) { current.when = whenMatch[1]; continue; }
      const thenMatch = trimmed.match(/^Then\s+(.+)/);
      if (thenMatch) { current.then = thenMatch[1]; continue; }
    }
    if (current) criteria.push(current);

    if (criteria.length > 0) {
      const safeName = feature.featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      stepDefinitions.push({
        filePath: `features/steps/${safeName}.steps.ts`,
        content: generateStepDefinitionStub(safeName, criteria),
      });
    }
  }

  return { stepDefinitions };
}

function generateStepDefinitionStub(
  _name: string,
  criteria: Array<{ id: string; given: string; when: string; then: string }>,
): string {
  const givenSteps = new Set<string>();
  const whenSteps = new Set<string>();
  const thenSteps = new Set<string>();

  for (const ac of criteria) {
    givenSteps.add(ac.given);
    whenSteps.add(ac.when);
    thenSteps.add(ac.then);
  }

  const lines: string[] = [
    `import { Given, When, Then } from '@cucumber/cucumber';`,
    '',
  ];

  for (const step of givenSteps) {
    const escaped = step.replace(/'/g, "\\'");
    lines.push(`Given('${escaped}', async function () {`);
    lines.push(`  // TODO: Setup initial state`);
    lines.push(`});`);
    lines.push('');
  }

  for (const step of whenSteps) {
    const escaped = step.replace(/'/g, "\\'");
    lines.push(`When('${escaped}', async function () {`);
    lines.push(`  // TODO: Perform user action`);
    lines.push(`});`);
    lines.push('');
  }

  for (const step of thenSteps) {
    const escaped = step.replace(/'/g, "\\'");
    lines.push(`Then('${escaped}', async function () {`);
    lines.push(`  // TODO: Assert criterion`);
    lines.push(`});`);
    lines.push('');
  }

  return lines.join('\n');
}
