#!/bin/bash
# Hostmachine VPN Hub Setup (Netmaker)
# Usage: sudo ./setup-vpn-hub.sh --domain "vpn.yourdomain.com" --email "admin@yourdomain.com"

DOMAIN=""
EMAIL=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift ;;
        --email) EMAIL="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: sudo ./setup-vpn-hub.sh --domain <SUBDOMAIN> --email <EMAIL>"
    echo "Example: sudo ./setup-vpn-hub.sh --domain vpn.hostmachine.com --email admin@hostmachine.com"
    echo "IMPORTANT: Ensure DNS records for *.vpn.hostmachine.com point to this server IP!"
    exit 1
fi

echo ">>> Setting up Netmaker VPN Hub on $DOMAIN..."

# 1. Install Docker & WireGuard
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sudo sh
fi

if ! command -v wg &> /dev/null; then
    echo "Installing WireGuard..."
    sudo apt-get update && sudo apt-get install -y wireguard-tools
fi

# 2. Open Firewall Ports
echo "Opening Ports..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 51821:51830/udp
sudo ufw reload

# 3. Download & Configure Netmaker
mkdir -p /opt/netmaker
cd /opt/netmaker

echo "Downloading Docker Compose..."
wget -qO docker-compose.yml https://raw.githubusercontent.com/gravitl/netmaker/master/compose/docker-compose.yml

echo "Generating Config..."
# Generate random secrets
MASTER_KEY=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 30 ; echo '')
MQ_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 30 ; echo '')

# Create .env
cat <<EOF > .env
NM_EMAIL=$EMAIL
NM_DOMAIN=$DOMAIN
NM_MASTER_KEY=$MASTER_KEY
MQ_PASSWORD=$MQ_PASSWORD
NM_INSTALL_TYPE=ce
EOF

echo ">>> Starting Netmaker..."
sudo docker compose up -d

echo "----------------------------------------------------"
echo "VPN Hub Setup Complete!"
echo "Dashboard: https://dashboard.$DOMAIN"
echo "Username:  $EMAIL"
echo "Password:  (Log in to set password)"
echo "----------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Log into Netmaker Dashboard."
echo "2. Create a Network (e.g., 'hostmachine-grid')."
echo "3. Create an Access Key."
echo "4. Use that key when deploying Nodes!"
