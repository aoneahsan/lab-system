#!/bin/bash

# Prepare Mobile Release Script
# This script prepares Android and iOS apps for release

set -e

echo "🚀 Preparing mobile release..."

# Check required environment variables
if [ -z "$RELEASE_VERSION" ]; then
  echo "❌ RELEASE_VERSION not set"
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to update version
update_version() {
  local platform=$1
  local version=$2
  
  echo -e "${YELLOW}Updating ${platform} version to ${version}...${NC}"
  
  if [ "$platform" = "android" ]; then
    # Update Android version
    sed -i '' "s/versionName \".*\"/versionName \"$version\"/" android/app/build.gradle
    
    # Increment version code
    current_code=$(grep versionCode android/app/build.gradle | sed 's/[^0-9]*//g')
    new_code=$((current_code + 1))
    sed -i '' "s/versionCode .*/versionCode $new_code/" android/app/build.gradle
    
    echo -e "${GREEN}✓ Android version updated to $version (code: $new_code)${NC}"
    
  elif [ "$platform" = "ios" ]; then
    # Update iOS version
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $version" ios/App/App/Info.plist
    
    # Increment build number
    current_build=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist)
    new_build=$((current_build + 1))
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $new_build" ios/App/App/Info.plist
    
    echo -e "${GREEN}✓ iOS version updated to $version (build: $new_build)${NC}"
  fi
}

# Function to generate changelog
generate_changelog() {
  echo -e "${YELLOW}Generating mobile changelog...${NC}"
  
  # Create whatsnew directory for Play Store
  mkdir -p whatsnew/en-US
  
  # Generate changelog from git commits
  git log --pretty=format:"• %s" $(git describe --tags --abbrev=0)..HEAD > whatsnew/en-US/default.txt
  
  # Create fastlane metadata
  mkdir -p fastlane/metadata/en-US
  cp whatsnew/en-US/default.txt fastlane/metadata/en-US/release_notes.txt
  
  echo -e "${GREEN}✓ Changelog generated${NC}"
}

# Function to build Android release
build_android() {
  echo -e "${YELLOW}Building Android release APK...${NC}"
  
  cd android
  
  # Clean build
  ./gradlew clean
  
  # Build release APK
  ./gradlew assembleRelease
  
  # Build AAB for Play Store
  ./gradlew bundleRelease
  
  cd ..
  
  echo -e "${GREEN}✓ Android build complete${NC}"
  echo "APK: android/app/build/outputs/apk/release/app-release.apk"
  echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
}

# Function to build iOS release
build_ios() {
  echo -e "${YELLOW}Building iOS release...${NC}"
  
  cd ios/App
  
  # Install pods
  pod install
  
  # Build archive
  xcodebuild -workspace App.xcworkspace \
             -scheme App \
             -configuration Release \
             -archivePath build/LabFlow.xcarchive \
             archive
  
  # Export IPA
  xcodebuild -exportArchive \
             -archivePath build/LabFlow.xcarchive \
             -exportPath build \
             -exportOptionsPlist ExportOptions.plist
  
  cd ../..
  
  echo -e "${GREEN}✓ iOS build complete${NC}"
  echo "IPA: ios/App/build/LabFlow.ipa"
}

# Function to create release notes
create_release_notes() {
  echo -e "${YELLOW}Creating release notes...${NC}"
  
  cat > RELEASE_NOTES.md << EOF
# LabFlow Mobile Release v${RELEASE_VERSION}

## What's New

$(git log --pretty=format:"- %s" $(git describe --tags --abbrev=0)..HEAD)

## Features
- Multi-tenant laboratory management
- Offline support with automatic sync
- Biometric authentication
- Barcode/QR code scanning
- Real-time notifications
- HIPAA compliant

## Improvements
- Enhanced performance
- Better offline experience
- Improved UI/UX
- Bug fixes and stability improvements

## Requirements
- Android: 6.0 (API 23) or higher
- iOS: 13.0 or higher

EOF
  
  echo -e "${GREEN}✓ Release notes created${NC}"
}

# Main execution
echo "📱 Mobile Release Preparation for v${RELEASE_VERSION}"
echo "================================================"

# Update versions
update_version "android" "$RELEASE_VERSION"
update_version "ios" "$RELEASE_VERSION"

# Sync Capacitor
echo -e "${YELLOW}Syncing Capacitor...${NC}"
npx cap sync
echo -e "${GREEN}✓ Capacitor synced${NC}"

# Generate changelog
generate_changelog

# Create release notes
create_release_notes

# Build apps if requested
if [ "$BUILD_APPS" = "true" ]; then
  build_android
  build_ios
fi

# Create screenshots directory
mkdir -p screenshots/{android,ios}/{phone,tablet}

echo ""
echo -e "${GREEN}✅ Mobile release preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test the apps thoroughly"
echo "2. Take screenshots for app stores"
echo "3. Update app store listings"
echo "4. Submit for review"
echo ""
echo "Release artifacts:"
echo "- Android APK: android/app/build/outputs/apk/release/"
echo "- Android AAB: android/app/build/outputs/bundle/release/"
echo "- iOS IPA: ios/App/build/"
echo "- Release notes: RELEASE_NOTES.md"