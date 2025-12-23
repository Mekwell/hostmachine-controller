#!/bin/bash
set -e

# ==========================================
# Hostmachine Controller Deployment Script
# Target: Ubuntu 24.04 LTS (Cloud VPS)
# Usage: ./deploy.sh --domain api.yourdomain.com
# ==========================================

DOMAIN=""

# Parse Args
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo ">>> Starting Hostmachine Controller Setup..."

# Skip problematic commands in test mode
if [ "$HM_TEST_MODE" = "true" ]; then
    echo "--- HM_TEST_MODE enabled. Skipping UFW and Nginx/Certbot setup ---"
else
    # 1. System Updates (Full)
    echo "--- Updating System ---"
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y curl git build-essential ufw nginx certbot python3-certbot-nginx

    # 2. VPN Setup Reminder
    echo "--- VPN Setup Reminder ---"
    echo "NOTE: Ensure Netmaker/WireGuard is installed if this is your VPN Hub."

    # 3. Install Node.js 20 (LTS)
    echo "--- Installing Node.js ---"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # 4. Install Global Tools (PM2, NestJS CLI)
    echo "--- Installing PM2 & NestCLI ---"
    sudo npm install -g pm2 @nestjs/cli

    # 5. Firewall Setup
    echo "--- Configuring Firewall ---"
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw allow 51820/udp # WireGuard VPN
    # Port 3000 is NOT opened publicly; Nginx handles it.
    sudo ufw --force enable
fi

# 6. Application Setup
APP_DIR="/opt/hostmachine-controller"

if [ ! -d "$APP_DIR" ]; then
    echo "Creating App Directory $APP_DIR..."
    sudo mkdir -p $APP_DIR
    sudo chown -R root:root $APP_DIR # Use root as owner for system apps
    echo "!!! PLEASE UPLOAD CONTROLLER CODE TO $APP_DIR !!!"
else
    echo "App directory exists."
fi

# 7. Environment Config
echo "--- Configuring Environment ---"
# Check if .env exists, create if not
if [ ! -f "$APP_DIR/.env" ]; then
    cat <<EOF | sudo tee $APP_DIR/.env
PORT=3000
ENROLLMENT_SECRET=change_me_to_something_secure_random
INTERNAL_API_SECRET=change_me_to_something_secure_random
DATABASE_FILE=hostmachine.sqlite
EOF
fi

# 8. Start Application with PM2
echo "--- Starting Application ---"
cd $APP_DIR
# Only run if code exists (for this script to be safe)
if [ "$HM_TEST_MODE" != "true" ] && [ -f "package.json" ]; then
    npm install
    npm run build
    pm2 start dist/main.js --name "hm-controller"
    pm2 save
    pm2 startup
elif [ "$HM_TEST_MODE" = "true" ]; then
    echo "Skipping PM2 startup in test mode."
fi

# 9. Configure Nginx & SSL
if [ "$HM_TEST_MODE" != "true" ] && [ ! -z "$DOMAIN" ]; then
    echo "--- Configuring Nginx for $DOMAIN ---"
    
    # Generate Nginx Config
    cat <<EOF | sudo tee /etc/nginx/sites-available/hm-controller
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

    # Enable Site
    sudo ln -sf /etc/nginx/sites-available/hm-controller /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx

    # Setup SSL (Let's Encrypt)
    echo "--- Requesting SSL Certificate ---"
    # Non-interactive mode requires --agree-tos and -m <email>, but for simplicity we allow interactive fallback
    # or user runs this manually later. We'll try a safe attempt.
    echo "Running Certbot... (You may need to provide an email)"
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email || echo "Certbot failed auto-setup. Run 'sudo certbot --nginx' manually."
    
else
    echo "Skipping Nginx/SSL setup (Test Mode or No Domain provided)."
fi

# 10. Configure Auto-Updates (Cron)
echo "--- Configuring Auto-Updates ---"
UPDATE_SCRIPT="$APP_DIR/scripts/update.sh"
if [ -f "$UPDATE_SCRIPT" ]; then
    chmod +x $UPDATE_SCRIPT
    # Check if cron already exists
    if ! crontab -l | grep -q "hostmachine-controller/scripts/update.sh"; then
        echo "Adding Cron Job..."
        (crontab -l 2>/dev/null; echo "*/5 * * * * $UPDATE_SCRIPT") | crontab -
    else
        echo "Cron job already exists."
    fi
else
    echo "Update script not found at $UPDATE_SCRIPT. Skipping cron setup."
fi

echo ">>> Controller Setup Complete!"
echo "Next Steps:"
echo "1. Install Netmaker (VPN Server)"
echo "2. Upload your code to $APP_DIR"
echo "3. Run 'npm install && npm run build'"
echo "4. Run 'pm2 restart hm-controller'"