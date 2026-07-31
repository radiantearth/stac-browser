#!/usr/bin/env bash
#
# Shared helpers for Docker image tests.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

DOCKER_IMAGE="${DOCKER_IMAGE:-stac-browser:test}"

build_image() {
  local tag="$1"
  shift

  echo "Building Docker image: $tag"
  docker build -t "$tag" "$@" "$PROJECT_ROOT"
}
