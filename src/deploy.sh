#!/bin/bash

# GACE Netlify Deployment Script
# This script helps deploy your GACE application to Netlify

set -e  # Exit on error

echo "🚀 GACE Netlify Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}⚠️  Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

echo -e "${CYAN}Step 1: Running production build...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors and try again.${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}Step 2: Checking Netlify authentication...${NC}"
netlify status || netlify login

echo ""
echo -e "${CYAN}Step 3: Deploying to Netlify...${NC}"
echo -e "${YELLOW}Choose deployment type:${NC}"
echo "1) Production deploy"
echo "2) Draft deploy (preview)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo -e "${CYAN}Deploying to production...${NC}"
        netlify deploy --prod
        ;;
    2)
        echo -e "${CYAN}Creating draft deploy...${NC}"
        netlify deploy
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Test your deployed site"
    echo "2. Seed demo data (see NETLIFY_DEPLOYMENT_CHECKLIST.md)"
    echo "3. Test login with demo accounts (demo.expat@gace.demo / Demo123!)"
    echo "4. Verify product tour works"
    echo ""
    echo -e "${GREEN}Your site is live! 🚀${NC}"
else
    echo -e "${RED}❌ Deployment failed. Check logs above.${NC}"
    exit 1
fi
