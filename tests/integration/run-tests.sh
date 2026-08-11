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
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
GENERATED_DIR="$SCRIPT_DIR/generated"

LANGUAGES=(python javascript r csharp java rust curl go)
SCENARIOS=(default cql-json cql-text default-get cql-text-get)
SCENARIO_LIST="${SCENARIOS[*]}"
GENERATED_FILES=(Program.cs StacSearch.java search.mjs search.py search.R main.rs search.sh search.go)
TIMEOUT_SECS=300

# Portable timeout: Linux → gtimeout (macOS via brew) → fallback
if command -v timeout &>/dev/null; then
  TIMEOUT_CMD=(timeout "$TIMEOUT_SECS")
elif command -v gtimeout &>/dev/null; then
  TIMEOUT_CMD=(gtimeout "$TIMEOUT_SECS")
else
  TIMEOUT_CMD=()
fi

# Allow running a subset: ./run-tests.sh python javascript
if [[ $# -gt 0 ]]; then
  LANGUAGES=("$@")
fi

echo "── Building Docker images ──"
docker compose -f "$COMPOSE_FILE" build "${LANGUAGES[@]}"

PASSED=()
FAILED=()

for scenario in "${SCENARIOS[@]}"; do
  echo "── Generating code snippets ($scenario) ──"
  node --import "$SCRIPT_DIR/node-loader-register.js" "$SCRIPT_DIR/generate-snippets.js" "$scenario"
  mkdir -p "$GENERATED_DIR/$scenario"
  for file in "${GENERATED_FILES[@]}"; do
    cp "$GENERATED_DIR/$file" "$GENERATED_DIR/$scenario/$file"
  done
  echo ""
done

command_for_language() {
  local lang="$1"

  # Each block runs every scenario in $SCENARIO_LIST (default + CQL + GET
  # variants). Runtime shell variables ($INSTALL_DEPS, $s) are escaped so only
  # the scenario list is interpolated here.
  case "$lang" in
    python)
      cat <<EOF
if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
for s in $SCENARIO_LIST; do python /code/\$s/search.py; done
EOF
      ;;
    javascript)
      cat <<EOF
if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
for s in $SCENARIO_LIST; do node /code/\$s/search.mjs; done
EOF
      ;;
    r)
      cat <<EOF
if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
for s in $SCENARIO_LIST; do Rscript /code/\$s/search.R; done
EOF
      ;;
    csharp)
      cat <<EOF
if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
for s in $SCENARIO_LIST; do cp /code/\$s/Program.cs /app/Program.cs; (cd /app && dotnet run --no-restore); done
EOF
      ;;
    java)
      cat <<EOF
cd /tmp && if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
for s in $SCENARIO_LIST; do cp /code/\$s/StacSearch.java /tmp/StacSearch.java; (cd /tmp && javac -cp '.:*' StacSearch.java && java -cp '.:*' StacSearch); done
EOF
      ;;
    go)
      cat <<EOF
if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
mkdir -p /tmp/app
cd /tmp/app && (go mod init stacsearch || true)
for s in $SCENARIO_LIST; do cp /code/\$s/search.go /tmp/app/search.go; (cd /tmp/app && go run search.go); done
EOF
      ;;
    curl)
      # curl only prints the raw response, so assert the result array is present.
      # Don't pipe directly into grep, that would discard the curl exit code.
      cat <<EOF
if [ -n "\$INSTALL_DEPS" ]; then eval "\$INSTALL_DEPS"; fi
for s in $SCENARIO_LIST; do sh /code/\$s/search.sh > /tmp/\$s.json; grep -q '"features"' /tmp/\$s.json; done
EOF
      ;;
    rust)
      cat <<EOF
if [ -z "\$INSTALL_DEPS" ]; then echo 'INSTALL_DEPS is required for Rust integration tests.' >&2; exit 1; fi
cp /code/default/main.rs /app/src/main.rs
eval "\$INSTALL_DEPS"
for s in $SCENARIO_LIST; do cp /code/\$s/main.rs /app/src/main.rs; (cd /app && cargo build --release && ./target/release/stac-search); done
EOF
      ;;
    *)
      return 1
      ;;
  esac
}

for lang in "${LANGUAGES[@]}"; do
  label="$lang [${SCENARIOS[*]}]"
  echo "── Testing $label ──"
  INSTALL_DEPS="$(node --import "$SCRIPT_DIR/node-loader-register.js" "$SCRIPT_DIR/get-install-dependencies.js" "$lang")"
  LANG_COMMAND="$(command_for_language "$lang")"

  if ${TIMEOUT_CMD+"${TIMEOUT_CMD[@]}"} docker compose -f "$COMPOSE_FILE" run --rm --entrypoint sh -e INSTALL_DEPS="$INSTALL_DEPS" "$lang" -euc "$LANG_COMMAND"; then
    echo "✓ $label passed"
    PASSED+=("$label")
  else
    echo "✗ $label failed (exit $?)"
    FAILED+=("$label")
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
