#!/usr/bin/env bash
# clean-env.sh — Geliştirme ortamı temizliği
# __pycache__, .pytest_cache, .egg-info, build artifact'ları kaldırır.
# AKIS Platform — devagents
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Ortam temizleniyor: $ROOT"

# Python
for name in __pycache__ .pytest_cache .mypy_cache .ruff_cache; do
  find "$ROOT" -type d -name "$name" 2>/dev/null | xargs rm -rf 2>/dev/null || true
done
find "$ROOT" -type d -name "*.egg-info" 2>/dev/null | xargs rm -rf 2>/dev/null || true
find "$ROOT" -name "*.pyc" -delete 2>/dev/null || true

# Node (pnpm/npm turbo cache)
[ -d "$ROOT/node_modules/.cache" ] && rm -rf "$ROOT/node_modules/.cache"
[ -d "$ROOT/.turbo" ] && rm -rf "$ROOT/.turbo"
[ -d "$ROOT/frontend/node_modules/.vite" ] && rm -rf "$ROOT/frontend/node_modules/.vite"

echo "Temizlik tamamlandı."
