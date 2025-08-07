#!/bin/bash

# LabFlow Production Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DEPLOY_BRANCH=${2:-main}

echo -e "${BLUE}🚀 LabFlow Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Branch: ${DEPLOY_BRANCH}${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Firebase CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_NODE="22"
    if [ "${NODE_VERSION%%.*}" -lt "$REQUIRED_NODE" ]; then
        echo -e "${RED}❌ Node.js version $REQUIRED_NODE or higher required. Current: $NODE_VERSION${NC}"
        exit 1
    fi
    
    # Check environment variables
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        echo -e "${RED}❌ Environment file .env.$ENVIRONMENT not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    
    # Run linting
    yarn lint || {
        echo -e "${RED}❌ Linting failed${NC}"
        exit 1
    }
    
    # Run type checking
    yarn typecheck || {
        echo -e "${RED}❌ Type checking failed${NC}"
        exit 1
    }
    
    # Run unit tests
    yarn test:prod || {
        echo -e "${RED}❌ Unit tests failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✓ All tests passed${NC}"
}

# Function to build application
build_application() {
    echo -e "${YELLOW}Building application...${NC}"
    
    # Load environment variables
    set -a
    source .env.$ENVIRONMENT
    set +a
    
    # Build production bundle
    yarn build:prod || {
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    }
    
    # Check bundle size
    node scripts/ci/check-bundle-size.js || {
        echo -e "${RED}❌ Bundle size check failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✓ Build completed successfully${NC}"
}

# Function to deploy web app
deploy_web() {
    echo -e "${YELLOW}Deploying web application...${NC}"
    
    # Deploy to Firebase Hosting
    firebase deploy --only hosting --project $VITE_FIREBASE_PROJECT_ID || {
        echo -e "${RED}❌ Web deployment failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✓ Web application deployed${NC}"
}

# Function to deploy functions
deploy_functions() {
    echo -e "${YELLOW}Deploying Firebase Functions...${NC}"
    
    cd functions
    npm ci
    npm run build
    
    # Deploy functions
    firebase deploy --only functions --project $VITE_FIREBASE_PROJECT_ID || {
        echo -e "${RED}❌ Functions deployment failed${NC}"
        cd ..
        exit 1
    }
    
    cd ..
    echo -e "${GREEN}✓ Functions deployed${NC}"
}

# Function to deploy security rules
deploy_rules() {
    echo -e "${YELLOW}Deploying security rules...${NC}"
    
    # Deploy Firestore rules
    firebase deploy --only firestore:rules --project $VITE_FIREBASE_PROJECT_ID || {
        echo -e "${RED}❌ Firestore rules deployment failed${NC}"
        exit 1
    }
    
    # Deploy Storage rules
    firebase deploy --only storage:rules --project $VITE_FIREBASE_PROJECT_ID || {
        echo -e "${RED}❌ Storage rules deployment failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✓ Security rules deployed${NC}"
}

# Function to run post-deployment checks
post_deployment_checks() {
    echo -e "${YELLOW}Running post-deployment checks...${NC}"
    
    # Check if site is accessible
    SITE_URL="https://$VITE_FIREBASE_PROJECT_ID.web.app"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SITE_URL)
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✓ Site is accessible at $SITE_URL${NC}"
    else
        echo -e "${RED}❌ Site returned HTTP status $HTTP_STATUS${NC}"
        exit 1
    fi
    
    # Run lighthouse check
    if [ "$ENVIRONMENT" = "production" ]; then
        npx lighthouse $SITE_URL --output=json --output-path=./lighthouse-report.json --only-categories=performance,accessibility,best-practices,seo
        echo -e "${GREEN}✓ Lighthouse report generated${NC}"
    fi
}

# Function to create deployment record
create_deployment_record() {
    echo -e "${YELLOW}Creating deployment record...${NC}"
    
    DEPLOYMENT_ID=$(date +%Y%m%d%H%M%S)
    COMMIT_SHA=$(git rev-parse HEAD)
    
    cat > deployments/$DEPLOYMENT_ID.json << EOF
{
  "id": "$DEPLOYMENT_ID",
  "environment": "$ENVIRONMENT",
  "branch": "$DEPLOY_BRANCH",
  "commit": "$COMMIT_SHA",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "$(git config user.name)",
  "status": "success"
}
EOF
    
    echo -e "${GREEN}✓ Deployment record created: $DEPLOYMENT_ID${NC}"
}

# Function to notify deployment
notify_deployment() {
    echo -e "${YELLOW}Sending deployment notification...${NC}"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 LabFlow deployed to $ENVIRONMENT\nBranch: $DEPLOY_BRANCH\nCommit: $(git rev-parse --short HEAD)\nDeployer: $(git config user.name)\"}" \
            $SLACK_WEBHOOK
        
        echo -e "${GREEN}✓ Notification sent${NC}"
    fi
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    echo ""
    
    # Create deployments directory
    mkdir -p deployments
    
    # Check prerequisites
    check_prerequisites
    
    # Checkout correct branch
    echo -e "${YELLOW}Checking out $DEPLOY_BRANCH branch...${NC}"
    git checkout $DEPLOY_BRANCH
    git pull origin $DEPLOY_BRANCH
    
    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    yarn install --frozen-lockfile
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy components
    deploy_web
    deploy_functions
    deploy_rules
    
    # Post-deployment checks
    post_deployment_checks
    
    # Create deployment record
    create_deployment_record
    
    # Send notification
    notify_deployment
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}Site URL: https://$VITE_FIREBASE_PROJECT_ID.web.app${NC}"
}

# Run main function
main