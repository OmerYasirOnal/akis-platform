#!/bin/bash
# BATCH 04: Fix internal relative imports after moves
set -e
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents

echo "BATCH 04: Fixing internal relative imports..."

# Fix playbooks: they're in playbooks/ subdirectory, need ../playbooks/
sed -i '' "s|from ['\"]\\./playbooks/|from '../playbooks/|g" src/modules/documentation/agent/*.ts

# Fix playbooks importing from agent/: ../types → ../agent/types
sed -i '' "s|from ['\"]\\./\\./types['\"]|from '../agent/types'|g" src/modules/documentation/playbooks/*.ts
sed -i '' "s|from ['\"]\\.\\./types['\"]|from '../agent/types'|g" src/modules/documentation/playbooks/*.ts

# Fix utils: they import from parent agent/ directory
# ../documentation-agent-types → ../types (since renamed)
sed -i '' "s|from ['\"]\\.\\./ documentation-agent-types['\"]|from '../types'|g" src/modules/documentation/agent/utils/*.ts

# Fix runner.client.ts: needs absolute imports since it's in modules/agents/scribe/
sed -i '' "s|from ['\"]\\.\\./documentation-agent['\"]|from '@/modules/documentation/agent/documentation-agent'|g" src/modules/agents/scribe/client/runner.client.ts
sed -i '' "s|from ['\"]\\.\\./documentation-agent-types['\"]|from '@/modules/documentation/agent/types'|g" src/modules/agents/scribe/client/runner.client.ts

# Fix documentation-agent.ts: importing from shared-types but needs types.ts
# shared-types has BaseAgent stuff, types.ts has DocumentationAgentInput, etc.
# Check what needs to come from where
sed -i '' "s|from ['\"]\\./shared-types['\"]|from './types'|g" src/modules/documentation/agent/documentation-agent.ts

echo "✅ Internal imports fixed"

