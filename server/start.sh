#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP_DIR="$SCRIPT_DIR/app"
SCHEDULE_DIR="$APP_DIR/__pycache__"
LOG_DIR="$SCRIPT_DIR/../logs"

mkdir -p "$SCHEDULE_DIR"
mkdir -p "$LOG_DIR"

exec supervisord -c "$SCRIPT_DIR/supervisord.conf"
