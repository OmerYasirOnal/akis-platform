import * as vscode from 'vscode';

export interface DiagnosticEvent {
  type: 'error_count_change' | 'new_error' | 'errors_resolved';
  errorCount: number;
  warningCount: number;
  file?: string;
  message?: string;
}

type DiagnosticListener = (event: DiagnosticEvent) => void;

export class DiagnosticsWatcher implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private listeners: DiagnosticListener[] = [];
  private lastErrorCount = 0;

  constructor() {
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics((e) => {
        this.onDiagnosticsChange(e);
      }),
    );
  }

  onDiagnosticEvent(listener: DiagnosticListener): vscode.Disposable {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const idx = this.listeners.indexOf(listener);
        if (idx >= 0) { this.listeners.splice(idx, 1); }
      },
    };
  }

  private onDiagnosticsChange(e: vscode.DiagnosticChangeEvent): void {
    let totalErrors = 0;
    let totalWarnings = 0;
    let newErrorFile: string | undefined;
    let newErrorMessage: string | undefined;

    const allDiags = vscode.languages.getDiagnostics();

    for (const [uri, diags] of allDiags) {
      for (const d of diags) {
        if (d.severity === vscode.DiagnosticSeverity.Error) {
          totalErrors++;
          if (!newErrorFile && e.uris.some(u => u.toString() === uri.toString())) {
            newErrorFile = vscode.workspace.asRelativePath(uri);
            newErrorMessage = d.message.substring(0, 200);
          }
        } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
          totalWarnings++;
        }
      }
    }

    const event: DiagnosticEvent = {
      type: totalErrors > this.lastErrorCount
        ? 'new_error'
        : totalErrors < this.lastErrorCount
          ? 'errors_resolved'
          : 'error_count_change',
      errorCount: totalErrors,
      warningCount: totalWarnings,
      file: newErrorFile,
      message: newErrorMessage,
    };

    this.lastErrorCount = totalErrors;

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    this.listeners = [];
  }
}
