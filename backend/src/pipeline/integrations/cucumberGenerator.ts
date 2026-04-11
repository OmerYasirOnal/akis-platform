import type { StructuredSpec } from '../core/contracts/PipelineTypes.js';

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
