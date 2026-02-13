import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export interface WorkspaceContext {
  activeFile?: {
    path: string;
    language: string;
    lineCount: number;
    selection?: { startLine: number; endLine: number; text: string };
  };
  git?: {
    branch: string;
    status: string[];
    recentCommits: string[];
  };
  project?: {
    name: string;
    rootPath: string;
    type: string;   // 'node' | 'python' | 'go' | 'unknown'
    mainFiles: string[];
  };
  diagnostics?: {
    errors: number;
    warnings: number;
    topErrors: string[];
  };
}

export class WorkspaceContextProvider {
  async gatherContext(): Promise<WorkspaceContext> {
    const ctx: WorkspaceContext = {};

    // Active file context
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const doc = editor.document;
      const selection = editor.selection;

      ctx.activeFile = {
        path: vscode.workspace.asRelativePath(doc.uri),
        language: doc.languageId,
        lineCount: doc.lineCount,
      };

      if (!selection.isEmpty) {
        ctx.activeFile.selection = {
          startLine: selection.start.line + 1,
          endLine: selection.end.line + 1,
          text: doc.getText(selection).substring(0, 1000),
        };
      }
    }

    // Git context
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (rootPath) {
      ctx.git = await this.getGitContext(rootPath);
      ctx.project = await this.getProjectContext(rootPath);
    }

    // Diagnostics context
    ctx.diagnostics = this.getDiagnosticsContext();

    return ctx;
  }

  private async getGitContext(rootPath: string): Promise<WorkspaceContext['git']> {
    try {
      const branch = this.exec('git rev-parse --abbrev-ref HEAD', rootPath).trim();
      const statusRaw = this.exec('git status --porcelain', rootPath);
      const status = statusRaw.split('\n').filter(l => l.trim()).slice(0, 20);
      const logRaw = this.exec('git log --oneline -5', rootPath);
      const recentCommits = logRaw.split('\n').filter(l => l.trim());

      return { branch, status, recentCommits };
    } catch {
      return undefined;
    }
  }

  private async getProjectContext(rootPath: string): Promise<WorkspaceContext['project']> {
    const name = path.basename(rootPath);
    let type = 'unknown';
    const mainFiles: string[] = [];

    try {
      const files = await vscode.workspace.findFiles(
        '{package.json,pyproject.toml,go.mod,Cargo.toml,pom.xml}',
        '**/node_modules/**',
        5,
      );

      for (const f of files) {
        const base = path.basename(f.fsPath);
        mainFiles.push(vscode.workspace.asRelativePath(f));

        if (base === 'package.json') { type = 'node'; }
        else if (base === 'pyproject.toml' || base === 'setup.py') { type = 'python'; }
        else if (base === 'go.mod') { type = 'go'; }
        else if (base === 'Cargo.toml') { type = 'rust'; }
        else if (base === 'pom.xml') { type = 'java'; }
      }
    } catch {
      // ignore
    }

    return { name, rootPath, type, mainFiles };
  }

  private getDiagnosticsContext(): WorkspaceContext['diagnostics'] {
    const allDiags = vscode.languages.getDiagnostics();
    let errors = 0;
    let warnings = 0;
    const topErrors: string[] = [];

    for (const [uri, diags] of allDiags) {
      for (const d of diags) {
        if (d.severity === vscode.DiagnosticSeverity.Error) {
          errors++;
          if (topErrors.length < 5) {
            topErrors.push(
              `${vscode.workspace.asRelativePath(uri)}:${d.range.start.line + 1} — ${d.message.substring(0, 100)}`,
            );
          }
        } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
          warnings++;
        }
      }
    }

    return { errors, warnings, topErrors };
  }

  private exec(cmd: string, cwd: string): string {
    try {
      return cp.execSync(cmd, {
        cwd,
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      return '';
    }
  }
}
