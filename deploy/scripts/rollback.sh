#!/bin/bash
set -e

# LabFlow Rollback Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="labflow"
ENVIRONMENT="${1:-production}"
ROLLBACK_VERSION="${2}"

if [ -z "$ROLLBACK_VERSION" ]; then
    echo -e "${RED}Error: Please specify a version to rollback to${NC}"
    echo "Usage: ./rollback.sh [environment] [version]"
    echo "Example: ./rollback.sh production v1.2.3"
    exit 1
fi

echo -e "${YELLOW}Rolling back ${APP_NAME} in ${ENVIRONMENT} to version ${ROLLBACK_VERSION}${NC}"

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if kubectl is available for Kubernetes rollback
if command_exists kubectl; then
    echo -e "${YELLOW}Rolling back Kubernetes deployment...${NC}"
    
    # Check if the deployment exists
    if kubectl get deployment labflow-web -n labflow > /dev/null 2>&1; then
        # Get the revision number for the specified version
        REVISION=$(kubectl rollout history deployment/labflow-web -n labflow | grep "$ROLLBACK_VERSION" | awk '{print $1}')
        
        if [ -n "$REVISION" ]; then
            kubectl rollout undo deployment/labflow-web -n labflow --to-revision="$REVISION"
            kubectl rollout status deployment/labflow-web -n labflow
            echo -e "${GREEN}Kubernetes rollback completed${NC}"
        else
            echo -e "${RED}Version ${ROLLBACK_VERSION} not found in rollout history${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Kubernetes deployment not found${NC}"
    fi
else
    # Docker Compose rollback
    echo -e "${YELLOW}Rolling back with Docker Compose...${NC}"
    
    IMAGE_TAG="${APP_NAME}:${ROLLBACK_VERSION}"
    
    # Check if the image exists
    if docker image inspect "$IMAGE_TAG" > /dev/null 2>&1; then
        # Update docker-compose file to use specific version
        export LABFLOW_VERSION="$ROLLBACK_VERSION"
        docker-compose -f docker-compose.prod.yml up -d
        echo -e "${GREEN}Docker Compose rollback completed${NC}"
    else
        echo -e "${RED}Docker image ${IMAGE_TAG} not found${NC}"
        exit 1
    fi
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
        echo -e "${YELLOW}You may need to investigate and manually fix the deployment${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Rollback completed successfully!${NC}"

# Create rollback record
mkdir -p deployments/rollbacks
echo "{
  \"environment\": \"${ENVIRONMENT}\",
  \"rollback_to_version\": \"${ROLLBACK_VERSION}\",
  \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\",
  \"reason\": \"Manual rollback\"
}" > "deployments/rollbacks/$(date +%Y%m%d-%H%M%S)-${ENVIRONMENT}.json"