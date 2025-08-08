#!/bin/bash

# LabFlow Development Setup Script
# This script sets up the development environment

set -e  # Exit on error

echo "🔧 Setting up LabFlow Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed!${NC}"
    echo "Please install Node.js 24 or higher from https://nodejs.org/"
    exit 1
fi

# Check Yarn
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}Yarn is not installed. Installing...${NC}"
    npm install -g yarn
fi

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI is not installed. Installing...${NC}"
    npm install -g firebase-tools
fi

# Create environment file
if [ ! -f ".env.local" ]; then
    echo -e "${BLUE}📄 Creating .env.local from template...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}Please update .env.local with your Firebase configuration${NC}"
fi

# Install dependencies
echo "📦 Installing project dependencies..."
yarn install

# Install functions dependencies
echo "⚡ Installing Firebase functions dependencies..."
cd functions
yarn install
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p src/test/coverage
mkdir -p dist
mkdir -p docs

# Initialize git hooks
echo "🆔 Setting up git hooks..."
if [ -d ".git" ]; then
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
yarn lint || {
    echo "Linting failed. Please fix errors before committing."
    exit 1
}
yarn typecheck || {
    echo "Type checking failed. Please fix errors before committing."
    exit 1
}
EOF
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}Git hooks installed${NC}"
fi

# Check Firebase configuration
echo "🔥 Checking Firebase configuration..."
if command -v firebase &> /dev/null; then
    firebase projects:list &> /dev/null || {
        echo -e "${YELLOW}Firebase not authenticated. Run: firebase login${NC}"
    }
fi

# Setup complete
echo -e "\n${GREEN}✨ Development environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your Firebase configuration"
echo "  2. Run 'firebase login' if not already authenticated"
echo "  3. Start development server: yarn dev"
echo "  4. (Optional) Start Firebase emulators: yarn emulators"
echo ""
echo "Useful commands:"
echo "  yarn dev          - Start development server"
echo "  yarn build        - Build for production"
echo "  yarn lint         - Run linters"
echo "  yarn typecheck    - Run type checking"
echo "  yarn preview      - Preview production build"