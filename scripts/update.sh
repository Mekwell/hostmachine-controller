#!/bin/bash
# Auto-Update Script for Hostmachine Stack (Controller + Frontend)
# Usage: sudo ./update.sh

LOG_FILE="/var/log/hostmachine-update.log"
exec >> $LOG_FILE 2>&1

update_repo() {
    local DIR=$1
    local NAME=$2
    local RESTART_CMD=$3

    echo "[$(date)] Checking $NAME at $DIR..."
    
    if [ ! -d "$DIR" ]; then
        echo "Directory $DIR not found. Skipping."
        return
    fi

    cd $DIR || return

    # Fetch latest
    git fetch origin main

    # Compare
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "[$(date)] Update found for $NAME! Pulling..."
        git pull origin main
        
        echo "[$(date)] Installing dependencies..."
        npm install
        
        echo "[$(date)] Building..."
        # If frontend, ensure clean build for styles
        if [ "$NAME" == "Frontend" ]; then
            rm -rf .next
        fi
        npm run build
        
        echo "[$(date)] Restarting Service..."
        $RESTART_CMD
        
        echo "[$(date)] $NAME Updated to $REMOTE"
    else
        echo "[$(date)] $NAME is up to date."
    fi
}

# Update Controller
update_repo "/opt/hostmachine-controller" "Controller" "pm2 restart hm-controller"

# Update Frontend
update_repo "/opt/hostmachine-frontend" "Frontend" "pm2 restart hm-frontend"