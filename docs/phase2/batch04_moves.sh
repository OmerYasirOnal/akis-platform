#!/bin/bash
# BATCH 04: Move lib/agents/* → modules/documentation/
set -e
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents

echo "BATCH 04: Moving agent files..."

# Agent core files
mv src/lib/agents/documentation-agent.ts src/modules/documentation/agent/documentation-agent.ts && echo "✅ documentation-agent.ts"
mv src/lib/agents/documentation-agent-types.ts src/modules/documentation/agent/types.ts && echo "✅ types.ts (was documentation-agent-types.ts)"
mv src/lib/agents/document-agent.ts src/modules/documentation/agent/document-agent.ts && echo "✅ document-agent.ts"
mv src/lib/agents/document-agent-v2.ts src/modules/documentation/agent/document-agent-v2.ts && echo "✅ document-agent-v2.ts"
mv src/lib/agents/base-agent.ts src/modules/documentation/agent/base-agent.ts && echo "✅ base-agent.ts"
mv src/lib/agents/types.ts src/modules/documentation/agent/shared-types.ts && echo "✅ shared-types.ts (was types.ts)"

# Playbooks
mv src/lib/agents/playbooks/documentation-agent-playbook.ts src/modules/documentation/playbooks/documentation-agent-playbook.ts && echo "✅ documentation-agent-playbook.ts"
mv src/lib/agents/playbooks/document-agent-playbook.ts src/modules/documentation/playbooks/document-agent-playbook.ts && echo "✅ document-agent-playbook.ts"

# Scribe runner
mv src/lib/agents/scribe/runner.ts src/modules/agents/scribe/client/runner.client.ts && echo "✅ runner.client.ts (was runner.ts)"

# Utils
mv src/lib/agents/utils/github-utils.ts src/modules/documentation/agent/utils/github-utils.ts && echo "✅ utils/github-utils.ts"
mv src/lib/agents/utils/github-utils-v2.ts src/modules/documentation/agent/utils/github-utils-v2.ts && echo "✅ utils/github-utils-v2.ts"

# Skip legacy (DEPRECATED)
if [ -f src/lib/agents/utils/github-utils-legacy.ts ]; then
  echo "⏭️  SKIP: github-utils-legacy.ts (DEPRECATED, 0 imports)"
fi

echo "✅ BATCH 04 moves complete (11 files moved, 1 skipped)"

