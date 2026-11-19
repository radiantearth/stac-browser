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
    docker rm --force "$container_id" > /dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "── Building Docker image ──"
build_image "$DOCKER_IMAGE"
echo "✓ Docker build passed"

echo "── Testing runtime configuration ──"
allowed_domains="example.com,quote's.test,back\\slash.test"
catalog_title=$'Earth\'s \\ catalog\nSecond line'
path_prefix="/browser/"
footer_links='[{"label":"Docs","url":"https://example.com/docs"}]'
container_id="$(
  docker run --detach --rm \
    --env "SB_allowedDomains=$allowed_domains" \
    --env "SB_catalogTitle=$catalog_title" \
    --env "SB_pathPrefix=$path_prefix" \
    --env "SB_footerLinks=$footer_links" \
    "$DOCKER_IMAGE"
)"

runtime_config=""
for _ in $(seq 1 50); do
  # Image ships an empty stub (`window.STAC_BROWSER_CONFIG = {};`); wait for the
  # entrypoint to replace it. pathPrefix is always written by the entrypoint.
  if runtime_config="$(docker exec "$container_id" cat /usr/share/stac-browser/runtime-config.js 2>/dev/null)" \
    && [[ "$runtime_config" == *'pathPrefix:'* ]]; then
    break
  fi
  sleep 0.1
done
if [[ "$runtime_config" != *'pathPrefix:'* ]]; then
  echo "Runtime config was not generated in time" >&2
  exit 1
fi

RUNTIME_CONFIG="$runtime_config" PATH_PREFIX="$path_prefix" node <<'NODE'
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
assert.equal(window.STAC_BROWSER_CONFIG.pathPrefix, process.env.PATH_PREFIX);
assert.deepEqual(window.STAC_BROWSER_CONFIG.footerLinks, [
  { label: "Docs", url: "https://example.com/docs" },
]);
NODE

base_href="$(
  docker exec "$container_id" \
    sed -n 's/.*<base href="\([^"]*\)" id="stac-browser-base">.*/\1/p' /usr/share/stac-browser/index.html
)"
if [[ "$base_href" != "$path_prefix" ]]; then
  echo "Expected <base href=\"$path_prefix\">, got: $base_href" >&2
  exit 1
fi

echo "✓ Runtime configuration passed"

echo "── Testing HTTP responses ──"
# Prints "<status> <Location header>" for a request from within the container
request() {
  docker exec "$container_id" \
    curl --silent --output /dev/null --write-out '%{http_code} %header{location}' "http://localhost:8080$1"
}
assert_response() {
  local path="$1"
  local expected="$2"
  local actual
  actual="$(request "$path")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected '$expected' for $path, got: '$actual'" >&2
    exit 1
  fi
}

for _ in $(seq 1 50); do
  [[ "$(request "$path_prefix")" == "200 "* ]] && break
  sleep 0.1
done

assert_response "/browser/" "200 "
assert_response "/browser/runtime-config.js" "200 "
# Single-page application routes are served by index.html
assert_response "/browser/collections/example" "200 "
# The bare prefix redirects to the prefix with trailing slash, keeping the query string
assert_response "/browser" "301 /browser/"
assert_response "/browser?a=1&b=2" "301 /browser/?a=1&b=2"
# Nothing is served outside of the prefix
assert_response "/" "404 "
assert_response "/other" "404 "

spa_page="$(docker exec "$container_id" curl --silent "http://localhost:8080/browser/collections/example")"
if [[ "$spa_page" != *'id="stac-browser-base"'* ]]; then
  echo "Expected index.html for a single-page application route" >&2
  exit 1
fi

echo "✓ HTTP responses passed"
