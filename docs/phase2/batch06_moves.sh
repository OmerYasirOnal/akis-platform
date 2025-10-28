#!/bin/bash
# BATCH 06: Move components to feature/shared locations
set -e
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents

echo "BATCH 06: Moving components..."

# Documentation feature components (4 files)
mv src/components/DocumentAgent.tsx src/modules/documentation/components/DocumentAgent.tsx && echo "✅ DocumentAgent.tsx"
mv src/components/DocumentationAgentUI.tsx src/modules/documentation/components/DocumentationAgentUI.tsx && echo "✅ DocumentationAgentUI.tsx"
mv src/components/AgentPlaybookViewer.tsx src/modules/documentation/components/AgentPlaybookViewer.tsx && echo "✅ AgentPlaybookViewer.tsx"
mv src/components/AgentRunPanel.tsx src/modules/documentation/components/AgentRunPanel.tsx && echo "✅ AgentRunPanel.tsx"

# Shared GitHub components (4 files)
mv src/components/BranchCreator.tsx src/shared/components/github/BranchCreator.tsx && echo "✅ BranchCreator.tsx"
mv src/components/GitHubConnect.tsx src/shared/components/github/GitHubConnect.tsx && echo "✅ GitHubConnect.tsx"
mv src/components/GitHubRepositories.tsx src/shared/components/github/GitHubRepositories.tsx && echo "✅ GitHubRepositories.tsx"
mv src/components/RepoPicker.tsx src/shared/components/github/RepoPicker.tsx && echo "✅ RepoPicker.tsx"

# Shared AI component (1 file)
mv src/components/ModelSelector.tsx src/shared/components/ai/ModelSelector.tsx && echo "✅ ModelSelector.tsx"

# Shared integration components (2 files)
mv src/components/integrations/GitHubIntegration.tsx src/shared/components/integrations/GitHubIntegration.tsx && echo "✅ GitHubIntegration.tsx"
mv src/components/integrations/GitHubPATIntegration.tsx src/shared/components/integrations/GitHubPATIntegration.tsx && echo "✅ GitHubPATIntegration.tsx"

echo "✅ BATCH 06 moves complete (11 components)"

