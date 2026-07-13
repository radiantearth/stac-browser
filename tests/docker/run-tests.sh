#!/usr/bin/env bash
#
# Runs Docker image tests.
#
# Usage:
#   bash tests/docker/run-tests.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=tests/docker/common.sh
source "$SCRIPT_DIR/common.sh"

container_id=""
cleanup() {
  if [[ -n "$container_id" ]]; then
    docker rm --force "$container_id" > /dev/null
  fi
}
trap cleanup EXIT

echo "── Building Docker image ──"
build_image "$DOCKER_IMAGE"
echo "✓ Docker build passed"

echo "── Testing runtime configuration ──"
allowed_domains="example.com,quote's.test,back\\slash.test"
catalog_title=$'Earth\'s \\ catalog\nSecond line'
container_id="$(
  docker run --detach --rm \
    --env "SB_allowedDomains=$allowed_domains" \
    --env "SB_catalogTitle=$catalog_title" \
    "$DOCKER_IMAGE"
)"

runtime_config="$(
  docker exec "$container_id" \
    cat /usr/share/nginx/html/runtime-config.js
)"

RUNTIME_CONFIG="$runtime_config" node <<'NODE'
const assert = require("node:assert/strict");

global.window = {};
eval(process.env.RUNTIME_CONFIG);

assert.deepEqual(window.STAC_BROWSER_CONFIG.allowedDomains, [
  "example.com",
  "quote's.test",
  "back\\slash.test",
]);
assert.equal(
  window.STAC_BROWSER_CONFIG.catalogTitle,
  "Earth's \\ catalog\nSecond line",
);
NODE
echo "✓ Runtime configuration passed"
