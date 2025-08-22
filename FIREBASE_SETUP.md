# Firebase Setup Guide

This guide explains how to set up Firebase for the LabFlow application and deploy the necessary configurations.

## Prerequisites

1. Node.js and npm/yarn installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. A Firebase project created in the [Firebase Console](https://console.firebase.google.com)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lab-system
yarn install
```

### 2. Firebase Configuration

#### Create Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Get your Firebase configuration from the Firebase Console:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click on the web app (</>) icon
   - Copy the configuration values

3. Update `.env` with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Firebase CLI Authentication

Login to Firebase CLI:
```bash
firebase login
```

### 4. Select Your Project

Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Or use the Firebase CLI:
```bash
firebase use your-project-id
```

## Deployment

### Deploy Everything

To deploy all Firebase services:
```bash
firebase deploy
```

### Deploy Individual Services

#### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

#### Storage Rules
```bash
firebase deploy --only storage:rules
```

#### Cloud Functions
```bash
cd functions
yarn install
yarn build
firebase deploy --only functions
```

#### Hosting (Web App)
```bash
yarn build
firebase deploy --only hosting
```

## Firebase Configuration Files

The following files are used for Firebase configuration and are safe to commit to version control:

### Files Safe to Commit

- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project aliases
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `storage.rules` - Storage security rules
- `database.rules.json` - Realtime Database rules
- `remoteconfig.template.json` - Remote Config template
- `.env.example` - Example environment variables

### Files to Keep Secret (in .gitignore)

- `.env` - Your actual environment variables
- `.env.local` - Local environment overrides
- `.env.production` - Production environment variables
- `serviceAccountKey.json` - Service account credentials
- Any file containing API keys or secrets

## Security Rules Overview

### Firestore Rules

The Firestore rules implement a multi-tenant architecture with role-based access control:

1. **Public Access**: 
   - Tenant information (for registration)
   
2. **Authenticated Users**:
   - Can read/write their own user profile
   - Can read/write their onboarding progress
   
3. **Tenant-Based Access**:
   - Users can only access data within their assigned tenant
   - Different roles have different permissions (lab_admin, lab_technician, etc.)
   
4. **Super Admin**:
   - Has full access to all data across all tenants

### Storage Rules

Storage rules require authentication for all operations:
- Authenticated users can read/write files
- Consider implementing more granular rules based on your needs

## Local Development with Emulators

To use Firebase emulators for local development:

1. Set up emulators:
```bash
firebase init emulators
```

2. Start emulators:
```bash
firebase emulators:start
```

3. Update `.env` to use emulators:
```env
USE_FIREBASE_EMULATOR=true
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

## Troubleshooting

### Permission Errors

If you encounter "Missing or insufficient permissions" errors:

1. Check that Firestore rules are deployed:
```bash
firebase deploy --only firestore:rules
```

2. Verify the user's authentication status
3. Check the user's role in the `tenant_users` collection
4. Review the specific collection's access rules in `firestore.rules`

### Deployment Errors

If deployment fails:

1. Ensure you're logged in: `firebase login`
2. Verify project selection: `firebase use --add`
3. Check Firebase service status: https://status.firebase.google.com
4. Review Firebase CLI version: `firebase --version`

### Function Deployment Issues

For Cloud Functions deployment issues:

1. Check Node.js version compatibility (use Node 18 or 20)
2. Verify all dependencies are installed: `cd functions && yarn install`
3. Build functions before deploying: `yarn build`
4. Check function logs in Firebase Console

## Best Practices

1. **Never commit secrets**: Keep all API keys and credentials in `.env` files
2. **Use environment variables**: Different `.env` files for development/staging/production
3. **Test rules locally**: Use Firebase emulators to test security rules
4. **Monitor usage**: Check Firebase Console for usage and quotas
5. **Enable backups**: Set up automatic Firestore backups for production
6. **Use CI/CD**: Automate deployments with GitHub Actions or similar

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## Support

For issues specific to this project:
1. Check the `/docs` folder for additional documentation
2. Review existing issues in the GitHub repository
3. Contact the development team

For Firebase-specific issues:
1. Check [Firebase Status](https://status.firebase.google.com)
2. Visit [Firebase Support](https://firebase.google.com/support)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)