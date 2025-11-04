export interface CreateBranchParams { owner: string; repo: string; base: string; name: string; }
export interface CommitFileParams { owner: string; repo: string; branch: string; path: string; content: string; message: string; }
export interface PullRequestParams { owner: string; repo: string; head: string; base: string; title: string; body?: string; }

export const GitHubService = {
  async createBranch(_params: CreateBranchParams) {},
  async commitFile(_params: CommitFileParams) {},
  async createPullRequest(_params: PullRequestParams) {},
};


