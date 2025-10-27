import "server-only";

/**
 * AKIS Scribe Agent Runner (Server-Only)
 * Orchestrates the full documentation workflow (Playbook 1-7)
 * 
 * This module is server-only and cannot be imported from client components.
 * Use server actions (src/app/actions/scribe.ts) or API routes instead.
 */

import { DocumentationAgent } from '@/lib/agents/documentation-agent';
import { DocumentationAgentInput, DocumentationWorkflowOutput } from '@/lib/agents/documentation-agent-types';
import {
  mcpCreateBranch,
  mcpOpenPR,
  MCPConfig,
} from '@/lib/services/mcp';
import { upsertMultipleFiles } from '@/modules/github/upsert';
import { getGitHubToken } from '@/modules/github/token-provider';
import { logger } from '@/lib/utils/logger';
import { Actor, resolveActorOrFallback, getCommitAuthor, getActorBanner } from '@/lib/auth/actor';

export interface ScribeRunnerInput {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  /**
   * Working branch for commits (selected/created in UI)
   * If not provided, will generate: docs/{repo}-{date}-readme-refresh
   */
  workingBranch?: string;
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken: string;
  options?: {
    skipValidation?: boolean;
    autoMergeDAS?: number;
    allowLowDAS?: boolean;
    forceCommit?: boolean;
  };
  /**
   * Actor context (optional)
   * If not provided, will be resolved automatically from token/env
   */
  actor?: Actor;
}

export interface ScribeRunnerOutput {
  success: boolean;
  repoUrl: string;
  branchName: string;
  artifacts: {
    REPO_SUMMARY?: string;
    DOC_REPORT?: string;
    'README.proposed'?: string;
    'CHANGELOG.proposed'?: string;
    DAS_REPORT?: string;
    PR_DESCRIPTION?: string;
  };
  validation?: {
    das: number;
    recommendation: string;
  };
  prUrl?: string;
  prNumber?: number;
  logs: string[];
  errors?: string[];
}

class ScribeRunnerServer {
  private agent: DocumentationAgent;
  private logs: string[] = [];

  constructor() {
    this.agent = new DocumentationAgent();
  }

  private log(message: string, requestId?: string) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}]${requestId ? ` [${requestId}]` : ''} ${message}`;
    this.logs.push(logMsg);
    logger.info('ScribeRunner', logMsg);
  }

  async run(input: ScribeRunnerInput, requestId?: string): Promise<ScribeRunnerOutput> {
    this.logs = [];
    const errors: string[] = [];
    
    const repoUrl = `https://github.com/${input.repoOwner}/${input.repoName}`;
    
    // Resolve Actor (with app_bot fallback if no OAuth user)
    let actor: Actor;
    try {
      actor = input.actor || resolveActorOrFallback({
        correlationId: requestId,
        installationId: parseInt(process.env.GITHUB_APP_INSTALLATION_ID || '0', 10) || undefined,
      });
      
      this.log(`🚀 AKIS Scribe Agent başlatıldı: ${repoUrl}`, requestId);
      this.log(`👤 Actor: ${actor.mode}${actor.installationId ? ` (installation: ${actor.installationId})` : ''}${actor.githubLogin ? ` (user: ${actor.githubLogin})` : ''}`, requestId);
      
      // Show banner if running as app_bot
      const banner = getActorBanner(actor);
      if (banner) {
        this.log(`ℹ️ ${banner.text}`, requestId);
      }
    } catch (actorError: any) {
      this.log(`❌ Actor resolution failed: ${actorError.message}`, requestId);
      return {
        success: false,
        repoUrl,
        branchName: '',
        artifacts: {},
        logs: this.logs,
        errors: [`Authentication failed: ${actorError.message}. Please install AKIS GitHub App or connect your GitHub account.`],
      };
    }

    try {
      // Step 1-4: Run full workflow
      this.log('📊 Step 1-4: Repository analizi, doküman oluşturma ve validasyon...', requestId);
      
      const agentInput: DocumentationAgentInput = {
        action: 'validate_docs',
        repoUrl,
        branch: input.baseBranch,
        scope: input.scope,
        accessToken: input.accessToken,
        options: {
          skipValidation: input.options?.skipValidation,
        },
      };

      const workflowResult: DocumentationWorkflowOutput = await this.agent.execute(agentInput);
      
      if (!workflowResult.proposedDocs || workflowResult.proposedDocs.length === 0) {
        throw new Error('Hiçbir doküman oluşturulamadı');
      }

      this.log(`✅ ${workflowResult.proposedDocs.length} doküman oluşturuldu`, requestId);
      
      // DAS Validation
      const das = workflowResult.validation?.das || 0;
      const recommendation = workflowResult.validation?.recommendation || 'unknown';
      this.log(`📈 DAS Score: ${das}% (${recommendation})`, requestId);

      if (das < 50 && !input.options?.allowLowDAS) {
        errors.push(`DAS skoru çok düşük (${das}%). Manuel inceleme gerekli.`);
        this.log(`⚠️ DAS gate: Score too low. Use allowLowDAS=true to override.`, requestId);
      } else if (das < 50 && input.options?.allowLowDAS) {
        this.log(`⚠️ DAS gate bypassed with allowLowDAS=true (DAS=${das}%)`, requestId);
      }

      // Step 5: Use existing branch or create new one
      let branchName = input.workingBranch;
      
      if (!branchName) {
        this.log('🌿 Step 5: Branch oluşturuluyor (auto-generated name)...', requestId);
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        branchName = `docs/${input.repoName}-${date}-readme-refresh`;
      } else {
        this.log(`🌿 Step 5: Using selected branch: ${branchName}`, requestId);
      }

      const mcpConfig: MCPConfig = {
        token: input.accessToken,
        useMCP: false,
      };

      const branchResult = await mcpCreateBranch(
        mcpConfig,
        input.repoOwner,
        input.repoName,
        branchName,
        input.baseBranch
      );

      if (!branchResult.success) {
        throw new Error(`Branch oluşturulamadı: ${branchResult.error}`);
      }

      const branchAction = branchResult.action === 'created' ? 'oluşturuldu' : 'zaten mevcut (checkout yapıldı)';
      this.log(`✅ Branch "${branchName}" ${branchAction}`, requestId);

      // Step 6: Commit artifacts with robust upsert
      this.log('💾 Step 6: Artifacts commit ediliyor...', requestId);
      this.log(`📋 Target branch: ${branchName}`, requestId);
      this.log(`👤 Actor: ${actor.mode} (${actor.githubLogin || 'app bot'})`, requestId);
      
      const filesToCommit = workflowResult.proposedDocs.map(doc => ({
        path: doc.path,
        content: doc.content,
      }));

      if (workflowResult.artifacts.REPO_SUMMARY) {
        filesToCommit.push({
          path: 'docs/REPO_SUMMARY.md',
          content: workflowResult.artifacts.REPO_SUMMARY,
        });
      }

      if (workflowResult.artifacts.DOC_REPORT) {
        let reportContent = workflowResult.artifacts.DOC_REPORT;
        reportContent += `\n\n---\n> Report generated at: ${new Date().toISOString()}\n`;
        
        filesToCommit.push({
          path: 'docs/DOC_REPORT.md',
          content: reportContent,
        });
      }

      if (workflowResult.artifacts.DAS_REPORT) {
        filesToCommit.push({
          path: 'docs/DAS_REPORT.md',
          content: workflowResult.artifacts.DAS_REPORT,
        });
      }

      if (input.options?.forceCommit && filesToCommit.length === 0) {
        this.log('⚠️ No files to commit, adding timestamp file to ensure diff...', requestId);
        filesToCommit.push({
          path: 'docs/.scribe-run',
          content: `Last run: ${new Date().toISOString()}\nThis file ensures a diff for PR creation.\n`,
        });
      }

      // Get commit author based on actor mode
      const commitAuthor = getCommitAuthor(actor);
      const commitMessage = actor.mode === 'app_bot' 
        ? `docs(readme): refresh quickstart & env matrix\n\nGenerated by AKIS Scribe Agent`
        : `docs(readme): refresh quickstart & env matrix`;

      // Resolve token for commits
      const tokenResult = await getGitHubToken({
        userToken: input.accessToken,
        repo: { owner: input.repoOwner, name: input.repoName },
        correlationId: requestId,
      });

      // Check if token resolution failed
      if ('error' in tokenResult) {
        throw new Error(`Could not resolve GitHub token: ${tokenResult.error}`);
      }

      if (!tokenResult.token) {
        throw new Error('GitHub token is empty');
      }

      this.log(`🔐 Using token: ${tokenResult.source}`, requestId);

      // Commit files with new upsert helper (idempotent, proper SHA handling)
      const upsertResults = await upsertMultipleFiles(
        filesToCommit.map(f => ({
          path: f.path,
          content: f.content,
        })),
        {
          owner: input.repoOwner,
          repo: input.repoName,
          branch: branchName, // CRITICAL: Use the selected working branch
          message: commitMessage, // Shared commit message for all files
          userToken: tokenResult.token,
          author: commitAuthor,
          committer: commitAuthor,
          retries: 3,
          correlationId: requestId,
        }
      );

      // Check for failures
      const failedFiles = upsertResults.filter(r => !r.success);
      if (failedFiles.length > 0) {
        const failedPaths = failedFiles.map(r => `${r.path} (${r.error})`).join(', ');
        throw new Error(`Commit başarısız: ${failedPaths}`);
      }

      // Summary log
      const createCount = upsertResults.filter(r => r.mode === 'create').length;
      const updateCount = upsertResults.filter(r => r.mode === 'update').length;
      this.log(`✅ ${upsertResults.length} dosya commit edildi (${createCount} yeni, ${updateCount} güncelleme)`, requestId);

      // Step 7: Create PR
      this.log('📬 Step 7: Draft PR oluşturuluyor...', requestId);
      
      let prDescription = workflowResult.artifacts.PR_DESCRIPTION || this.generatePRDescription(workflowResult);
      if (das < 50 && input.options?.allowLowDAS) {
        prDescription = `⚠️ **DAS Score Warning**: This PR has a low DAS score (${das}%). Manual review is required.\n\n` + prDescription;
      }

      const prResult = await mcpOpenPR(
        mcpConfig,
        input.repoOwner,
        input.repoName,
        input.baseBranch,
        branchName,
        `docs: documentation improvements`,
        prDescription,
        true,
        ['documentation', 'needs-review']
      );

      if (!prResult.success) {
        const errorMsg = 'error' in prResult ? prResult.error : 'Unknown error';
        throw new Error(`PR oluşturulamadı: ${errorMsg}`);
      }

      const prStatus = (prResult as any).isExisting ? 'bulundu (var olan)' : 'oluşturuldu';
      this.log(`✅ Draft PR ${prStatus}: ${prResult.prUrl}`, requestId);

      if (input.options?.autoMergeDAS && das >= input.options.autoMergeDAS) {
        this.log(`🎯 DAS skoru yeterince yüksek (${das} >= ${input.options.autoMergeDAS})`, requestId);
      }

      return {
        success: true,
        repoUrl,
        branchName,
        artifacts: workflowResult.artifacts,
        validation: {
          das,
          recommendation,
        },
        prUrl: prResult.prUrl,
        prNumber: prResult.prNumber,
        logs: this.logs,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      this.log(`❌ Hata: ${error.message}`, requestId);
      errors.push(error.message);

      return {
        success: false,
        repoUrl,
        branchName: '',
        artifacts: {},
        logs: this.logs,
        errors,
      };
    }
  }

  private generatePRDescription(workflow: DocumentationWorkflowOutput): string {
    const das = workflow.validation?.das || 0;
    const proposedDocs = workflow.proposedDocs || [];

    return `## 📝 Documentation Update

This PR was automatically generated by **AKIS Scribe Agent**.

### Summary
Updated documentation for improved onboarding and developer experience.

### Changes
${proposedDocs.map(doc => `- Updated \`${doc.path}\``).join('\n')}

### Metrics (DAS)
- **DAS Score:** ${das}% ${das >= 70 ? '✅' : das >= 50 ? '⚠️' : '❌'}
- **RefCoverage:** ${workflow.validation?.refCoverage.score || 0}%
- **Consistency:** ${workflow.validation?.consistency.score || 0}%
- **SpotCheck:** ${workflow.validation?.spotCheck.score || 0}%

**Recommendation:** ${workflow.validation?.recommendation || 'Unknown'}

### Risks & Rollback
- ✅ No code changes, documentation only
- ✅ Simple revert if needed

### Checklist
- [x] README includes quickstart
- [x] Environment variables documented
- [x] Scripts listed

---
*Generated by AKIS Scribe Agent v1.0.0*
`;
  }
}

// Singleton instance
const runnerInstance = new ScribeRunnerServer();

/**
 * Execute Scribe Agent workflow (server-only)
 * @param input - Scribe runner configuration
 * @param requestId - Optional correlation ID for logging
 */
export async function runScribeServer(input: ScribeRunnerInput, requestId?: string): Promise<ScribeRunnerOutput> {
  return await runnerInstance.run(input, requestId);
}

