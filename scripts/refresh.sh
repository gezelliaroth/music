#!/bin/bash
set -e

REMOTE_HOST="root@80.78.26.161"
APP_DIR="/opt/music"
INTERNAL_PORT=3000

echo "=== Refreshing server code ==="

# Copy updated server.js
echo "[1/3] Uploading server.js..."
scp "$(dirname "$0")/../server.js" $REMOTE_HOST:$APP_DIR/

# Fix the port
echo "[2/3] Configuring port..."
ssh $REMOTE_HOST "sed -i 's/const port = 49152 + Math.floor(Math.random() \* 16384);/const port = $INTERNAL_PORT;/' $APP_DIR/server.js"

# Restart the service
echo "[3/3] Restarting service..."
ssh $REMOTE_HOST "systemctl restart music"

echo "=== Done! Server refreshed ==="
