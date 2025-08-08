#!/bin/bash

# LabFlow Mobile App Build Script
# Builds iOS and Android apps using Capacitor

set -e  # Exit on error

echo "📱 LabFlow Mobile Build Script"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
PLATFORM=${1:-both}
BUILD_TYPE=${2:-debug}

echo "Platform: $PLATFORM"
echo "Build Type: $BUILD_TYPE"

# Validate platform
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "both" ]]; then
    echo -e "${RED}Invalid platform: $PLATFORM${NC}"
    echo "Usage: ./build-mobile.sh [ios|android|both] [debug|release]"
    exit 1
fi

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check if Capacitor is installed
if ! command -v cap &> /dev/null; then
    echo -e "${YELLOW}Capacitor CLI not found. Installing...${NC}"
    yarn global add @capacitor/cli
fi

# Build web assets first
echo -e "${BLUE}🏗️  Building web assets...${NC}"
yarn build || {
    echo -e "${RED}Web build failed!${NC}"
    exit 1
}

# Sync with Capacitor
echo -e "${BLUE}🔄 Syncing with Capacitor...${NC}"
yarn cap:sync || {
    echo -e "${RED}Capacitor sync failed!${NC}"
    exit 1
}

# Function to build iOS
build_ios() {
    echo -e "${BLUE}🍎 Building iOS app...${NC}"
    
    # Check for Xcode
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}Xcode is not installed! iOS build requires Xcode.${NC}"
        return 1
    fi
    
    # Open in Xcode for manual build
    if [ "$BUILD_TYPE" == "release" ]; then
        echo -e "${YELLOW}Opening Xcode for release build...${NC}"
        echo "Please build the app manually in Xcode for release."
        yarn cap:open:ios
    else
        # Build debug version
        cd ios/App
        xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 15' build || {
            echo -e "${RED}iOS build failed!${NC}"
            cd ../..
            return 1
        }
        cd ../..
        echo -e "${GREEN}✅ iOS debug build completed${NC}"
    fi
}

# Function to build Android
build_android() {
    echo -e "${BLUE}🤖 Building Android app...${NC}"
    
    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${RED}ANDROID_HOME is not set! Android build requires Android SDK.${NC}"
        return 1
    fi
    
    cd android
    
    if [ "$BUILD_TYPE" == "release" ]; then
        # Build release APK
        ./gradlew assembleRelease || {
            echo -e "${RED}Android release build failed!${NC}"
            cd ..
            return 1
        }
        
        # Find and display APK location
        APK_PATH=$(find . -name "*-release.apk" | head -n 1)
        if [ -n "$APK_PATH" ]; then
            echo -e "${GREEN}✅ Android release APK built: $APK_PATH${NC}"
            
            # Copy to project root
            cp "$APK_PATH" ../labflow-release.apk
            echo -e "${GREEN}APK copied to: labflow-release.apk${NC}"
        fi
    else
        # Build debug APK
        ./gradlew assembleDebug || {
            echo -e "${RED}Android debug build failed!${NC}"
            cd ..
            return 1
        }
        
        # Find and display APK location
        APK_PATH=$(find . -name "*-debug.apk" | head -n 1)
        if [ -n "$APK_PATH" ]; then
            echo -e "${GREEN}✅ Android debug APK built: $APK_PATH${NC}"
        fi
    fi
    
    cd ..
}

# Main build process
echo -e "${BLUE}🚀 Starting mobile build process...${NC}"

# Build based on platform selection
if [ "$PLATFORM" == "ios" ] || [ "$PLATFORM" == "both" ]; then
    build_ios
fi

if [ "$PLATFORM" == "android" ] || [ "$PLATFORM" == "both" ]; then
    build_android
fi

# Success message
echo -e "\n${GREEN}✨ Mobile build completed!${NC}"
echo ""
echo "Next steps:"
if [ "$PLATFORM" == "ios" ] || [ "$PLATFORM" == "both" ]; then
    echo "  iOS: Run the app in Xcode or deploy to TestFlight"
fi
if [ "$PLATFORM" == "android" ] || [ "$PLATFORM" == "both" ]; then
    echo "  Android: Install the APK or upload to Google Play Console"
fi
echo ""
echo "Testing commands:"
echo "  yarn cap:run:ios     - Run on iOS simulator"
echo "  yarn cap:run:android - Run on Android emulator"