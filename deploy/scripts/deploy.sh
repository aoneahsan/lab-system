#!/bin/bash
set -e

# LabFlow Production Deployment Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="labflow"
ENVIRONMENT="${1:-production}"
VERSION="${2:-latest}"
REGISTRY="${DOCKER_REGISTRY:-}"

echo -e "${GREEN}Starting deployment of ${APP_NAME} ${VERSION} to ${ENVIRONMENT}${NC}"

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# Check required tools
for cmd in docker git yarn; do
    if ! command_exists "$cmd"; then
        echo -e "${RED}Error: $cmd is not installed${NC}"
        exit 1
    fi
done

# Check if production environment file exists
if [ "$ENVIRONMENT" == "production" ] && [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
yarn test:prod
if [ $? -ne 0 ]; then
    echo -e "${RED}Tests failed. Aborting deployment.${NC}"
    exit 1
fi

# Run linting
echo -e "${YELLOW}Running linting...${NC}"
yarn lint
if [ $? -ne 0 ]; then
    echo -e "${RED}Linting failed. Aborting deployment.${NC}"
    exit 1
fi

# Run type checking
echo -e "${YELLOW}Running type checking...${NC}"
yarn typecheck
if [ $? -ne 0 ]; then
    echo -e "${RED}Type checking failed. Aborting deployment.${NC}"
    exit 1
fi

# Build application
echo -e "${YELLOW}Building application...${NC}"
yarn build:prod
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Aborting deployment.${NC}"
    exit 1
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
if [ -n "$REGISTRY" ]; then
    IMAGE_TAG="${REGISTRY}/${APP_NAME}:${VERSION}"
else
    IMAGE_TAG="${APP_NAME}:${VERSION}"
fi

docker build -t "$IMAGE_TAG" .
if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed. Aborting deployment.${NC}"
    exit 1
fi

# Tag as latest
docker tag "$IMAGE_TAG" "${IMAGE_TAG%:*}:latest"

# Push to registry if specified
if [ -n "$REGISTRY" ]; then
    echo -e "${YELLOW}Pushing to Docker registry...${NC}"
    docker push "$IMAGE_TAG"
    docker push "${IMAGE_TAG%:*}:latest"
fi

# Deploy based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}Deploying to production...${NC}"
    
    # Check if kubectl is available for Kubernetes deployment
    if command_exists kubectl; then
        echo -e "${YELLOW}Deploying to Kubernetes...${NC}"
        kubectl apply -f deploy/kubernetes/deployment.yaml
        kubectl rollout status deployment/labflow-web -n labflow
    else
        echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
        docker-compose -f docker-compose.prod.yml up -d
    fi
elif [ "$ENVIRONMENT" == "staging" ]; then
    echo -e "${YELLOW}Deploying to staging...${NC}"
    docker-compose -f docker-compose.staging.yml up -d
fi

# Post-deployment tasks
echo -e "${YELLOW}Running post-deployment tasks...${NC}"

# Deploy Firebase Functions
if command_exists firebase; then
    echo -e "${YELLOW}Deploying Firebase Functions...${NC}"
    cd functions
    yarn deploy
    cd ..
fi

# Update Firebase security rules
if command_exists firebase; then
    echo -e "${YELLOW}Updating Firebase security rules...${NC}"
    firebase deploy --only firestore:rules,storage:rules
fi

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
sleep 10
if command_exists curl; then
    if [ "$ENVIRONMENT" == "production" ]; then
        HEALTH_URL="https://labflow.example.com/health"
    else
        HEALTH_URL="http://localhost/health"
    fi
    
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}Health check passed${NC}"
    else
        echo -e "${RED}Health check failed${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"

# Display deployment info
echo -e "\n${GREEN}Deployment Summary:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  Version: ${VERSION}"
echo -e "  Image: ${IMAGE_TAG}"
echo -e "  Time: $(date)"

# Create deployment record
mkdir -p deployments
echo "{
  \"environment\": \"${ENVIRONMENT}\",
  \"version\": \"${VERSION}\",
  \"image\": \"${IMAGE_TAG}\",
  \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\",
  \"git_commit\": \"$(git rev-parse HEAD)\",
  \"git_branch\": \"$(git rev-parse --abbrev-ref HEAD)\"
}" > "deployments/$(date +%Y%m%d-%H%M%S)-${ENVIRONMENT}.json"