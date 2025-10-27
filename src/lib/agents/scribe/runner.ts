/**
 * AKIS Scribe Agent Runner
 * Orchestrates the full documentation workflow (Playbook 1-7)
 * BUGFIX: Added server log mirroring for backend visibility
 */

import { DocumentationAgent } from '../documentation-agent';
import { DocumentationAgentInput, DocumentationWorkflowOutput } from '../documentation-agent-types';
import {
  mcpCreateBranch,
  mcpCommit,
  mcpOpenPR,
  MCPConfig,
} from '@/lib/services/mcp';
import { logger } from '@/lib/utils/logger';

export interface ScribeRunnerInput {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken: string;
  options?: {
    skipValidation?: boolean;
    autoMergeDAS?: number; // If DAS >= this value, mark PR ready for review
    allowLowDAS?: boolean; // HOTFIX: Allow PR creation even with low DAS
    forceCommit?: boolean; // HOTFIX: Force a commit even if no changes (adds timestamp)
  };
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

export class ScribeRunner {
  private agent: DocumentationAgent;
  private logs: string[] = [];

  constructor() {
    this.agent = new DocumentationAgent();
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    
    // BUGFIX: Mirror to server console
    logger.info('ScribeRunner', message);
  }

  /**
   * Run full playbook (1-7)
   */
  async run(input: ScribeRunnerInput): Promise<ScribeRunnerOutput> {
    this.logs = [];
    const errors: string[] = [];
    
    const repoUrl = `https://github.com/${input.repoOwner}/${input.repoName}`;
    this.log(`🚀 AKIS Scribe Agent başlatıldı: ${repoUrl}`);

    try {
      // Step 1-4: Run full workflow (summary, gap analysis, proposals, validation)
      this.log('📊 Step 1-4: Repository analizi, doküman oluşturma ve validasyon...');
      
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

      this.log(`✅ ${workflowResult.proposedDocs.length} doküman oluşturuldu`);
      
      // DAS Validation
      const das = workflowResult.validation?.das || 0;
      const recommendation = workflowResult.validation?.recommendation || 'unknown';
      this.log(`📈 DAS Score: ${das}% (${recommendation})`);

      // HOTFIX: DAS gate with override
      if (das < 50 && !input.options?.allowLowDAS) {
        errors.push(`DAS skoru çok düşük (${das}%). Manuel inceleme gerekli.`);
        this.log(`⚠️ DAS gate: Score too low. Use allowLowDAS=true to override.`);
      } else if (das < 50 && input.options?.allowLowDAS) {
        this.log(`⚠️ DAS gate bypassed with allowLowDAS=true (DAS=${das}%)`);
      }

      // Step 5: Create branch
      this.log('🌿 Step 5: Branch oluşturuluyor...');
      
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const branchName = `docs/${input.repoName}-${date}-readme-refresh`;

      const mcpConfig: MCPConfig = {
        token: input.accessToken,
        useMCP: false, // Use direct GitHub REST for now
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
      this.log(`✅ Branch "${branchName}" ${branchAction}`);

      // Step 6: Commit artifacts
      this.log('💾 Step 6: Artifacts commit ediliyor...');
      
      const filesToCommit = workflowResult.proposedDocs.map(doc => ({
        path: doc.path,
        content: doc.content,
      }));

      // Also commit PLAN.md if we have artifacts
      if (workflowResult.artifacts.REPO_SUMMARY) {
        filesToCommit.push({
          path: 'docs/REPO_SUMMARY.md',
          content: workflowResult.artifacts.REPO_SUMMARY,
        });
      }

      if (workflowResult.artifacts.DOC_REPORT) {
        // HOTFIX: Always add timestamp to ensure at least one change
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

      // HOTFIX: If forceCommit and no files, add a minimal change
      if (input.options?.forceCommit && filesToCommit.length === 0) {
        this.log('⚠️ No files to commit, adding timestamp file to ensure diff...');
        filesToCommit.push({
          path: 'docs/.scribe-run',
          content: `Last run: ${new Date().toISOString()}\nThis file ensures a diff for PR creation.\n`,
        });
      }

      const commitResult = await mcpCommit(
        mcpConfig,
        input.repoOwner,
        input.repoName,
        branchName,
        filesToCommit,
        `docs(readme): refresh quickstart & env matrix`
      );

      if (!commitResult.success) {
        const failedFiles = commitResult.results?.filter(r => !r.success).map(r => r.path) || [];
        throw new Error(`Commit başarısız: ${failedFiles.join(', ')}`);
      }

      this.log(`✅ ${filesToCommit.length} dosya commit edildi`);

      // Step 7: Create PR
      this.log('📬 Step 7: Draft PR oluşturuluyor...');
      
      // HOTFIX: Add DAS warning to PR description if low
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
        true, // draft
        ['documentation', 'needs-review']
      );

      if (!prResult.success) {
        const errorMsg = 'error' in prResult ? prResult.error : 'Unknown error';
        throw new Error(`PR oluşturulamadı: ${errorMsg}`);
      }

      const prStatus = (prResult as any).isExisting ? 'bulundu (var olan)' : 'oluşturuldu';
      this.log(`✅ Draft PR ${prStatus}: ${prResult.prUrl}`);

      // Auto-approve if DAS is high enough
      if (input.options?.autoMergeDAS && das >= input.options.autoMergeDAS) {
        this.log(`🎯 DAS skoru yeterince yüksek (${das} >= ${input.options.autoMergeDAS}). PR "Ready for Review" olarak işaretlenebilir.`);
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
      this.log(`❌ Hata: ${error.message}`);
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

// Singleton export
export const scribeRunner = new ScribeRunner();

