#!/bin/sh
# Pull latest, rebuild, and recreate the running container.
#
# Expects the deployment layout documented in README.md's Deployment section:
#   <deploy-dir>/
#   ├── src/                 <- this repo, git-cloned (this script lives at src/scripts/update.sh)
#   ├── data/                 <- persistent state — never touched by this script
#   ├── .env
#   └── docker-compose.yml
#
# Run it from anywhere; paths are resolved relative to this script's own location, not $PWD.
# Prefix with `sudo` yourself if your Docker install requires it: `sudo scripts/update.sh`.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="$(dirname "$SRC_DIR")"

echo "==> Pulling latest source in $SRC_DIR"
cd "$SRC_DIR"
git pull

echo "==> Building image"
docker build -t project-library .

echo "==> Recreating container"
cd "$DEPLOY_DIR"
docker compose up -d --force-recreate

echo "==> Done. Recent logs:"
docker compose logs --tail=30
