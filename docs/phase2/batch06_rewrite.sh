#!/bin/bash
# BATCH 06: Rewrite component imports
set -e
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents

echo "BATCH 06: Rewriting component imports..."

FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*")

for file in $FILES; do
  # Documentation feature components
  sed -i '' 's|from ["'\'']\(@/components/DocumentAgent\)["'\'']|from "@/modules/documentation/components/DocumentAgent"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/DocumentationAgentUI\)["'\'']|from "@/modules/documentation/components/DocumentationAgentUI"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/AgentPlaybookViewer\)["'\'']|from "@/modules/documentation/components/AgentPlaybookViewer"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/AgentRunPanel\)["'\'']|from "@/modules/documentation/components/AgentRunPanel"|g' "$file"
  
  # Shared GitHub components
  sed -i '' 's|from ["'\'']\(@/components/BranchCreator\)["'\'']|from "@/shared/components/github/BranchCreator"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/GitHubConnect\)["'\'']|from "@/shared/components/github/GitHubConnect"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/GitHubRepositories\)["'\'']|from "@/shared/components/github/GitHubRepositories"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/RepoPicker\)["'\'']|from "@/shared/components/github/RepoPicker"|g' "$file"
  
  # Shared AI component
  sed -i '' 's|from ["'\'']\(@/components/ModelSelector\)["'\'']|from "@/shared/components/ai/ModelSelector"|g' "$file"
  
  # Shared integration components
  sed -i '' 's|from ["'\'']\(@/components/integrations/GitHubIntegration\)["'\'']|from "@/shared/components/integrations/GitHubIntegration"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/components/integrations/GitHubPATIntegration\)["'\'']|from "@/shared/components/integrations/GitHubPATIntegration"|g' "$file"
done

echo "✅ Import rewrite complete"

