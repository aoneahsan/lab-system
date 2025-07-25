# Firebase Permissions - Complete Solution

## Root Cause Analysis

The "missing permissions" errors were caused by multiple issues:

1. **Collection Naming Mismatch**
   - Rules expected: `labflow_{tenantId}_{collection}`
   - Some services used: `{tenantId}_{collection}`
   - Some services used: `labflow_{collection}` (without tenant)

2. **Multiple Collection Helpers**
   - `/constants/tenant.constants.ts` - One pattern
   - `/config/firebase-collections.ts` - Different pattern
   - Services importing from different places

3. **Hardcoded Collection Names**
   - Services like `test.service.ts` and `order.service.ts` used hardcoded strings
   - No consistent use of collection constants

## Solution Implemented

### 1. Created Centralized Helper
**File**: `/src/config/firebase-collections-helper.ts`

This provides:
- `getFirestoreCollectionName(collection, tenantId?)` - Returns properly formatted collection name
- `COLLECTION_NAMES` - Constants for all tenant-specific collections
- `ROOT_COLLECTIONS` - Collections without tenant prefix
- `SHARED_COLLECTIONS` - Collections with labflow prefix but no tenant

### 2. Updated Services
Fixed these services to use the centralized helper:
- `patient.service.ts` - Now uses `getFirestoreCollectionName()`
- `inventory.service.ts` - Updated all collection references
- `test.service.ts` - Uses `SHARED_COLLECTIONS`
- `order.service.ts` - Uses `SHARED_COLLECTIONS`

### 3. Debug Tools Added
Created two debug utilities:
- `/utils/debug-firebase.ts` - Logs all Firestore queries
- `/utils/test-firebase-permissions.ts` - Tests all collections

## How to Use the Debug Tools

### 1. In Browser Console

After logging in, run:

```javascript
// Test all permissions
testFirebasePermissions()

// Enable query logging
firebaseDebug.enableDebug()

// Check auth state
firebaseDebug.logAuthState()

// Test specific collection
firebaseDebug.testQuery('labflow_tenant1_patients')
```

### 2. Expected Output

```
✅ User authenticated: {uid: "xxx", email: "user@example.com"}
✅ Tenant selected: {id: "tenant1", name: "Demo Clinic"}
✅ Tenant user found: {role: "lab_admin", isActive: true}
✅ PATIENTS (labflow_tenant1_patients): Access GRANTED
```

## Collection Naming Patterns

### 1. Tenant-Specific Collections
Format: `labflow_{tenantId}_{collection}`

Examples:
- `labflow_tenant1_patients`
- `labflow_tenant1_results`
- `labflow_tenant1_inventory_items`

### 2. Root Collections (No Prefix)
- `tenants`
- `tenant_users`

### 3. Shared Collections
Format: `labflow_{collection}`

Examples:
- `labflow_tests`
- `labflow_test_panels`
- `labflow_test_orders`

## Fixing Permission Errors

### Step 1: Verify Collection Name
```typescript
// Correct way to get collection name
import { getFirestoreCollectionName, COLLECTION_NAMES } from '@/config/firebase-collections-helper';

const collectionName = getFirestoreCollectionName(COLLECTION_NAMES.PATIENTS, tenantId);
// Returns: "labflow_tenant1_patients"
```

### Step 2: Ensure Tenant User Document Exists
The user must have a document in `tenant_users` with ID format: `{userId}_{tenantId}`

```typescript
// Document ID should be
const docId = `${auth.currentUser.uid}_${currentTenant.id}`;

// Document must contain
{
  userId: "user123",
  tenantId: "tenant1",
  role: "lab_admin",
  isActive: true
}
```

### Step 3: Check User Role
Ensure the user's role has permission for the operation:

| Collection | Read | Write |
|------------|------|-------|
| patients | All tenant users | admin, manager, front_desk |
| results | All tenant users | admin, manager, technician, pathologist |
| inventory_items | All tenant users | admin, manager |

## Common Errors and Solutions

### Error: "Missing or insufficient permissions"
**Causes:**
1. Wrong collection name format
2. No tenant_user document
3. User role lacks permission
4. Tenant not set in store

**Solution:**
Run `testFirebasePermissions()` to diagnose

### Error: "The query requires an index"
**Solution:**
Indexes have been deployed. If you see this, the index may still be building.

### Error: "No tenant ID available"
**Causes:**
1. User not logged in
2. Tenant not selected
3. Service called before tenant is set

**Solution:**
Ensure tenant is set before making queries

## Service Update Pattern

When updating a service to fix permissions:

```typescript
// 1. Import the helper
import { getFirestoreCollectionName, COLLECTION_NAMES } from '@/config/firebase-collections-helper';

// 2. For tenant-specific collections
const collectionName = getFirestoreCollectionName(COLLECTION_NAMES.PATIENTS, tenantId);

// 3. For shared collections
import { SHARED_COLLECTIONS } from '@/config/firebase-collections-helper';
const testsCollection = SHARED_COLLECTIONS.LABFLOW_TESTS;

// 4. For root collections
import { ROOT_COLLECTIONS } from '@/config/firebase-collections-helper';
const tenantsCollection = ROOT_COLLECTIONS.TENANTS;
```

## Verification Checklist

- [ ] User is authenticated
- [ ] Tenant is selected and stored
- [ ] tenant_users document exists with correct ID
- [ ] Collection names use `labflow_{tenantId}_{collection}` format
- [ ] User role has required permissions
- [ ] Firebase rules are deployed
- [ ] Firebase indexes are deployed
- [ ] Services import from firebase-collections-helper

## Next Steps

1. **Run Permission Test**: Open browser console and run `testFirebasePermissions()`
2. **Fix Any Failed Collections**: Update the service to use proper collection naming
3. **Ensure Tenant User Exists**: Create tenant_user document if missing
4. **Test Your Queries**: Enable debug mode and check query logs

The permission system should now work correctly with all collections properly accessible based on user roles.