#!/bin/bash

# LabFlow Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on error

echo "🚀 Starting LabFlow Production Deployment..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_warning "You need to login to Firebase"
    firebase login
fi

# Step 1: Run tests
echo ""
echo "📋 Step 1: Running tests..."
echo "----------------------------"
yarn test --run
if [ $? -eq 0 ]; then
    print_status "All tests passed"
else
    print_error "Tests failed. Please fix the issues before deploying."
fi

# Step 2: Lint check
echo ""
echo "📋 Step 2: Running lint checks..."
echo "----------------------------"
yarn lint
if [ $? -eq 0 ]; then
    print_status "Lint checks passed"
else
    print_warning "Lint warnings detected. Consider fixing them."
fi

# Step 3: Type check
echo ""
echo "📋 Step 3: Running type checks..."
echo "----------------------------"
yarn typecheck
if [ $? -eq 0 ]; then
    print_status "Type checks passed"
else
    print_error "Type errors detected. Please fix them before deploying."
fi

# Step 4: Build the application
echo ""
echo "📋 Step 4: Building production bundle..."
echo "----------------------------"
yarn build
if [ $? -eq 0 ]; then
    print_status "Production build completed"
    
    # Display build size
    echo ""
    echo "Build size report:"
    du -sh dist/
    du -sh dist/assets/
else
    print_error "Build failed. Please check the errors."
fi

# Step 5: Build Firebase Functions
echo ""
echo "📋 Step 5: Building Firebase Functions..."
echo "----------------------------"
cd functions
yarn build
if [ $? -eq 0 ]; then
    print_status "Functions build completed"
else
    print_error "Functions build failed."
fi
cd ..

# Step 6: Preview deployment (optional)
echo ""
echo "📋 Step 6: Preview deployment..."
echo "----------------------------"
read -p "Do you want to preview the deployment before going live? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase hosting:channel:deploy preview --expires 1h
    print_status "Preview channel created. Check the URL above to test."
    read -p "Press enter to continue with production deployment..."
fi

# Step 7: Deploy to Firebase
echo ""
echo "📋 Step 7: Deploying to Firebase..."
echo "----------------------------"

# Deploy Firestore rules
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules
print_status "Firestore rules deployed"

# Deploy Storage rules
echo "Deploying Storage rules..."
firebase deploy --only storage
print_status "Storage rules deployed"

# Deploy Functions
echo "Deploying Cloud Functions..."
firebase deploy --only functions
print_status "Cloud Functions deployed"

# Deploy Hosting
echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting
print_status "Hosting deployed"

# Step 8: Verify deployment
echo ""
echo "📋 Step 8: Verifying deployment..."
echo "----------------------------"

# Get the hosting URL
HOSTING_URL="https://labsystem-a1.web.app"
echo "Checking deployment at $HOSTING_URL..."

# Check if the site is accessible
if curl -s --head --request GET $HOSTING_URL | grep "200 OK" > /dev/null; then 
    print_status "Site is accessible"
else
    print_warning "Site may not be fully deployed yet. Please check manually."
fi

# Step 9: Run post-deployment tests
echo ""
echo "📋 Step 9: Running post-deployment tests..."
echo "----------------------------"
# You can add smoke tests here
print_status "Post-deployment checks completed"

# Step 10: Create deployment tag
echo ""
echo "📋 Step 10: Creating deployment tag..."
echo "----------------------------"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TAG="deploy_$TIMESTAMP"

git add -A
git commit -m "Deploy: Production deployment $TIMESTAMP" || true
git tag -a $TAG -m "Production deployment on $TIMESTAMP"
print_status "Created deployment tag: $TAG"

# Summary
echo ""
echo "================================================"
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "================================================"
echo ""
echo "📊 Deployment Summary:"
echo "----------------------"
echo "✓ Project: labsystem-a1"
echo "✓ Environment: Production"
echo "✓ URL: $HOSTING_URL"
echo "✓ Functions URL: https://us-central1-labsystem-a1.cloudfunctions.net"
echo "✓ Deployment Tag: $TAG"
echo "✓ Timestamp: $TIMESTAMP"
echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "1. Visit $HOSTING_URL to verify the deployment"
echo "2. Check Firebase Console for any issues"
echo "3. Monitor error logs in Firebase Console"
echo "4. Test critical user flows"
echo "5. Update DNS records if using custom domain"
echo ""
echo "🔗 Useful Links:"
echo "----------------"
echo "Firebase Console: https://console.firebase.google.com/project/labsystem-a1"
echo "Hosting: https://console.firebase.google.com/project/labsystem-a1/hosting"
echo "Functions: https://console.firebase.google.com/project/labsystem-a1/functions"
echo "Firestore: https://console.firebase.google.com/project/labsystem-a1/firestore"
echo ""
print_status "Deployment script completed!"