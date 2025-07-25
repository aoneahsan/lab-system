# Firebase Deployment Checklist

## Quick Deploy Commands

```bash
# Deploy everything
firebase deploy

# Deploy only indexes (recommended first)
firebase deploy --only firestore:indexes

# Deploy only rules
firebase deploy --only firestore:rules

# Deploy functions
cd functions
yarn deploy
cd ..
```

## Pre-Deployment Checklist

1. ✅ **Review Changes**
   - Check `firestore.indexes.json` for new indexes
   - Check `firestore.rules` for new collection permissions
   - Verify all collection names match your code

2. ✅ **Test Locally**
   - Run Firebase emulators: `firebase emulators:start`
   - Test all CRUD operations
   - Verify no permission errors in console

3. ✅ **Backup Current Rules**
   - Download current rules from Firebase Console
   - Save as `firestore.rules.backup`

## Deployment Order

### Step 1: Deploy Indexes First
```bash
firebase deploy --only firestore:indexes
```
- Wait 5-10 minutes for indexes to build
- Check status in Firebase Console > Firestore > Indexes

### Step 2: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```
- Rules take effect immediately
- Test basic operations right away

### Step 3: Deploy Functions (if updated)
```bash
cd functions
yarn build
yarn deploy
cd ..
```

## Post-Deployment Verification

### 1. Test Each Module
- [ ] Authentication - Login/logout
- [ ] Patient Management - Create/edit patients
- [ ] Test Orders - Create new orders
- [ ] Sample Management - Register samples
- [ ] Result Entry - Enter test results
- [ ] Inventory - Add/update items
- [ ] Quality Control - Run QC tests
- [ ] Reports - Generate reports

### 2. Check for Permission Errors
- Open browser DevTools Console
- Look for "Missing or insufficient permissions"
- Note the collection name if any errors occur

### 3. Verify Indexes
- Go to Firebase Console > Firestore > Indexes
- Ensure all indexes show "Enabled" status
- If any show "Building", wait and refresh

## Common Issues & Solutions

### Issue: "The query requires an index"
**Solution**: 
1. Copy the index link from the error message
2. Click to create the index
3. Or add to `firestore.indexes.json` and redeploy

### Issue: "Missing or insufficient permissions"
**Solution**:
1. Check collection name in error
2. Verify rule exists in `firestore.rules`
3. Check user role has access
4. Redeploy rules if needed

### Issue: "Index is still building"
**Solution**:
1. Wait 5-10 minutes
2. Check Firebase Console for status
3. Complex indexes may take longer

## Emergency Rollback

If major issues occur:

1. **Restore Previous Rules**
   ```bash
   # Copy backup rules
   cp firestore.rules.backup firestore.rules
   
   # Deploy immediately
   firebase deploy --only firestore:rules
   ```

2. **Disable Problematic Indexes**
   - Go to Firebase Console > Firestore > Indexes
   - Delete newly created indexes if causing issues
   - Indexes can be recreated later

## Collection Quick Reference

### Tenant-Prefixed Collections
Format: `{tenantId}_{collection}`
- `labflow_tenant1_patients`
- `labflow_tenant1_results`
- `labflow_tenant1_samples`

### Global Collections
- `tenants`
- `users`
- `tenant_users`
- `labflow_tests`
- `labflow_test_panels`

## Security Rules Summary

| Collection Pattern | Required Roles |
|-------------------|----------------|
| `labflow_*_patients` | admin, manager, front_desk |
| `labflow_*_results` | admin, manager, technician, pathologist |
| `labflow_*_samples` | admin, manager, technician, phlebotomist |
| `labflow_*_inventory_*` | admin, manager |
| `labflow_*_qc_*` | admin, manager, technician |
| `labflow_*_reports` | admin, manager |

## Final Checks

- [ ] All indexes showing "Enabled"
- [ ] No permission errors in app
- [ ] All user roles can access their data
- [ ] Performance is acceptable
- [ ] Document any custom changes made

## Support Resources

- [Firebase Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Security Rules Reference](https://firebase.google.com/docs/firestore/security/get-started)
- [Troubleshooting Guide](https://firebase.google.com/docs/firestore/troubleshooting)