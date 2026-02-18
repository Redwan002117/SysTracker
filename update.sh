#!/bin/bash
set -e

echo -e "\033[0;36mUpdating SysTracker (Dashboard & Server)...\033[0m"

# 1. Pull
echo -e "\033[0;33m1. Pulling latest code...\033[0m"
git pull

# 2. Server
echo -e "\033[0;33m2. Updating Server dependencies...\033[0m"
cd server
npm install
cd ..

# 3. Dashboard
echo -e "\033[0;33m3. Building Dashboard...\033[0m"
cd dashboard
npm install
npm run build
cd ..

echo -e "\033[0;32mUpdate complete!\033[0m"
echo "Please restart your node server (node server/server.js) to apply changes."
