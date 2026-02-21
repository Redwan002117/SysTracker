#!/bin/bash

# SysTracker Dashboard Deployment Script
# Builds the Next.js dashboard and deploys to server directory

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SysTracker Dashboard Deployment    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"
SERVER_DIR="$PROJECT_ROOT/server"
DEPLOY_DIR="$SERVER_DIR/dashboard-dist"

# Check if dashboard directory exists
if [ ! -d "$DASHBOARD_DIR" ]; then
    echo -e "${RED}❌ Dashboard directory not found: $DASHBOARD_DIR${NC}"
    exit 1
fi

# Check if server directory exists
if [ ! -d "$SERVER_DIR" ]; then
    echo -e "${RED}❌ Server directory not found: $SERVER_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}📂 Project directories:${NC}"
echo "   Dashboard: $DASHBOARD_DIR"
echo "   Server:    $SERVER_DIR"
echo "   Deploy to: $DEPLOY_DIR"
echo ""

# Step 1: Build the dashboard
echo -e "${BLUE}🔨 Step 1: Building dashboard...${NC}"
cd "$DASHBOARD_DIR"

if ! npm run build; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Step 2: Deploy to server
echo -e "${BLUE}🚀 Step 2: Deploying to server...${NC}"

# Create deploy directory if it doesn't exist
mkdir -p "$DEPLOY_DIR"

# Clear old deployment
echo "   Cleaning old files..."
rm -rf "$DEPLOY_DIR"/*

# Copy new build
echo "   Copying new build..."
cp -r "$DASHBOARD_DIR/out/"* "$DEPLOY_DIR/"

echo -e "${GREEN}✓ Deployment completed successfully${NC}"
echo ""

# Step 3: Verify deployment
echo -e "${BLUE}📊 Step 3: Verifying deployment...${NC}"
FILE_COUNT=$(find "$DEPLOY_DIR" -type f | wc -l)
DIR_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)

echo "   Files deployed: $FILE_COUNT"
echo "   Total size:     $DIR_SIZE"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Deployment Successful!           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Restart the SysTracker server to use the new build"
echo "   2. Access the dashboard at http://localhost:3001"
echo ""
