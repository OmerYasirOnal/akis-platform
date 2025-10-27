# Task: Diagnose and Explain Why PR Creation and Docs Generation Fail

## Role
You are the **AKIS Scribe Diagnostic Agent**. Your job is to **observe, prove, and explain** the failure causes — not guess.

## MUST-DO Evidence Checklist

Print the **raw GitHub API responses** for:

1. **`GET /repos/{owner}/{repo}/git/refs/heads/{branch}`** (does head branch exist?)
2. **`GET /repos/{owner}/{repo}/pulls?state=open&head={owner}:{branch}&base=main`** (is there an existing PR?)
3. **`POST /repos/{owner}/{repo}/pulls`** body we send (mask tokens), and the **full response** on failure
4. **`GET /rate_limit`** (remaining/core)
5. **`GET /user`** and token **scopes** (print `x-oauth-scopes` header)

For docs generation: dump the **tech-detection decision path**:
- Which files triggered **Swift/iOS**?
- Which files did you check (and intentionally **did not** check) for JS/Python manifests?

For DAS gate: print the **threshold** and the **computed components** (RefCoverage, Consistency, SpotCheck). If the PR gate blocks creation, state it explicitly.

## Validation Rules

- If the PR fails with "Validation Failed":
  - Check if another PR already exists for `{owner}:{branch} -> main`. If yes, **return the existing PR URL** and mark the run as **success**.
  - If not exists, show the **exact GitHub error payload** (422/400), including `errors` array.
- If `head` branch has **no diff** vs `main`, explain that GitHub rejects PRs with zero commits difference.
- If token scopes are insufficient (no `repo`), print the missing scope and return a **clear remediation**.

## Output Format

### Root Cause(s)
- **Cause 1:** [Evidence] → [Inference] → [Fix]
- **Cause 2:** [Evidence] → [Inference] → [Fix]

### Next Action(s)
1. [Ordered actionable steps]
2. ...

### Evidence Log
```
[2025-10-27T10:30:00Z] GET /user → 200
  x-oauth-scopes: repo, user
  login: username

[2025-10-27T10:30:01Z] GET /rate_limit → 200
  remaining: 4998/5000

[2025-10-27T10:30:02Z] GET /repos/owner/repo/git/refs/heads/docs/branch → 200
  sha: abc123...

[2025-10-27T10:30:03Z] GET /repos/owner/repo/pulls?state=open&head=owner:docs/branch&base=main → 200
  [PR #42 already exists]

[2025-10-27T10:30:04Z] POST /repos/owner/repo/pulls → 422
  {
    "message": "Validation Failed",
    "errors": [
      {
        "resource": "PullRequest",
        "code": "custom",
        "message": "A pull request already exists for owner:docs/branch."
      }
    ]
  }
```

### Tech Detection Path
```
Checking: .xcodeproj → FOUND (Falbak.xcodeproj)
Checking: .swift → FOUND (15 files)
Checking: Info.plist → FOUND
Decision: Swift/iOS detected

Skipping: package.json (Swift/iOS early return)
Skipping: requirements.txt (Swift/iOS early return)
```

### DAS Gate
```
DAS = 20% (below threshold 50%)
  RefCoverage: 0% (0/0 references)
  Consistency: 30% (3/10 links working)
  SpotCheck: 40% (2/5 checks passed)

Gate status: BLOCKED (allowLowDAS=false)
Recommendation: Set allowLowDAS=true to bypass
```

---

## Usage

Run this diagnostic on a failing repository (e.g., Falbak) and paste the full output here.

