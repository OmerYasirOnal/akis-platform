# Prompt: Implement Service Facades (GitHub, Confluence, Jira, AI)

Create thin facades (no heavy SDKs yet; keep signatures ready).

// src/services/github/GitHubService.ts
```ts
export interface CreateBranchParams { owner: string; repo: string; base: string; name: string; }
export interface CommitFileParams { owner: string; repo: string; branch: string; path: string; content: string; message: string; }
export interface PullRequestParams { owner: string; repo: string; head: string; base: string; title: string; body?: string; }

export const GitHubService = {
  async createBranch(_params: CreateBranchParams) { /* TODO: Octokit later */ },
  async commitFile(_params: CommitFileParams) { /* TODO */ },
  async createPullRequest(_params: PullRequestParams) { /* TODO */ },
};

// src/services/confluence/ConfluenceService.ts

export const ConfluenceService = {
  async updatePage(_pageId: string, _content: string) { /* TODO */ },
};

// src/services/jira/JiraService.ts

export const JiraService = {
  async fetchIssue(_key: string) { /* TODO */ return null; },
};

// src/services/ai/AIService.ts

export const AIService = {
  async complete(_prompt: string, _opts?: Record<string, any>) { /* TODO: OpenRouter/OpenAI */ return ''; },
};

Deliverables: compile passes, no external calls yet (stubs).
