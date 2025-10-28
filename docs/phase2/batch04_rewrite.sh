#!/bin/bash
# BATCH 04 Import Rewrite Script
set -e
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents

echo "BATCH 04: Rewriting agent imports..."

FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*")

for file in $FILES; do
  # Agent core
  sed -i '' 's|from ["'\'']\(@/lib/agents/documentation-agent\)["'\'']|from "@/modules/documentation/agent/documentation-agent"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/documentation-agent-types\)["'\'']|from "@/modules/documentation/agent/types"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/document-agent\)["'\'']|from "@/modules/documentation/agent/document-agent"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/document-agent-v2\)["'\'']|from "@/modules/documentation/agent/document-agent-v2"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/base-agent\)["'\'']|from "@/modules/documentation/agent/base-agent"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/types\)["'\'']|from "@/modules/documentation/agent/shared-types"|g' "$file"
  
  # Playbooks
  sed -i '' 's|from ["'\'']\(@/lib/agents/playbooks/documentation-agent-playbook\)["'\'']|from "@/modules/documentation/playbooks/documentation-agent-playbook"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/playbooks/document-agent-playbook\)["'\'']|from "@/modules/documentation/playbooks/document-agent-playbook"|g' "$file"
  
  # Scribe runner
  sed -i '' 's|from ["'\'']\(@/lib/agents/scribe/runner\)["'\'']|from "@/modules/agents/scribe/client/runner.client"|g' "$file"
  
  # Utils
  sed -i '' 's|from ["'\'']\(@/lib/agents/utils/github-utils\)["'\'']|from "@/modules/documentation/agent/utils/github-utils"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/agents/utils/github-utils-v2\)["'\'']|from "@/modules/documentation/agent/utils/github-utils-v2"|g' "$file"
done

# Fix internal relative imports in moved files
# documentation-agent-types.ts was renamed to types.ts
sed -i '' "s|from ['\"]\\./documentation-agent-types['\"]|from './types'|g" src/modules/documentation/agent/*.ts 2>/dev/null || true

# Fix relative imports to shared-types
sed -i '' "s|from ['\"]\\./types['\"]|from './shared-types'|g" src/modules/documentation/agent/*.ts 2>/dev/null || true

# Fix MCP service import (now points to correct location)
sed -i '' 's|from ["'\'']\(@/lib/agents/utils/github-utils\)["'\'']|from "@/modules/documentation/agent/utils/github-utils"|g' src/shared/services/mcp.ts

echo "✅ Import rewrite complete"

REMAINING=$(grep -R "from.*@/lib/" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "Remaining @/lib/ imports: $REMAINING"

