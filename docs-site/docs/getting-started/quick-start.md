---
sidebar_position: 1
---

# Quick Start Guide

Get LabFlow up and running in your environment in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v22 or higher)
- **npm** or **yarn** (we recommend yarn)
- **Git**
- **Firebase CLI** (for backend deployment)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/labflow/labflow.git
cd labflow
```

### 2. Install Dependencies

```bash
# Install main project dependencies
yarn install

# Install Firebase Functions dependencies
cd functions
yarn install
cd ..

# Install documentation site dependencies (optional)
cd docs-site
yarn install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Application Settings
VITE_APP_NAME=LabFlow
VITE_APP_ENV=development
VITE_USE_FIREBASE_EMULATOR=false

# Tenant Configuration
VITE_DEFAULT_TENANT_ID=default
```

### 4. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Functions

3. Initialize Firebase in your project:

```bash
firebase init
```

Select:
- Firestore
- Functions
- Storage
- Emulators (for local development)

### 5. Database Setup

Deploy Firestore security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Start Development Server

```bash
# Start the web application
yarn dev

# In another terminal, start Firebase emulators (optional)
firebase emulators:start

# In another terminal, start Firebase Functions locally
cd functions
yarn serve
```

## 🎯 First Steps

### 1. Access the Application

Open your browser and navigate to: `http://localhost:5173`

### 2. Create Admin Account

On first run, you'll be prompted to create an admin account:

1. Click "Create Admin Account"
2. Enter your details
3. Configure your laboratory settings

### 3. Configure Your Lab

Navigate to **Settings** to configure:

- **General Settings**: Lab name, address, contact info
- **Billing Settings**: Tax rates, payment methods
- **Test Catalog**: Add your laboratory tests
- **User Roles**: Configure permissions

### 4. Add Your First Patient

1. Go to **Patients** → **Add Patient**
2. Fill in patient demographics
3. Add insurance information (optional)
4. Save the patient record

### 5. Create a Test Order

1. From the patient record, click **New Order**
2. Select tests from your catalog
3. Add clinical notes
4. Submit the order

## 📱 Mobile App Setup

### Build for Mobile Platforms

```bash
# Add mobile platforms
npx cap add ios
npx cap add android

# Sync web app with native projects
yarn cap:sync

# Open in native IDEs
yarn cap:open:ios    # Opens Xcode
yarn cap:open:android # Opens Android Studio
```

## 🔌 Chrome Extension Setup

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder from the project

## 🏃‍♂️ Running in Production

### Build for Production

```bash
# Build web application
yarn build

# Build Firebase Functions
cd functions
yarn build
cd ..
```

### Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

## 🐳 Docker Deployment (Optional)

```bash
# Build Docker image
docker build -t labflow:latest .

# Run container
docker run -p 8080:8080 \
  -e FIREBASE_CONFIG='{"apiKey":"..."}' \
  labflow:latest
```

## 🆘 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Firebase authentication errors**
- Ensure you've enabled Email/Password authentication in Firebase Console
- Check that your Firebase configuration is correct in `.env`

**Build errors**
```bash
# Clear cache and reinstall
rm -rf node_modules
yarn cache clean
yarn install
```

## 📚 Next Steps

- Read the [Installation Guide](./installation) for detailed setup instructions
- Explore the [User Guide](../user-guide/overview) to learn all features
- Check the [API Reference](../api/overview) for integration options
- Join our [Discord Community](https://discord.gg/labflow) for support

## 🚨 Need Help?

- 📧 Email: support@labflow.app
- 💬 Discord: [discord.gg/labflow](https://discord.gg/labflow)
- 🐛 Issues: [github.com/labflow/labflow/issues](https://github.com/labflow/labflow/issues)

---

Ready to revolutionize your laboratory operations? Let's go! 🚀