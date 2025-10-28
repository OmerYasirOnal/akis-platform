#!/bin/bash
# BATCH 02 Import Rewrite Script
# Rewrites @/lib/auth/, @/lib/ai/, @/lib/utils/ imports to @/shared/lib/*

set -e
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents

echo "BATCH 02: Rewriting imports..."

# Find all TypeScript/TSX files (excluding node_modules, .next)
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*")

# Rewrite rules (sed compatible)
for file in $FILES; do
  # lib/auth/* → shared/lib/auth/*
  sed -i '' 's|from ["'\'']\(@/lib/auth/actor\)["'\'']|from "@/shared/lib/auth/actor"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/auth/storage\)["'\'']|from "@/shared/lib/auth/storage"|g' "$file"
  
  # lib/ai/* → shared/lib/ai/*
  sed -i '' 's|from ["'\'']\(@/lib/ai/models\)["'\'']|from "@/shared/lib/ai/models"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/ai/openrouter\)["'\'']|from "@/shared/lib/ai/openrouter"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/ai/usage-tracker\)["'\'']|from "@/shared/lib/ai/usage-tracker"|g' "$file"
  
  # lib/utils/* → shared/lib/utils/*
  sed -i '' 's|from ["'\'']\(@/lib/utils/logger\)["'\'']|from "@/shared/lib/utils/logger"|g' "$file"
  sed -i '' 's|from ["'\'']\(@/lib/utils/diagnostic\)["'\'']|from "@/shared/lib/utils/diagnostic"|g' "$file"
done

echo "✅ Import rewrite complete"

# Count remaining @/lib/ imports
REMAINING=$(grep -R "from.*@/lib/" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "Remaining @/lib/ imports: $REMAINING"

