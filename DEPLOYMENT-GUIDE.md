# LabFlow Deployment Guide

## 🚀 Deployment Overview

This guide explains how to deploy the LabFlow Laboratory Information System to production using Firebase and GitHub Actions.

## 📋 Prerequisites

1. **Firebase Account**: Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **Node.js**: Version 20 or higher
4. **Firebase CLI**: Install with `npm install -g firebase-tools`

## 🔧 Initial Setup

### 1. Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select these services:
# - Hosting
# - Functions
# - Firestore
# - Storage
# - Emulators (for local testing)
```

### 2. Environment Variables

Create `.env.production` file:

```env
VITE_APP_ENV=production
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `FIREBASE_TOKEN`: Firebase CI token (run `firebase login:ci`)
- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID
- `SLACK_WEBHOOK` (optional): For deployment notifications

## 🚀 Manual Deployment

### Deploy Everything

```bash
# Build the application
yarn build

# Deploy to Firebase
firebase deploy --project your-project-id
```

### Deploy Specific Services

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage
```

## 🤖 Automated Deployment (CI/CD)

The project includes GitHub Actions workflows for automated deployment:

### Automatic Deployment on Push to Main

When you push to the `main` branch:
1. Tests are run automatically
2. Application is built
3. Deployed to Firebase Hosting
4. Functions are deployed
5. Security rules are updated
6. Smoke tests verify the deployment

### Manual Deployment

Trigger deployment manually from GitHub Actions:
1. Go to Actions tab in your repository
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose environment (production/staging)

## 🌐 Custom Domain Setup

### 1. Add Custom Domain in Firebase

```bash
# Add your custom domain
firebase hosting:sites:create your-domain-com

# Connect domain
firebase hosting:channel:deploy --expires 7d
```

### 2. DNS Configuration

Add these DNS records to your domain:

| Type | Name | Value |
|------|------|-------|
| A | @ | 151.101.1.195 |
| A | @ | 151.101.65.195 |
| CNAME | www | your-project.web.app |

### 3. SSL Certificate

Firebase automatically provisions SSL certificates. Wait 24-48 hours for propagation.

## 📊 Monitoring Deployment

### Check Deployment Status

```bash
# View hosting deployments
firebase hosting:versions:list

# View function logs
firebase functions:log

# Check deployment URL
curl https://your-project.web.app/api/health
```

### Firebase Console

Monitor your deployment at:
- **Hosting**: https://console.firebase.google.com/project/[PROJECT_ID]/hosting
- **Functions**: https://console.firebase.google.com/project/[PROJECT_ID]/functions
- **Firestore**: https://console.firebase.google.com/project/[PROJECT_ID]/firestore

## 🔄 Rollback Deployment

If something goes wrong:

```bash
# Rollback hosting to previous version
firebase hosting:rollback

# List previous versions
firebase hosting:versions:list

# Rollback to specific version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID
```

## 🧪 Testing Deployment

### Local Testing

```bash
# Start emulators
firebase emulators:start

# Run tests
yarn test

# Run E2E tests
yarn cypress:open
```

### Production Testing

```bash
# Run smoke tests
npx playwright test tests/smoke/

# Check health endpoint
curl https://your-project.web.app/api/health
```

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] Environment variables are set
- [ ] Firebase project is configured
- [ ] GitHub secrets are added
- [ ] Security rules are tested
- [ ] Database indexes are created
- [ ] Backup current data
- [ ] Update version number
- [ ] Create git tag for release

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   yarn install
   yarn build
   ```

2. **Functions Deployment Fails**
   ```bash
   cd functions
   npm install
   npm run build
   firebase deploy --only functions --debug
   ```

3. **Permission Errors**
   ```bash
   # Check Firebase permissions
   firebase projects:list
   
   # Re-authenticate
   firebase logout
   firebase login
   ```

4. **Custom Domain Not Working**
   - Verify DNS records
   - Wait for propagation (up to 48 hours)
   - Check SSL certificate status in Firebase Console

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)

## 🔐 Security Notes

- Never commit `.env` files with real credentials
- Use GitHub Secrets for sensitive data
- Enable 2FA on Firebase and GitHub accounts
- Regularly rotate API keys and tokens
- Monitor Firebase usage and set budget alerts

## 📞 Support

For deployment issues:
1. Check Firebase Status: https://status.firebase.google.com
2. Review deployment logs: `firebase functions:log`
3. Contact support: https://firebase.google.com/support

---

**Last Updated**: August 2025
**Version**: 1.0.0