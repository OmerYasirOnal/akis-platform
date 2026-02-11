#!/bin/bash
set -e

echo "=== AKIS Staging Visual Check ==="
echo ""

URLS=(
  "landing:https://staging.akisflow.com/"
  "agents:https://staging.akisflow.com/agents"
)

for url_pair in "${URLS[@]}"; do
  IFS=':' read -r name url <<< "$url_pair"
  
  echo "=== Checking: $name ==="
  echo "URL: $url"
  echo ""
  
  # Use curl to check HTTP status and response
  echo "HTTP Status:"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
  echo "  Status Code: $http_code"
  
  if [ "$http_code" -eq 200 ]; then
    echo "  ✓ Page responds with 200 OK"
  else
    echo "  ✗ Unexpected status code"
  fi
  
  echo ""
  
  # Capture screenshot with longer wait time
  echo "Capturing screenshot..."
  npx playwright screenshot \
    --browser chromium \
    --full-page \
    --wait-for-timeout 5000 \
    "$url" \
    "staging-screenshots/${name}-page.png" 2>&1
  
  echo "  ✓ Screenshot saved: staging-screenshots/${name}-page.png"
  echo ""
  
done

echo "=== Visual check complete ==="
echo ""
echo "Screenshots saved in: staging-screenshots/"
ls -lh staging-screenshots/*.png
