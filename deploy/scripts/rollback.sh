#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/sandalpunk"
JAR_NAME="sandalpunk.jar"
PREVIOUS_JAR_NAME="sandalpunk.jar.previous"

if ! sudo test -f "${APP_DIR}/${PREVIOUS_JAR_NAME}"; then
    echo "Previous JAR not found: ${APP_DIR}/${PREVIOUS_JAR_NAME}" >&2
    exit 1
fi

sudo install -m 0644 "${APP_DIR}/${PREVIOUS_JAR_NAME}" "${APP_DIR}/${JAR_NAME}"
sudo systemctl restart sandalpunk
sudo systemctl status sandalpunk --no-pager
