#!/usr/bin/env bash
# Per-boot startup: make sure the local Postgres cluster is running and ready.
# Node dependency install and schema sync happen in install.sh, not here.
set -euo pipefail

PG_VERSION=16

sudo pg_ctlcluster "$PG_VERSION" main start 2>/dev/null || true
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -q; then
    echo "postgres is ready"
    exit 0
  fi
  sleep 1
done

echo "postgres did not become ready in time" >&2
exit 1
