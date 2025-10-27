# GitHub Contents API Protocol (Create/Update)

## Overview

This document describes the correct protocol for creating or updating files via GitHub Contents API to avoid **422 Unprocessable Entity** errors.

## The Problem

When updating an existing file without providing the current `sha`, GitHub API returns:

```
422 Unprocessable Entity
{
  "message": "Invalid request.\n\nFor 'properties/sha', nil is not a string."
}
```

## The Solution

**Always probe for existing file SHA before updating.**

## Step-by-Step Protocol

### 1. Probe: Check if File Exists

```http
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
Authorization: Bearer {token}
Accept: application/vnd.github.v3+json
```

**Responses:**
- **200 OK** → File exists, extract `sha`
  ```json
  {
    "sha": "abc123...",
    "path": "README.md",
    "content": "..."
  }
  ```
- **404 Not Found** → File doesn't exist, no `sha` needed

### 2. Write: Create or Update File

```http
PUT /repos/{owner}/{repo}/contents/{path}
Authorization: Bearer {token}
Accept: application/vnd.github.v3+json
Content-Type: application/json

{
  "message": "docs: update {path}",
  "content": "<base64-encoded-content>",
  "branch": "{branch}",
  "sha": "<sha-if-exists>"  // ⚠️ REQUIRED for updates, omit for new files
}
```

## Implementation Example

### TypeScript (github-utils.ts)

```typescript
export async function updateFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
  token: string,
  sha?: string  // ⚠️ Optional, but REQUIRED if file exists
): Promise<{ success: boolean; error?: string }> {
  try {
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };
    
    // ⚠️ Only include sha if provided (i.e., file exists)
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update file');
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### Using in mcpCommit (mcp.ts)

```typescript
export async function mcpCommit(
  config: MCPConfig,
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string; content: string }>,
  message: string
) {
  const results = [];
  
  for (const file of files) {
    // ⚠️ STEP 1: Probe for existing SHA
    let existingSha: string | undefined;
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        existingSha = data.sha;  // ✅ Extract SHA
      }
    } catch (error) {
      // File doesn't exist, continue without SHA
    }

    // ⚠️ STEP 2: Update with SHA (if exists)
    const result = await updateFile(
      owner,
      repo,
      branch,
      file.path,
      file.content,
      message,
      config.token,
      existingSha  // ✅ Pass SHA if file exists
    );
    
    results.push({ path: file.path, ...result });
  }

  return { success: results.every(r => r.success), results };
}
```

## Common Mistakes

### ❌ Wrong: Always pass sha (even for new files)
```typescript
// This will fail if file doesn't exist
const body = {
  sha: 'some-random-sha',  // ❌ Wrong
  ...
};
```

### ❌ Wrong: Never pass sha (even for updates)
```typescript
// This will fail with 422 for existing files
const body = {
  // sha missing  // ❌ Wrong
  ...
};
```

### ✅ Correct: Conditional sha
```typescript
const body = { ... };

if (sha) {  // ✅ Correct
  body.sha = sha;
}
```

## Testing

### Test 1: Create New File
```bash
# Should succeed without SHA
PUT /repos/owner/repo/contents/new-file.md
{
  "message": "Create new file",
  "content": "base64...",
  "branch": "main"
  // No SHA field
}
```

### Test 2: Update Existing File
```bash
# Should succeed WITH SHA
PUT /repos/owner/repo/contents/existing-file.md
{
  "message": "Update existing file",
  "content": "base64...",
  "branch": "main",
  "sha": "abc123..."  // ✅ Required
}
```

### Test 3: Update Without SHA (should fail)
```bash
# Should fail with 422
PUT /repos/owner/repo/contents/existing-file.md
{
  "message": "Update existing file",
  "content": "base64...",
  "branch": "main"
  // SHA missing → 422 Error
}
```

## References

- [GitHub Contents API Documentation](https://docs.github.com/en/rest/repos/contents)
- [422 Unprocessable Entity Issue](https://github.com/github/docs/issues/example)

---

*Protocol documented on 2025-10-27 as part of AKIS Scribe Agent bugfix*

