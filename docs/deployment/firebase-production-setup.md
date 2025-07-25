# Firebase Production Setup Guide

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Production Google account
- Billing enabled for production features

## Create Production Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name: `labflow-production`
4. Enable Google Analytics
5. Configure Analytics account

## Enable Services

### Authentication
1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. Enable 2FA (Phone auth)
4. Add authorized domains
5. Configure email templates

### Firestore Database
1. Create database in production mode
2. Choose nearest region
3. Apply security rules from `firestore.rules`
4. Create composite indexes from `firestore.indexes.json`

### Cloud Storage
1. Enable Cloud Storage
2. Choose same region as Firestore
3. Apply security rules from `storage.rules`
4. Configure CORS if needed

### Cloud Functions
1. Upgrade to Blaze plan
2. Set budget alerts
3. Configure regions
4. Set environment variables:
```bash
firebase functions:config:set \
  smtp.host="smtp.sendgrid.net" \
  smtp.port="587" \
  smtp.user="apikey" \
  smtp.password="YOUR_SENDGRID_API_KEY" \
  app.url="https://labflow.com" \
  app.name="LabFlow"
```

## Security Configuration

### API Keys
1. Go to Project Settings → General
2. Restrict API keys by domain
3. Add production domains only
4. Enable only required APIs

### App Check
1. Enable App Check
2. Register web app
3. Add reCAPTCHA v3 site key
4. Enforce for all services

### Service Accounts
1. Create dedicated service accounts
2. Assign minimum required roles
3. Rotate keys regularly
4. Store securely

## Deploy to Production

### Build and Deploy
```bash
# Install dependencies
yarn install

# Build production bundle
yarn build:prod

# Deploy to Firebase
firebase deploy --only hosting,functions,firestore,storage --project labflow-production

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules --project labflow-production
```

### Verify Deployment
1. Check hosting URL
2. Test authentication
3. Verify database access
4. Test cloud functions
5. Check storage upload

## Monitoring Setup

### Performance Monitoring
1. Enable Performance Monitoring
2. Set up custom traces
3. Configure alerts
4. Monitor key metrics

### Error Tracking
1. Enable Crashlytics
2. Set up error alerts
3. Configure integrations
4. Test error reporting

### Analytics
1. Configure custom events
2. Set up audiences
3. Create funnels
4. Enable BigQuery export

## Backup Configuration

### Automated Backups
1. Enable point-in-time recovery
2. Configure daily exports
3. Set retention policy
4. Test restore process

### Backup Script
```bash
#!/bin/bash
# backup-firestore.sh
PROJECT_ID="labflow-production"
BUCKET="gs://labflow-backups"
DATE=$(date +%Y%m%d_%H%M%S)

gcloud firestore export $BUCKET/firestore_$DATE \
  --project=$PROJECT_ID \
  --collection-ids='labflow_patients,labflow_samples,labflow_results'
```

## Production Checklist

- [ ] Domain verification complete
- [ ] SSL certificates active
- [ ] API keys restricted
- [ ] Security rules tested
- [ ] Indexes created
- [ ] Functions deployed
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Error tracking active
- [ ] Performance monitoring on
- [ ] Budget alerts set
- [ ] Team access configured

## Maintenance

### Regular Tasks
- Review security rules monthly
- Check index usage
- Monitor costs
- Review error logs
- Update dependencies
- Rotate service account keys

### Emergency Procedures
1. Rollback: `firebase hosting:rollback`
2. Disable functions: Use kill switch
3. Block access: Update security rules
4. Contact support: Firebase support channels