#!/usr/bin/env bash
set -euo pipefail

sudo systemctl restart sandalpunk
sudo systemctl status sandalpunk --no-pager

