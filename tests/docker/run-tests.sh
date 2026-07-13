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

echo "── Building Docker image ──"
build_image "$DOCKER_IMAGE"
echo "✓ Docker build passed"
