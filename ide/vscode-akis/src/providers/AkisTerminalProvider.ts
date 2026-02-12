import * as vscode from 'vscode';

export class AkisTerminalProvider {
  private terminals = new Map<string, vscode.Terminal>();
  private outputBuffer = new Map<string, string[]>();

  createTerminal(name: string): vscode.Terminal {
    const existing = this.terminals.get(name);
    if (existing) {
      existing.show();
      return existing;
    }

    const terminal = vscode.window.createTerminal({
      name: `AKIS: ${name}`,
      iconPath: new vscode.ThemeIcon('hubot'),
    });

    this.terminals.set(name, terminal);
    this.outputBuffer.set(name, []);

    terminal.show();
    return terminal;
  }

  sendCommand(terminalName: string, command: string): void {
    const terminal = this.terminals.get(terminalName) || this.createTerminal(terminalName);
    terminal.sendText(command);

    const buffer = this.outputBuffer.get(terminalName) || [];
    buffer.push(`$ ${command}`);
    this.outputBuffer.set(terminalName, buffer);
  }

  getActiveTerminalOutput(): string | undefined {
    const active = vscode.window.activeTerminal;
    if (!active) {
      return undefined;
    }

    for (const [name, terminal] of this.terminals) {
      if (terminal === active) {
        const buffer = this.outputBuffer.get(name) || [];
        return buffer.join('\n');
      }
    }
    return undefined;
  }

  async captureSelection(): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      return undefined;
    }

    return editor.document.getText(selection);
  }

  dispose(): void {
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
    this.outputBuffer.clear();
  }
}
