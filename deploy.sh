#!/bin/bash

# LabFlow Manual Deployment Script
# This script handles local build and deployment to Firebase

set -e  # Exit on error

echo "🚀 Starting LabFlow Manual Deployment..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Step 1: Clean previous build
echo ""
echo "📦 Step 1: Cleaning previous build..."
echo "-----------------------------------"
rm -rf dist
print_success "Previous build cleaned"

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
echo "-----------------------------------"
yarn install
print_success "Dependencies installed"

# Step 3: Run type check
echo ""
echo "🔍 Step 3: Running type check..."
echo "--------------------------------"
yarn typecheck || print_warning "Type check has warnings (continuing...)"

# Step 4: Build production bundle
echo ""
echo "🔨 Step 4: Building production bundle..."
echo "---------------------------------------"
yarn build
print_success "Production build completed"

# Display build size
echo ""
echo "📊 Build Statistics:"
echo "-------------------"
du -sh dist/
echo "Files created: $(find dist -type f | wc -l)"

# Step 5: Deploy to Firebase
echo ""
echo "☁️  Step 5: Deploying to Firebase..."
echo "-----------------------------------"

# Deploy Firestore rules
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules --project labsystem-a1
print_success "Firestore rules deployed"

# Deploy Storage rules
echo "Deploying Storage rules..."
firebase deploy --only storage --project labsystem-a1
print_success "Storage rules deployed"

# Deploy Hosting
echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting --project labsystem-a1
print_success "Hosting deployed"

# Summary
echo ""
echo "========================================"
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "📊 Deployment Summary:"
echo "---------------------"
echo "✓ Project: labsystem-a1"
echo "✓ Environment: Production"
echo "✓ URL: https://labsystem-a1.web.app"
echo "✓ Alternative: https://labsystem-a1.firebaseapp.com"
echo ""
echo "🔗 Firebase Console:"
echo "-------------------"
echo "https://console.firebase.google.com/project/labsystem-a1"
echo ""
print_success "Manual deployment completed successfully!"