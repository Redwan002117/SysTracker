#!/bin/bash

# Exit on error
set -e

echo -e "\033[0;36mUpdating SysTracker Portfolio...\033[0m"

# 1. Pull latest changes
echo -e "\033[0;33mPulling latest code...\033[0m"
git pull

# 2. Rebuild and restart container
echo -e "\033[0;33mBuilding and restarting Docker container...\033[0m"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo -e "\033[0;32mUpdate complete! Portfolio is running on port 80 (mapped to host).\033[0m"
