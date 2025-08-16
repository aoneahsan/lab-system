# Manual Deployment Instructions

## 🚀 Quick Deploy

To deploy the application manually, simply run:

```bash
./deploy.sh
```

This script will:
1. Clean previous build
2. Install dependencies
3. Run type checking
4. Build production bundle
5. Deploy to Firebase (Hosting, Firestore rules, Storage rules)

## 📝 Step-by-Step Manual Deployment

If you prefer to run commands individually:

### 1. Build the Application

```bash
# Install dependencies
yarn install

# Build production bundle
yarn build
```

### 2. Deploy to Firebase

```bash
# Deploy everything
firebase deploy --project labsystem-a1

# OR deploy specific services:

# Deploy only hosting (website)
firebase deploy --only hosting --project labsystem-a1

# Deploy only Firestore rules
firebase deploy --only firestore:rules --project labsystem-a1

# Deploy only Storage rules
firebase deploy --only storage --project labsystem-a1

# Deploy Functions (if needed)
firebase deploy --only functions --project labsystem-a1
```

## 🔍 Check Deployment Status

After deployment, verify everything is working:

```bash
# Check the live website
open https://labsystem-a1.web.app

# Check Firebase Console
open https://console.firebase.google.com/project/labsystem-a1
```

## 🛠️ Common Commands

```bash
# Build for production
yarn build

# Deploy everything
firebase deploy --project labsystem-a1

# Deploy only hosting
firebase deploy --only hosting --project labsystem-a1

# View deployment history
firebase hosting:versions:list --project labsystem-a1

# Rollback to previous version
firebase hosting:rollback --project labsystem-a1
```

## ⚡ Quick Tips

1. **Always build before deploying**: Run `yarn build` to create the latest production bundle
2. **Check locally first**: Run `yarn preview` to test the production build locally
3. **Incremental deploys**: You can deploy just hosting without rules if only UI changed

## 🚨 Troubleshooting

If deployment fails:

```bash
# Check Firebase login
firebase login

# List projects to verify access
firebase projects:list

# Clear build and retry
rm -rf dist node_modules
yarn install
yarn build
firebase deploy --project labsystem-a1
```

## 📊 Current Deployment Info

- **Project ID**: labsystem-a1
- **Production URL**: https://labsystem-a1.web.app
- **Firebase Console**: https://console.firebase.google.com/project/labsystem-a1

---

**Note**: No automatic deployments are configured. All deployments must be done manually using the commands above.