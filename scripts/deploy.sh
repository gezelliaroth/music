#!/bin/bash
set -e

REMOTE_HOST="root@80.78.26.161"
DOMAIN="phvkxjjs9x2vjkra.nexus"
APP_DIR="/opt/music"
INTERNAL_PORT=3000

echo "=== Deploying music server to $REMOTE_HOST ==="

# Step 1: Copy application files to remote server
echo "[1/6] Copying application files..."
ssh $REMOTE_HOST "mkdir -p $APP_DIR/resources"
scp server.js $REMOTE_HOST:$APP_DIR/
scp resources/song.mp3 $REMOTE_HOST:$APP_DIR/resources/

# Step 2: Create modified server.js that uses fixed port
echo "[2/6] Configuring server for fixed port $INTERNAL_PORT..."
ssh $REMOTE_HOST "sed -i 's/const port = 49152 + Math.floor(Math.random() \* 16384);/const port = $INTERNAL_PORT;/' $APP_DIR/server.js"

# Step 3: Install dependencies on remote server
echo "[3/6] Installing dependencies (Node.js, nginx, certbot)..."
ssh $REMOTE_HOST << 'REMOTE_SETUP'
set -e

# Update and install packages
apt-get update
apt-get install -y curl nginx certbot python3-certbot-nginx

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"
REMOTE_SETUP

# Step 4: Create systemd service
echo "[4/6] Creating systemd service..."
ssh $REMOTE_HOST << SYSTEMD
cat > /etc/systemd/system/music.service << 'EOF'
[Unit]
Description=Music Streaming Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable music
systemctl restart music
SYSTEMD

# Step 5: Configure nginx
echo "[5/6] Configuring nginx..."
ssh $REMOTE_HOST << NGINX
cat > /etc/nginx/sites-available/music << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$INTERNAL_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_buffering off;
    }
}
EOF

ln -sf /etc/nginx/sites-available/music /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
NGINX

# Step 6: Issue SSL certificate with certbot
echo "[6/6] Issuing SSL certificate for $DOMAIN..."
ssh $REMOTE_HOST "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect"

echo ""
echo "=== Deployment complete! ==="
echo "Your music server is now running at: https://$DOMAIN"
echo ""
echo "Useful commands on the remote server:"
echo "  systemctl status music    - Check server status"
echo "  journalctl -u music -f    - View server logs"
echo "  systemctl restart music   - Restart the server"
