---
sidebar_position: 2
---

# Installation Guide

Comprehensive installation instructions for LabFlow across all platforms.

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB available space
- **OS**: 
  - Windows 10/11 (64-bit)
  - macOS 11.0 or later
  - Ubuntu 20.04 LTS or later

### Recommended Requirements

- **CPU**: 4 cores, 3.0 GHz
- **RAM**: 8 GB or more
- **Storage**: 50 GB SSD
- **Network**: Stable broadband connection

## Development Environment Setup

### 1. Install Node.js

LabFlow requires Node.js v22 or higher.

**Using Node Version Manager (Recommended)**

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 22
nvm use 22
```

**Direct Installation**
- Download from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version`

### 2. Install Yarn

```bash
# Install yarn globally
npm install -g yarn

# Verify installation
yarn --version
```

### 3. Install Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

### 4. Install Git

- **Windows**: Download from [git-scm.com](https://git-scm.com/)
- **macOS**: `brew install git`
- **Linux**: `sudo apt-get install git`

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name (e.g., "labflow-production")
4. Enable Google Analytics (optional)
5. Wait for project creation

### 2. Enable Firebase Services

Navigate to your Firebase project and enable:

#### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. (Optional) Enable **Multi-factor authentication**

#### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode**
4. Select your region (choose closest to users)

#### Storage
1. Go to **Storage**
2. Click **Get started**
3. Keep default security rules for now
4. Select your storage location

#### Functions
1. Go to **Functions**
2. Click **Get started**
3. Upgrade to Blaze plan (Pay as you go)
4. Continue with setup

### 3. Generate Firebase Configuration

1. Go to **Project settings** → **General**
2. Scroll to **Your apps** → **Web app**
3. Click **Add app** → **Web**
4. Register app with nickname "LabFlow Web"
5. Copy the configuration object

## LabFlow Installation

### 1. Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/labflow/labflow.git

# Or clone via SSH
git clone git@github.com:labflow/labflow.git

cd labflow
```

### 2. Environment Configuration

Create `.env` file in project root:

```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Configuration
VITE_APP_NAME=LabFlow
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_BIOMETRIC_AUTH=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_MOBILE_APPS=true

# API Configuration
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760

# Emulator Configuration (Development)
VITE_USE_FIREBASE_EMULATOR=false
VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
VITE_FIREBASE_FIRESTORE_EMULATOR_URL=http://localhost:8080
VITE_FIREBASE_FUNCTIONS_EMULATOR_URL=http://localhost:5001
VITE_FIREBASE_STORAGE_EMULATOR_URL=http://localhost:9199
```

### 3. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install Firebase Functions dependencies
cd functions
yarn install
cd ..

# Install documentation dependencies
cd docs-site
yarn install
cd ..
```

### 4. Firebase Configuration

```bash
# Initialize Firebase in the project
firebase init

# Select the following:
# ✓ Firestore
# ✓ Functions
# ✓ Storage
# ✓ Emulators
# ✓ Hosting

# Use existing project and select your Firebase project
# Accept default options for most prompts
```

### 5. Deploy Firebase Resources

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Functions
cd functions
yarn build
cd ..
firebase deploy --only functions
```

## Database Initialization

### 1. Create Initial Collections

Run the initialization script:

```bash
yarn run init:db
```

This creates:
- System configuration collection
- Default test catalog
- Initial user roles
- Sample data (development only)

### 2. Create Admin User

1. Start the development server: `yarn dev`
2. Navigate to `http://localhost:5173`
3. Click "Initialize System"
4. Create admin account:
   - Email: admin@yourdomain.com
   - Password: (secure password)
   - Lab Name: Your Laboratory Name
   - Address: Your lab address

## Mobile App Setup

### iOS Setup

1. **Install Xcode** from Mac App Store
2. **Install CocoaPods**:
   ```bash
   sudo gem install cocoapods
   ```
3. **Add iOS platform**:
   ```bash
   npx cap add ios
   yarn cap:sync:ios
   ```
4. **Open in Xcode**:
   ```bash
   yarn cap:open:ios
   ```
5. **Configure signing** in Xcode

### Android Setup

1. **Install Android Studio**
2. **Install Android SDK** (via Android Studio)
3. **Set environment variables**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
4. **Add Android platform**:
   ```bash
   npx cap add android
   yarn cap:sync:android
   ```
5. **Open in Android Studio**:
   ```bash
   yarn cap:open:android
   ```

## Chrome Extension Installation

### Development Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder from the project
5. The extension icon should appear in your toolbar

### Production Build

```bash
cd extension
yarn build
# Creates extension.zip for Chrome Web Store submission
```

## Production Deployment

### 1. Build Application

```bash
# Build web application
yarn build

# Build Firebase Functions
cd functions
yarn build
cd ..
```

### 2. Configure Production Environment

Update `.env.production`:

```env
VITE_APP_ENV=production
VITE_USE_FIREBASE_EMULATOR=false
# ... other production settings
```

### 3. Deploy to Firebase Hosting

```bash
# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only storage
```

### 4. Configure Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow verification steps
4. Update DNS records

## Docker Installation (Optional)

### 1. Create Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 8080
CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "8080"]
```

### 2. Build and Run

```bash
# Build image
docker build -t labflow:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  --env-file .env.production \
  --name labflow \
  labflow:latest
```

## Verification

### 1. Check Web Application

- Navigate to `http://localhost:5173` (development)
- Or your production URL
- Login with admin credentials
- Verify all modules load correctly

### 2. Check Firebase Functions

```bash
# List deployed functions
firebase functions:list

# Check function logs
firebase functions:log
```

### 3. Check Mobile Apps

- Build and run on simulators/devices
- Test core functionality
- Verify offline mode works

### 4. Check Chrome Extension

- Verify extension loads in Chrome
- Test EMR integration features
- Check permissions are correct

## Troubleshooting

### Firebase Errors

**"Permission denied" errors**
- Check Firestore security rules
- Ensure user is authenticated
- Verify user roles are set correctly

**"Function not found" errors**
- Redeploy functions: `firebase deploy --only functions`
- Check function logs for errors
- Verify environment variables

### Build Errors

**"Module not found" errors**
```bash
rm -rf node_modules
rm yarn.lock
yarn install
```

**TypeScript errors**
```bash
yarn typecheck
# Fix any type errors shown
```

### Mobile App Issues

**iOS build fails**
- Update Xcode to latest version
- Clean build folder: Cmd+Shift+K in Xcode
- Reset Capacitor: `npx cap sync ios`

**Android build fails**
- Sync project in Android Studio
- Clean project: Build → Clean Project
- Invalidate caches: File → Invalidate Caches

## Support

Need help with installation?

- 📧 **Email**: support@labflow.app
- 💬 **Discord**: [discord.gg/labflow](https://discord.gg/labflow)
- 📚 **Docs**: [docs.labflow.app](https://docs.labflow.app)
- 🐛 **Issues**: [GitHub Issues](https://github.com/labflow/labflow/issues)