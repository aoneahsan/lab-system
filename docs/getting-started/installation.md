# Installation Guide

This guide will walk you through the process of installing LabFlow on your system.

## Prerequisites

Before installing LabFlow, ensure you have the following prerequisites:

### System Requirements

- **Operating System**: macOS, Linux, or Windows 10+
- **Node.js**: Version 22.x or higher
- **Yarn**: Latest version
- **Git**: Version 2.x or higher
- **Firebase CLI**: Latest version
- **Docker** (optional): For containerized deployment

### Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/labflow/labflow.git
cd labflow
```

### 2. Install Dependencies

```bash
# Install project dependencies
yarn install

# Install Firebase CLI globally
npm install -g firebase-tools

# Install functions dependencies
cd functions
yarn install
cd ..
```

### 3. Environment Configuration

Create environment files for your setup:

```bash
# Copy example environment file
cp .env.example .env

# Edit the .env file with your Firebase configuration
nano .env
```

Required environment variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_FIREBASE_DATABASE_URL=your-database-url

# Optional: Sentry for error tracking
VITE_SENTRY_DSN=your-sentry-dsn

# Environment
VITE_ENVIRONMENT=development
```

### 4. Firebase Setup

#### Initialize Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init

# Select the following features:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators
```

#### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

#### Create Composite Indexes

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 5. Database Initialization

Run the initialization script to set up the database structure:

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, run initialization
yarn setup:db
```

### 6. Build the Application

```bash
# Development build
yarn dev

# Production build
yarn build
```

### 7. Mobile App Setup (Optional)

If you're developing mobile apps:

```bash
# Install Capacitor dependencies
yarn cap:sync

# iOS setup
cd ios/App
pod install
cd ../..

# Android setup
# Open Android Studio and sync project
```

## Verification

After installation, verify everything is working:

```bash
# Run tests
yarn test

# Start development server
yarn dev

# Check linting
yarn lint

# Type checking
yarn typecheck
```

Visit http://localhost:5173 to see the application running.

## Docker Installation (Alternative)

For a containerized setup:

```bash
# Build Docker image
docker build -t labflow:latest .

# Run with Docker Compose
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Node Version Error**
   ```bash
   # Use nvm to install correct Node version
   nvm install 22
   nvm use 22
   ```

2. **Firebase Authentication Error**
   - Ensure Firebase project is properly configured
   - Check API keys in .env file
   - Verify Firebase project permissions

3. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules
   yarn cache clean
   yarn install
   ```

4. **Port Already in Use**
   ```bash
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

## Next Steps

- [Configuration Guide](./configuration.md)
- [Quick Start Tutorial](./quick-start.md)
- [Development Setup](../development/setup.md)