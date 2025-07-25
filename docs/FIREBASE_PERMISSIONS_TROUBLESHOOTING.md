# Firebase Permissions Troubleshooting Guide

## ✅ Issues Fixed

### 1. Collection Name Pattern Mismatch
- **Problem**: Rules expected `labflow_{tenantId}_{collection}`, code was using `{tenantId}_{collection}`
- **Solution**: Updated `getTenantPrefix()` to return `labflow_${tenantId}_`
- **Status**: ✅ FIXED

### 2. Missing Collection Rules
- **Problem**: New collections had no security rules
- **Solution**: Added rules for all new collections (critical_notifications, batches, etc.)
- **Status**: ✅ FIXED

### 3. Incorrect Imports
- **Problem**: Services importing from wrong firebase module
- **Solution**: Updated all imports to use `@/config/firebase-collections`
- **Status**: ✅ FIXED

### 4. Index Deployment Issues
- **Problem**: Single-field indexes causing deployment errors
- **Solution**: Removed single-field indexes from firestore.indexes.json
- **Status**: ✅ FIXED

## Debugging Permission Errors

If you still see "Missing or insufficient permissions", follow these steps:

### Step 1: Check Browser Console
Look for the exact error message. It should show:
```
FirebaseError: Missing or insufficient permissions.
```

### Step 2: Enable Debug Logging
Add this to your code temporarily:
```typescript
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Firestore Debug Mode Enabled');
  // Log all queries
  const originalCollection = collection;
  window.collection = (...args) => {
    console.log('Firestore Query:', args);
    return originalCollection(...args);
  };
}
```

### Step 3: Check Collection Names
In the console, verify:
1. Collection name format is `labflow_{tenantId}_{collection}`
2. Tenant ID is not null or undefined
3. Collection name matches exactly (case-sensitive)

### Step 4: Verify User Authentication
```typescript
// Add this to check user auth state
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

onAuthStateChanged(auth, (user) => {
  console.log('Auth State:', {
    uid: user?.uid,
    email: user?.email,
    emailVerified: user?.emailVerified
  });
});
```

### Step 5: Check Tenant User Entry
```typescript
// Verify tenant_user document exists
const checkTenantUser = async (userId: string, tenantId: string) => {
  const docId = `${userId}_${tenantId}`;
  const docRef = doc(db, 'tenant_users', docId);
  const docSnap = await getDoc(docRef);
  
  console.log('Tenant User Check:', {
    docId,
    exists: docSnap.exists(),
    data: docSnap.data()
  });
};
```

## Common Permission Patterns

### Pattern 1: User Not in Tenant
**Error**: Missing permissions on tenant-specific collection
**Check**: 
```typescript
// Document ID should be: userId_tenantId
const tenantUserDoc = `${auth.currentUser.uid}_${currentTenant.id}`;
```

### Pattern 2: Wrong Collection Name
**Error**: Collection doesn't match rule pattern
**Check**:
```typescript
// Correct format
const collectionName = COLLECTIONS.PATIENTS; // Returns: labflow_tenant1_patients

// Wrong formats to avoid:
// ❌ 'patients'
// ❌ 'tenant1_patients'
// ❌ 'labflow_patients'
```

### Pattern 3: Missing Role
**Error**: User role doesn't have permission
**Check**: Verify user role in tenant_users document

## Testing Permissions

### Use Firebase Console Rules Playground
1. Go to Firebase Console > Firestore > Rules
2. Click "Rules playground"
3. Test with:
   - **Simulation type**: get/list/create/update/delete
   - **Location**: `labflow_tenant1_patients/doc123`
   - **Authenticated**: Yes
   - **Firebase UID**: Your user's UID
   - **Run simulation**

### Test Script
```typescript
// Test all collections for a user
const testPermissions = async () => {
  const collections = [
    'patients', 'tests', 'samples', 'results', 
    'inventory_items', 'qc_tests', 'reports'
  ];
  
  for (const coll of collections) {
    try {
      const collName = getCollectionName(coll);
      const q = query(collection(db, collName), limit(1));
      await getDocs(q);
      console.log(`✅ ${collName}: Access granted`);
    } catch (error) {
      console.error(`❌ ${collName}: ${error.message}`);
    }
  }
};
```

## Collection Access Matrix

| Collection | Read Access | Write Access |
|------------|------------|--------------|
| `labflow_*_patients` | All tenant users | admin, manager, front_desk |
| `labflow_*_results` | All tenant users | admin, manager, technician, pathologist, radiologist |
| `labflow_*_samples` | All tenant users | admin, manager, technician, phlebotomist |
| `labflow_*_inventory_*` | All tenant users | admin, manager |
| `labflow_*_qc_*` | All tenant users | admin, manager, technician |
| `labflow_*_reports` | All tenant users | admin, manager |
| `labflow_*_critical_notifications` | All tenant users | admin, manager |
| `labflow_*_batches` | All tenant users | admin, manager |

## Quick Fixes

### 1. Ensure Tenant User Document Exists
```typescript
const ensureTenantUser = async (userId: string, tenantId: string, role: string) => {
  const docId = `${userId}_${tenantId}`;
  await setDoc(doc(db, 'tenant_users', docId), {
    userId,
    tenantId,
    role,
    isActive: true,
    createdAt: serverTimestamp()
  });
};
```

### 2. Force Collection Name Format
```typescript
// Add this validation
const validateCollectionName = (name: string): boolean => {
  const pattern = /^labflow_[a-zA-Z0-9]+_[a-zA-Z0-9_]+$/;
  return pattern.test(name);
};
```

### 3. Debug Query Parameters
```typescript
// Wrap query creation
const createQuery = (...constraints) => {
  console.log('Query Constraints:', constraints);
  return query(...constraints);
};
```

## If All Else Fails

1. **Check Firebase Status**: https://status.firebase.google.com/
2. **Clear Browser Cache**: Sometimes old rules are cached
3. **Re-authenticate**: Sign out and sign in again
4. **Check Quotas**: Ensure you haven't hit Firestore quotas
5. **Enable Offline**: Test with offline persistence disabled

## Contact Support
If permissions still fail after these checks:
1. Document the exact query causing issues
2. Note the user's role and tenant ID
3. Check Firebase Console for any service issues
4. Review recent code changes that might affect queries