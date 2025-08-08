#!/bin/bash

# LabFlow Production Build Script
# This script builds the application for production deployment

set -e  # Exit on error

echo "🚀 Starting LabFlow Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
REQUIRED_NODE_VERSION="24"
CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    echo -e "${RED}Error: Node.js version $REQUIRED_NODE_VERSION or higher is required${NC}"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf functions/lib

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Run linting
echo "🔍 Running linters..."
yarn lint || {
    echo -e "${RED}Linting failed! Please fix errors before building.${NC}"
    exit 1
}

# Run type checking
echo "📝 Running type checks..."
yarn typecheck || {
    echo -e "${RED}Type checking failed! Please fix errors before building.${NC}"
    exit 1
}

# Build the application
echo "🏗️  Building application..."
yarn build || {
    echo -e "${RED}Build failed!${NC}"
    exit 1
}

# Build Firebase functions
echo "⚡ Building Firebase functions..."
cd functions
yarn install --frozen-lockfile
yarn build || {
    echo -e "${RED}Functions build failed!${NC}"
    exit 1
}
cd ..

# Generate bundle size report
echo "📊 Generating bundle size report..."
if [ -f "dist/stats.html" ]; then
    echo -e "${GREEN}Bundle size report generated at dist/stats.html${NC}"
fi

# Check build output
echo "✅ Checking build output..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "${GREEN}Build completed successfully!${NC}"
    
    # Display build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo -e "📦 Build size: ${YELLOW}$BUILD_SIZE${NC}"
    
    # Count files
    FILE_COUNT=$(find dist -type f | wc -l)
    echo -e "📄 Total files: ${YELLOW}$FILE_COUNT${NC}"
else
    echo -e "${RED}Build verification failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✨ Production build completed successfully!${NC}"
echo "Next steps:"
echo "  1. Test the build locally: yarn preview"
echo "  2. Deploy to Firebase: firebase deploy"
echo "  3. Run E2E tests: yarn cypress:run"