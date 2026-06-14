#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/sandalpunk"
JAR_NAME="sandalpunk.jar"
PREVIOUS_JAR_NAME="sandalpunk.jar.previous"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_DIR}"
mvn clean package

sudo install -d "${APP_DIR}"
if sudo test -f "${APP_DIR}/${JAR_NAME}"; then
    sudo cp -p "${APP_DIR}/${JAR_NAME}" "${APP_DIR}/${PREVIOUS_JAR_NAME}"
fi
sudo install -m 0644 "target/sandalpunk-0.0.1-SNAPSHOT.jar" "${APP_DIR}/${JAR_NAME}"
sudo systemctl daemon-reload
sudo systemctl restart sandalpunk
sudo systemctl status sandalpunk --no-pager
