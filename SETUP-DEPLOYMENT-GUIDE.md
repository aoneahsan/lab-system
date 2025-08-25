# LabFlow Setup and Deployment Guide

## Prerequisites

### System Requirements
- Node.js 20+ (LTS recommended)
- Yarn package manager
- Git
- Firebase CLI (`npm install -g firebase-tools`)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Firebase Account Setup
1. Create a Firebase account at https://firebase.google.com
2. Create a new project or use existing one
3. Enable the following services:
   - Authentication
   - Cloud Firestore
   - Cloud Storage
   - Hosting

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/lab-system.git
cd lab-system
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Firebase Configuration

#### Configure Firebase Project
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

#### Update Firebase Config
Edit `src/config/firebase.config.ts` with your Firebase project credentials:
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Development

### Local Development Server
```bash
# Start development server
yarn dev

# Access at http://localhost:5173
```

### Development Commands
```bash
# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Formatting
yarn format

# Build for production
yarn build

# Preview production build
yarn preview
```

## Deployment

### Simple Deployment Process

#### 1. Build the Application
```bash
# Build production version
yarn build
```

#### 2. Deploy to Firebase
```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy everything (hosting, rules, indexes)
firebase deploy
```

#### 3. Deploy Firestore Rules and Indexes
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Deployment URLs
After successful deployment:
- Production URL: https://your-project-id.web.app
- Alternative URL: https://your-project-id.firebaseapp.com

## Mobile App Deployment

### Android
```bash
# Build Android app
yarn cap:sync
yarn cap:build:android

# Open in Android Studio
npx cap open android
```

### iOS
```bash
# Build iOS app
yarn cap:sync
yarn cap:build:ios

# Open in Xcode
npx cap open ios
```

### Mobile App Distribution
1. **Android**: Upload APK/AAB to Google Play Console
2. **iOS**: Upload IPA through Xcode to App Store Connect

## Chrome Extension

### Build Extension
```bash
cd chrome-extension
yarn build
```

### Install Locally
1. Open Chrome → Extensions
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select `chrome-extension/dist` folder

### Publish to Chrome Web Store
1. Create developer account
2. Package extension as ZIP
3. Upload to Chrome Web Store Console

## Configuration

### Environment Variables
Create `.env` file in root directory:
```env
# Firebase Emulator
USE_FIREBASE_EMULATOR=false

# API Keys (if needed)
VITE_SENDGRID_API_KEY=your-key
VITE_TWILIO_ACCOUNT_SID=your-sid
VITE_TWILIO_AUTH_TOKEN=your-token
```

### Firebase Security Rules
Security rules are in `firestore.rules`:
- Automatically deployed with `firebase deploy`
- Test rules locally with emulator
- Always review before production deployment

### Database Indexes
Indexes are defined in `firestore.indexes.json`:
- Required for complex queries
- Deploy with `firebase deploy --only firestore:indexes`
- Monitor index building in Firebase Console

## Initial Setup

### 1. Create Super Admin
After deployment:
1. Navigate to `/setup/create-super-admin`
2. Create the first super admin account
3. This account has full system access

### 2. Laboratory Onboarding
1. Login with super admin
2. Go to Settings → Laboratory Setup
3. Complete the 5-step onboarding:
   - Basic Information
   - Address
   - Contact
   - Settings
   - Custom Configuration

### 3. User Management
1. Navigate to Users
2. Add users with appropriate roles
3. Configure permissions as needed

### 4. Initial Configuration
1. **Test Catalog**: Import LOINC codes or add custom tests
2. **Inventory**: Add initial stock items
3. **QC Materials**: Configure quality control materials
4. **Report Templates**: Customize report layouts

## Monitoring and Maintenance

### Firebase Console Monitoring
- **Authentication**: Monitor user signups and logins
- **Firestore**: Track database usage and performance
- **Storage**: Monitor file storage usage
- **Hosting**: View deployment history and rollback if needed

### Application Logs
- Browser console for client-side errors
- Firebase Functions logs for server-side
- Custom logging service integration available

### Performance Monitoring
1. Lighthouse audits for web performance
2. Firebase Performance Monitoring
3. Bundle size analysis with `yarn build`

## Backup and Recovery

### Database Backup
```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/backup-name

# Import Firestore data
gcloud firestore import gs://your-backup-bucket/backup-name
```

### Local Backup
- Application stores data locally in IndexedDB
- Automatic sync when online
- 30-day retention for offline data

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules
yarn install
yarn build
```

**Firebase Deploy Errors**
```bash
# Check Firebase login
firebase login --reauth

# Verify project
firebase use --add
```

**Permission Errors**
- Check Firebase project permissions
- Verify service account access
- Review Firestore security rules

### Debug Mode
```bash
# Run with debug logging
DEBUG=* yarn dev
```

## Security Considerations

### Production Checklist
- [ ] Change all default passwords
- [ ] Enable 2FA for admin accounts
- [ ] Review and restrict Firebase rules
- [ ] Enable CORS only for trusted domains
- [ ] Set up SSL certificates (automatic with Firebase)
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Document emergency procedures

### HIPAA Compliance
- Enable audit logging
- Configure data retention policies
- Implement access controls
- Regular security updates
- Employee training on data handling

## Updates and Upgrades

### Updating Dependencies
```bash
# Check outdated packages
yarn outdated

# Update all dependencies
yarn upgrade --latest

# Test after updates
yarn test
yarn build
```

### Version Management
- Use semantic versioning
- Tag releases in Git
- Maintain changelog
- Test in staging before production

## Support Resources

### Documentation
- User Guide: `/USER-GUIDE.md`
- API Documentation: `/docs/API.md`
- Development Guide: `/docs/DEVELOPER_GUIDE.md`

### Getting Help
- GitHub Issues: Report bugs and feature requests
- Email Support: support@labflow.com
- Community Forum: https://community.labflow.com

---

## Quick Deployment Steps

For experienced users, here's the minimal deployment:

```bash
# 1. Clone and install
git clone <repository>
cd lab-system
yarn install

# 2. Configure Firebase
# Edit src/config/firebase.config.ts

# 3. Build and deploy
yarn build
firebase deploy

# Done! Access at https://your-project.web.app
```

---

*Version 1.0.0 - Last Updated: January 2025*