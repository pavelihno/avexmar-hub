#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP_DIR="$SCRIPT_DIR/app"
SCHEDULE_DIR="$APP_DIR/__pycache__"
SCHEDULE_FILE="$SCHEDULE_DIR/celerybeat-schedule"

mkdir -p "$SCHEDULE_DIR"

celery -A app.celery_app.celery worker -B -l info --pool=solo -s "$SCHEDULE_FILE" &
CELERY_PID=$!

echo "Started Celery (worker+beat) PID $CELERY_PID (schedule: $SCHEDULE_FILE)"

trap 'echo "Stopping Celery PID $CELERY_PID"; kill $CELERY_PID' EXIT

# Start Flask
python3 -m flask run --host=0.0.0.0 --port=8000 --debug