# AKIS IDE — VS Code Extension

AI-powered development environment that brings AKIS Platform agents directly into VS Code.

## Features

| Feature | Description |
|---------|-------------|
| **Agent Sidebar** | Browse available agents (Scribe, Trace, Proto, Piri) from the activity bar |
| **Agent Chat** | Interactive WebView chat with real-time SSE streaming of agent reasoning |
| **Job Monitor** | Live job status tracking with auto-refresh |
| **Code Search** | Hybrid search: indexed symbols + ripgrep content search |
| **File Indexing** | Extract functions, classes, interfaces, types across the workspace |
| **Terminal Integration** | Send terminal output to agents as context |
| **Diagnostics Watcher** | Auto-detect new errors and notify the active agent chat |
| **Workspace Context** | Gather active file, git status, project info for agent prompts |
| **Send File to Agent** | Right-click any file/selection to send it as context to the chat |

## Getting Started

1. Open the extension in VS Code:
   ```bash
   cd ide/vscode-akis
   npm install
   npm run compile
   ```

2. Press `F5` to launch the Extension Development Host.

3. Configure the AKIS server URL via `AKIS: Configure Connection` command.

4. Open the AKIS sidebar (robot icon in the activity bar).

## Commands

| Command | Description |
|---------|-------------|
| `AKIS: Open Agent Chat` | Open the agent chat panel |
| `AKIS: Run Agent` | Select and run an agent |
| `AKIS: Index Workspace` | Index all code files for symbol search |
| `AKIS: Search Code` | Search indexed symbols + ripgrep content |
| `AKIS: Send Terminal Output to Agent` | Send active terminal output to the chat |
| `AKIS: Send File to Agent` | Send current file/selection to the chat |
| `AKIS: Configure Connection` | Set server URL and API token |
| `AKIS: Refresh Index` | Re-index workspace files |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `akis.serverUrl` | `https://staging.akisflow.com` | AKIS Platform server URL |
| `akis.apiToken` | (empty) | API authentication token |
| `akis.autoIndex` | `false` | Auto-index workspace on open |
| `akis.defaultAgent` | `scribe` | Default agent for quick actions |

## Architecture

```
src/
├── extension.ts              # Entry point, command registration
├── commands/                 # VS Code command handlers
│   ├── runAgent.ts
│   ├── indexWorkspace.ts
│   └── searchCode.ts
├── providers/                # TreeView data providers
│   ├── AkisTreeProvider.ts   # Agent + Job tree views
│   ├── AkisStatusBar.ts      # Status bar indicator
│   ├── AkisTerminalProvider.ts
│   └── IndexedFilesProvider.ts
├── views/                    # WebView panels
│   ├── AgentChatPanel.ts     # Main chat interface
│   └── JobDetailPanel.ts     # Job detail viewer
└── services/                 # Core services
    ├── AkisApiClient.ts      # REST API client
    ├── SseStreamClient.ts    # SSE event streaming
    ├── FileIndexer.ts        # Code symbol indexing
    ├── CodeSearchService.ts  # ripgrep-powered search
    ├── WorkspaceContextProvider.ts  # IDE context gathering
    └── DiagnosticsWatcher.ts       # Error monitoring
```

## Tech Stack

- **TypeScript** (strict mode)
- **VS Code Extension API** (1.85+)
- **SSE** for real-time agent events
- **ripgrep** for fast code search (VS Code bundled or system)

## License

MIT — AKIS Platform
