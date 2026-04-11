/**
 * Jira Integration — hooks for pipeline stage transitions.
 * Creates Jira Epics from specs and comments with Proto/Trace results.
 * All functions are safe to call — failures are logged but never thrown.
 */

import type { JiraMCPService } from '../../services/mcp/adapters/JiraMCPService.js';
import type { StructuredSpec } from '../core/contracts/PipelineTypes.js';

/**
 * Create a Jira Epic from a StructuredSpec.
 * Each user story becomes a sub-task linked to the Epic.
 * @returns The epic key (e.g. "PROJ-123") or null on failure.
 */
export async function createJiraEpicFromSpec(
  jira: JiraMCPService,
  projectKey: string,
  spec: StructuredSpec,
): Promise<string | null> {
  try {
    const epic = await jira.createIssue(projectKey, {
      summary: spec.title,
      description: spec.problemStatement,
      issueType: 'Epic',
      labels: ['akis-pipeline'],
    });

    // Create sub-tasks from user stories
    for (const story of spec.userStories) {
      try {
        const child = await jira.createIssue(projectKey, {
          summary: `${story.persona}: ${story.action}`,
          description: `**Benefit:** ${story.benefit}`,
          issueType: 'Task',
          labels: ['akis-pipeline'],
        });
        // Link child to epic
        await jira.linkIssues(child.key, epic.key, 'is child of').catch(() => {
          // Link type may vary — non-fatal
        });
      } catch (storyErr) {
        console.warn(`[Jira] Failed to create sub-task for story "${story.action}":`, storyErr);
      }
    }

    console.log(`[Jira] Created Epic ${epic.key} with ${spec.userStories.length} stories`);
    return epic.key;
  } catch (err) {
    console.warn('[Jira] Failed to create Epic from spec:', err);
    return null;
  }
}

/**
 * Add a comment to the Jira Epic with Proto build results.
 */
export async function commentJiraWithProtoResult(
  jira: JiraMCPService,
  epicKey: string,
  result: { branch: string; repo: string; prUrl?: string; filesCreated: number },
): Promise<void> {
  try {
    const lines = [
      `*AKIS Proto completed*`,
      `- Branch: \`${result.branch}\``,
      `- Repository: ${result.repo}`,
      `- Files created: ${result.filesCreated}`,
    ];
    if (result.prUrl) {
      lines.push(`- Pull Request: ${result.prUrl}`);
    }
    await jira.addComment(epicKey, lines.join('\n'));
    console.log(`[Jira] Commented Proto result on ${epicKey}`);
  } catch (err) {
    console.warn(`[Jira] Failed to comment Proto result on ${epicKey}:`, err);
  }
}

/**
 * Add a comment to the Jira Epic with Trace test results.
 * Optionally transitions the Epic to "Done" if all tests passed.
 */
export async function commentJiraWithTraceResult(
  jira: JiraMCPService,
  epicKey: string,
  result: { totalTests: number; coveragePercentage: number; passed: boolean },
): Promise<void> {
  try {
    const status = result.passed ? 'All tests passed' : 'Some tests failed';
    const lines = [
      `*AKIS Trace completed*`,
      `- Status: ${status}`,
      `- Total tests: ${result.totalTests}`,
      `- Coverage: ${result.coveragePercentage}%`,
    ];
    await jira.addComment(epicKey, lines.join('\n'));
    console.log(`[Jira] Commented Trace result on ${epicKey}`);

    // Optionally transition to Done if all passed
    if (result.passed) {
      try {
        const { transitions } = await jira.getTransitions(epicKey);
        const done = transitions.find(
          (t) => t.name.toLowerCase() === 'done' || t.name.toLowerCase() === 'tamamlandı',
        );
        if (done) {
          await jira.transitionIssue(epicKey, done.id);
          console.log(`[Jira] Transitioned ${epicKey} to Done`);
        }
      } catch (transErr) {
        // Transition ID varies per Jira instance — non-fatal
        console.warn(`[Jira] Failed to transition ${epicKey} to Done:`, transErr);
      }
    }
  } catch (err) {
    console.warn(`[Jira] Failed to comment Trace result on ${epicKey}:`, err);
  }
}
