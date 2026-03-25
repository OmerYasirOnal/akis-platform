export interface FileChange {
  action: 'create' | 'modify' | 'delete';
  path: string;
  content?: string;
  previousContent?: string;
}

export interface DevSessionContext {
  spec: unknown;
  repoOwner: string;
  repoName: string;
  branch: string;
  fileTree: FileTreeNode[];
  chatHistory: ChatMessage[];
}

export interface FileTreeNode {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileTreeNode[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  fileChanges?: FileChange[];
}
