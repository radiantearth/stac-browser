#!/usr/bin/env bash
#
# Runs the code-generator integration tests:
#   1. Generate runnable code snippets from each CodeGenerator
#   2. Build Docker images (caches language dependencies)
#   3. Execute each snippet in its own container against a real STAC API
#
# Usage:
#   bash tests/integration/run-tests.sh          # run all
#   bash tests/integration/run-tests.sh python    # run one language

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

LANGUAGES=(python javascript r csharp java rust)
TIMEOUT_SECS=120

# Portable timeout: Linux → gtimeout (macOS via brew) → fallback
if command -v timeout &>/dev/null; then
  TIMEOUT_CMD=(timeout "$TIMEOUT_SECS")
elif command -v gtimeout &>/dev/null; then
  TIMEOUT_CMD=(gtimeout "$TIMEOUT_SECS")
else
  TIMEOUT_CMD=()
fi

echo "── Generating code snippets ──"
node --import "$SCRIPT_DIR/node-loader-register.js" "$SCRIPT_DIR/generate-snippets.js"
echo ""

echo "── Building Docker images ──"
docker compose -f "$COMPOSE_FILE" build


# Allow running a subset: ./run-tests.sh python javascript
if [[ $# -gt 0 ]]; then
  LANGUAGES=("$@")
fi

PASSED=()
FAILED=()

for lang in "${LANGUAGES[@]}"; do
  echo "── Testing $lang ──"
  if ${TIMEOUT_CMD+"${TIMEOUT_CMD[@]}"} docker compose -f "$COMPOSE_FILE" run --rm "$lang"; then
    echo "✓ $lang passed"
    PASSED+=("$lang")
  else
    echo "✗ $lang failed (exit $?)"
    FAILED+=("$lang")
  fi
  echo ""
done


echo "══════════════════════════════"
echo "Passed: ${PASSED[*]:-none}"
echo "Failed: ${FAILED[*]:-none}"
echo "══════════════════════════════"

if [[ ${#FAILED[@]} -gt 0 ]]; then
  exit 1
fi
