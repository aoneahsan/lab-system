# Firebase Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install globally with `npm install -g firebase-tools`
2. **Node.js**: Version 20.x for Firebase Functions (use `.nvmrc` file)
3. **Firebase Project**: Must be on Blaze (pay-as-you-go) plan for functions deployment

## Deployment Commands

### Deploy Everything (Requires Blaze Plan)
```bash
firebase deploy
```

### Deploy Specific Services

#### Deploy Hosting and Firestore (Free Tier Compatible)
```bash
firebase deploy --only hosting,firestore
```

#### Deploy Functions Only (Requires Blaze Plan)
```bash
firebase deploy --only functions
```

#### Deploy Individual Services
```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy firestore rules and indexes
firebase deploy --only firestore

# Deploy storage rules (requires storage setup in console)
firebase deploy --only storage

# Deploy remote config
firebase deploy --only remoteconfig
```

## Common Issues and Solutions

### 1. Storage Not Set Up Error
**Error**: `Firebase Storage has not been set up on project`

**Solution**: 
- Go to Firebase Console > Storage
- Click "Get Started" to initialize storage
- Or remove storage from deployment: `firebase deploy --except storage`

### 2. Functions Require Blaze Plan
**Error**: `Your project must be on the Blaze (pay-as-you-go) plan`

**Solution**:
- Upgrade to Blaze plan in Firebase Console
- Or deploy without functions: `firebase deploy --only hosting,firestore`

### 3. Node Version Mismatch
**Error**: `The engine 'node' is incompatible`

**Solution**:
- Use nvm to switch to correct version: `nvm use`
- Functions require Node 20.x (check `.nvmrc`)
- Update `package.json` engines field if needed

### 4. TypeScript Compilation Errors
**Solution**:
```bash
cd functions
npm run build
# Fix any TypeScript errors
cd ..
firebase deploy
```

## Firebase Services Configuration

### 1. Hosting
- Configured in `firebase.json`
- Serves files from `dist/` directory
- Includes security headers and caching rules

### 2. Firestore
- Rules in `firestore.rules`
- Indexes in `firestore.indexes.json`
- Multi-tenant data isolation with prefixes

### 3. Functions (Requires Blaze Plan)
- Source in `functions/` directory
- Uses Firebase Functions v2
- Includes workflows, schedulers, and triggers

### 4. Storage (Optional)
- Rules in `storage.rules`
- Must be initialized in Firebase Console first

### 5. Remote Config (Optional)
- Template in `remoteconfig.template.json`
- Feature flags and configuration

## Step-by-Step Deployment

### First Time Setup
```bash
# 1. Login to Firebase
firebase login

# 2. Initialize project (if not done)
firebase init

# 3. Select your project
firebase use labsystem-a1
```

### Development Deployment
```bash
# 1. Build the web app
yarn build

# 2. Build functions (if using)
cd functions
npm run build
cd ..

# 3. Deploy to Firebase
firebase deploy --only hosting,firestore
```

### Production Deployment
```bash
# 1. Set production environment
export NODE_ENV=production

# 2. Build with production config
yarn build

# 3. Deploy all services (requires Blaze plan)
firebase deploy

# 4. Verify deployment
firebase hosting:channel:deploy preview
```

## Deployment Verification

### Check Hosting
- Visit: https://labsystem-a1.web.app
- Verify app loads correctly

### Check Firestore
```bash
# View deployed rules
firebase firestore:rules:get

# Test security rules
npm run test:rules
```

### Check Functions (if deployed)
```bash
# View function logs
firebase functions:log

# Test specific function
firebase functions:shell
```

## Environment Variables

### For Functions
Create `.env` file in `functions/` directory:
```env
SENDGRID_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
STRIPE_SECRET_KEY=your_key
```

### For Hosting
Environment variables are built into the app during `yarn build`.

## Rollback Procedures

### Rollback Hosting
```bash
# List versions
firebase hosting:versions:list

# Rollback to previous
firebase hosting:rollback
```

### Rollback Firestore Rules
```bash
# View rule history in Firebase Console
# Or redeploy previous rules file
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Deploy to Firebase
  run: |
    npm ci
    npm run build
    npx firebase deploy --token $FIREBASE_TOKEN --only hosting,firestore
```

## Monitoring

- **Hosting**: Check Firebase Console > Hosting
- **Firestore**: Check Firebase Console > Firestore > Usage
- **Functions**: Check Firebase Console > Functions > Logs
- **Performance**: Use Firebase Performance Monitoring

## Cost Optimization

1. **Free Tier Limits**:
   - Hosting: 10GB storage, 360MB/day bandwidth
   - Firestore: 1GB storage, 50K reads/day
   
2. **Minimize Functions** (Blaze plan only):
   - Use scheduled functions sparingly
   - Optimize function memory allocation
   - Implement proper error handling

3. **Cache Static Assets**:
   - Already configured in `firebase.json`
   - Long cache for JS/CSS files
   - Shorter cache for images

## Troubleshooting

### Debug Deployment Issues
```bash
# Verbose output
firebase deploy --debug

# Dry run
firebase deploy --only hosting --dry-run
```

### Common Solutions
1. Clear Firebase cache: `rm -rf .firebase/`
2. Update Firebase CLI: `npm update -g firebase-tools`
3. Re-authenticate: `firebase login --reauth`
4. Check project permissions in Firebase Console

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Status: https://status.firebase.google.com
- Community Support: https://stackoverflow.com/questions/tagged/firebase