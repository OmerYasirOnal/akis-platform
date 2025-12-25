# AI Response Schema Contract

This document describes the strict JSON schema validation used for AI responses in AKIS.

## Overview

AKIS uses Zod schemas to validate all structured AI responses. This eliminates silent fallbacks 
and ensures consistent, reliable behavior from AI-powered features.

## Schema Definitions

### Plan Schema (planTask)

```json
{
  "steps": [
    {
      "id": "string (required)",
      "title": "string (required)",
      "detail": "string (optional)"
    }
  ],
  "rationale": "string (optional)"
}
```

**Requirements:**
- `steps` array MUST have at least 1 step
- Each step MUST have `id` and `title` fields
- `detail` and `rationale` are optional

### Critique Schema (reflectOnArtifact)

```json
{
  "issues": ["string array"],
  "recommendations": ["string array"],
  "severity": "low" | "medium" | "high" (optional)
}
```

**Requirements:**
- `issues` MUST be an array of strings (can be empty)
- `recommendations` MUST be an array of strings
- `severity` MUST be one of: `low`, `medium`, `high`

### Validation Schema (validateWithStrongModel)

```json
{
  "passed": true | false,
  "confidence": 0.0-1.0,
  "issues": ["string array"],
  "suggestions": ["string array"],
  "summary": "string"
}
```

**Requirements:**
- `passed` MUST be a boolean
- `confidence` MUST be a number between 0.0 and 1.0
- `issues` and `suggestions` MUST be arrays of strings
- `summary` MUST be a non-empty string

## Validation Flow

```
┌─────────────────┐
│   AI Response   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Extract JSON   │ ← Handles markdown code blocks, extracts JSON objects
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse + Validate│ ← First attempt with Zod schema
└────────┬────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
    Yes  │  No
    ▼    │  ▼
┌───────┐│┌────────────────┐
│Return ││ │  Repair Prompt │ ← AI asked to fix JSON
└───────┘│ └────────┬───────┘
         │          │
         │          ▼
         │ ┌────────────────┐
         │ │Parse + Validate│
         │ └────────┬───────┘
         │     ┌────┴────┐
         │     │ Valid?  │
         │     └────┬────┘
         │     Yes  │  No
         │     ▼    │  ▼
         │ ┌───────┐│┌─────────────────┐
         │ │Return ││ │AI_INVALID_ERROR │
         │ └───────┘│ └─────────────────┘
         │          │
         └──────────┘
```

## Troubleshooting Parse Issues

### Common Causes

1. **Markdown code blocks**: AI wraps JSON in \`\`\`json ... \`\`\`
   - **Solution**: Handled automatically by `extractJsonString()`

2. **Extra text before/after JSON**: AI adds explanation text
   - **Solution**: Handled automatically by regex extraction

3. **Invalid JSON syntax**: Missing commas, quotes, brackets
   - **Solution**: One repair attempt is made automatically

4. **Schema mismatch**: Valid JSON but wrong structure
   - **Solution**: Repair prompt includes expected schema

### Debug Logging

When parse failures occur, the following is logged:

```
[AIService] First parse attempt failed for {context}: {error}
[AIService] Raw response (redacted): {first 500 chars}
[AIService] Successfully repaired JSON for {context}  // if repair succeeds
[AIService] JSON repair failed for {context}: {error}  // if repair fails
[AIService] Model: {model name}
```

### Error Codes

| Error Code | Description |
|------------|-------------|
| `AI_INVALID_RESPONSE` | JSON parsing/validation failed after repair attempt |
| `AI_RATE_LIMITED` | API rate limit exceeded |
| `AI_NETWORK_ERROR` | Network failure communicating with AI provider |

## Best Practices for AI Prompts

1. **Include schema in system prompt**: Clear JSON format specification
2. **Use "CRITICAL" directive**: Emphasize JSON-only response requirement
3. **Provide examples**: Sample valid JSON structure
4. **Set low temperature**: 0.2-0.3 for structured outputs
5. **Avoid markdown instruction**: "NO markdown code blocks"

## Configuration

AI service configuration is in `backend/src/config/env.ts`:

```bash
# Required
AI_PROVIDER=openrouter|openai|mock

# Model selection
AI_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct:free
AI_MODEL_PLANNER=meta-llama/llama-3.3-70b-instruct:free
AI_MODEL_VALIDATION=google/gemini-2.0-flash-exp:free
```

## Testing

Schema validation tests are in `backend/test/unit/AIService.test.ts`:

```bash
# Run AI service tests
pnpm -C backend test

# Specific test
NODE_ENV=test node --test --import tsx backend/test/unit/AIService.test.ts
```

