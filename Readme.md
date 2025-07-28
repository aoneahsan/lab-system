# LabFlow - Laboratory Management System

**🚀 Project Status: PRODUCTION READY (v1.0.0)**

LabFlow is a comprehensive, multi-tenant laboratory management system designed for clinical laboratories. It includes a web application, mobile apps (iOS/Android), and Chrome extension for seamless EMR integration.

**All features have been implemented and the system is ready for deployment.** See [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.

## 🚀 Features

### Core Modules
- **Authentication & User Management** - Multi-role system with biometric support
- **Patient Management** - Complete patient records and demographics
- **Sample Collection & Tracking** - Barcode/QR support with chain of custody
- **Test Management** - LOINC integration and custom test panels
- **Result Entry & Validation** - Manual and automated result processing
- **Billing & Insurance** - Claims processing and payment tracking
- **Inventory Management** - Reagent tracking with automatic reordering
- **Quality Control** - QC runs with Levey-Jennings charts and Westgard rules
- **Reports & Analytics** - Customizable reports and real-time dashboards
- **EMR Integration** - HL7/FHIR standards with Chrome extension

### Platform Support
- 🌐 **Web Application** - React 19 + TypeScript + Vite
- 📱 **Mobile Apps** - iOS & Android via Capacitor
- 🔧 **Chrome Extension** - Direct EMR integration
- ☁️ **Cloud Functions** - Serverless backend APIs

## 📋 Prerequisites

- Node.js 22+ (LTS)
- Yarn 1.22+
- Firebase CLI (`npm install -g firebase-tools`)
- Git
- VS Code (recommended)

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/labflow.git
cd labflow
```

### 2. Install Dependencies
```bash
# Install main dependencies
yarn install

# Install functions dependencies
cd functions
yarn install
cd ..
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Firebase config
# Get Firebase config from: https://console.firebase.google.com
```

### 4. Set Up Firebase

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project named `labflow-dev`
3. Enable Authentication, Firestore, Storage, Functions

#### Initialize Firebase
```bash
# Login to Firebase
firebase login

# Initialize project
firebase init

# Select: Firestore, Functions, Storage, Hosting, Emulators
# Choose existing project: labflow-dev
```

### 5. Start Development Server
```bash
# Start Vite dev server
yarn dev

# In another terminal, start Firebase emulators (optional)
firebase emulators:start
```

Visit http://localhost:5173

## 📱 Mobile Development

### iOS Setup
```bash
# Add iOS platform
yarn cap:add:ios

# Open in Xcode
yarn cap:open:ios
```

### Android Setup
```bash
# Add Android platform
yarn cap:add:android

# Open in Android Studio
yarn cap:open:android
```

### Build and Sync
```bash
# Build web assets
yarn build

# Sync to native platforms
yarn cap:sync

# Run on device
yarn cap:run:ios
yarn cap:run:android
```

## 🧪 Testing

### Unit Tests
```bash
# Run tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage
```

### E2E Tests
```bash
# Open Cypress UI
yarn cypress:open

# Run headless
yarn cypress:run
```

## 🚀 Deployment

**📋 Important:** Before deploying, review the [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) for a complete step-by-step guide.

### Production Build
```bash
# Build optimized bundle
yarn build

# Preview production build
yarn preview
```

### Deploy to Firebase
```bash
# Deploy everything
firebase deploy --project labflow-production

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

### Docker Deployment
```bash
# Build Docker image
docker build -t labflow:latest .

# Run container
docker run -p 8080:80 labflow:latest
```

## 📁 Project Structure

```
labflow/
├── src/                    # React application source
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── functions/             # Firebase Cloud Functions
├── chrome-extension/      # Chrome Extension source
├── public/               # Static assets
├── cypress/              # E2E tests
├── docs/                 # Documentation
└── scripts/              # Build and deployment scripts
```

## 🔒 Security

- HIPAA compliant architecture
- End-to-end encryption
- Role-based access control (RBAC)
- Audit logging for all actions
- Regular security audits
- Biometric authentication on mobile

## 📚 Documentation

- [Getting Started Guide](docs/user-guide/getting-started.md)
- [API Documentation](docs/api/api-documentation.md)
- [Security Audit Checklist](docs/security/security-audit-checklist.md)
- [Firebase Setup Guide](docs/deployment/firebase-production-setup.md)
- [Mobile App Guide](docs/user-guide/mobile-app-guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 Environment Variables

See [.env.example](.env.example) for all configuration options.

Key variables:
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_PROJECT_PREFIX` - Multi-tenant prefix
- `VITE_ENABLE_*` - Feature flags
- `CYPRESS_*` - Test credentials

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check Firebase configuration in `.env.local`
   - Ensure Firebase project exists
   - Verify API keys are correct

2. **Build Failures**
   - Clear node_modules: `rm -rf node_modules && yarn install`
   - Clear build cache: `rm -rf dist .vite`
   - Check Node version: `node --version` (should be 22+)

3. **Test Failures**
   - Update test snapshots: `yarn test -u`
   - Check test environment setup
   - Ensure Firebase emulators are running

## 📞 Support

- Documentation: https://docs.labflow.com
- Issues: https://github.com/your-org/labflow/issues
- Email: support@labflow.com

## 📄 License

Copyright © 2024 LabFlow. All rights reserved.

---

Built with ❤️ using React, TypeScript, Firebase, and Capacitor