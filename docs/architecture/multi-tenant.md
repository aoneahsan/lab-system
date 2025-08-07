# Multi-Tenant Architecture

LabFlow implements a comprehensive multi-tenant architecture that ensures complete data isolation while maintaining performance and scalability.

## Overview

The multi-tenant architecture allows multiple laboratory organizations to use the same LabFlow instance while keeping their data completely isolated and secure.

## Key Concepts

### Tenant Isolation

Each tenant (laboratory organization) has:
- Isolated data storage
- Separate user base
- Custom configuration
- Independent billing
- Isolated file storage

### Tenant Identification

Tenants are identified by:
1. **Tenant ID**: Unique identifier for each organization
2. **Tenant Prefix**: Used for namespacing resources (e.g., `labflow_tenant1_`)
3. **Custom Domain** (optional): For white-label deployments

## Implementation

### 1. Database Structure

```typescript
// Tenant configuration collection
interface Tenant {
  id: string;
  name: string;
  prefix: string;
  domain?: string;
  settings: TenantSettings;
  subscription: SubscriptionPlan;
  createdAt: Timestamp;
  status: 'active' | 'suspended' | 'trial';
}

// All tenant data uses prefixed collections
const collections = {
  patients: `${tenantPrefix}patients`,
  tests: `${tenantPrefix}tests`,
  orders: `${tenantPrefix}orders`,
  results: `${tenantPrefix}results`,
  // ... other collections
};
```

### 2. Authentication Flow

```typescript
// Multi-tenant authentication
async function authenticateUser(email: string, password: string) {
  // 1. Authenticate with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // 2. Get user's tenant information
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  const tenantId = userDoc.data()?.tenantId;
  
  // 3. Load tenant configuration
  const tenant = await loadTenant(tenantId);
  
  // 4. Set tenant context
  setTenantContext(tenant);
  
  return { user: userCredential.user, tenant };
}
```

### 3. Data Access Layer

```typescript
// Tenant-aware data service
class TenantDataService {
  private tenantPrefix: string;
  
  constructor(tenant: Tenant) {
    this.tenantPrefix = tenant.prefix;
  }
  
  async getPatients(): Promise<Patient[]> {
    const collectionName = `${this.tenantPrefix}patients`;
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  }
  
  async createPatient(data: PatientData): Promise<string> {
    const collectionName = `${this.tenantPrefix}patients`;
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      tenantId: this.tenant.id,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }
}
```

### 4. Storage Isolation

```typescript
// Tenant-specific storage paths
const getStoragePath = (tenant: Tenant, module: string, file: string) => {
  return `${tenant.prefix}/${module}/${file}`;
};

// Example: Patient photo upload
async function uploadPatientPhoto(tenant: Tenant, patientId: string, file: File) {
  const path = getStoragePath(tenant, 'patients', `${patientId}/photo.jpg`);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
```

### 5. Security Rules

```javascript
// Firestore security rules for multi-tenant access
match /databases/{database}/documents {
  // Tenant configuration - only accessible by super admins
  match /tenants/{tenantId} {
    allow read, write: if request.auth != null && 
      request.auth.token.role == 'super_admin';
  }
  
  // Tenant-specific collections
  match /{tenantPrefix}patients/{document=**} {
    allow read, write: if request.auth != null && 
      request.auth.token.tenantId == getTenantFromPrefix(tenantPrefix);
  }
  
  // Function to extract tenant from prefix
  function getTenantFromPrefix(prefix) {
    return prefix.split('_')[1];
  }
}
```

## Tenant Management

### Creating a New Tenant

```typescript
async function createTenant(tenantData: TenantCreationData) {
  // 1. Generate unique tenant ID and prefix
  const tenantId = generateTenantId();
  const prefix = `labflow_${tenantId}_`;
  
  // 2. Create tenant document
  const tenant: Tenant = {
    id: tenantId,
    name: tenantData.name,
    prefix: prefix,
    domain: tenantData.domain,
    settings: getDefaultSettings(),
    subscription: { plan: 'trial', ... },
    createdAt: serverTimestamp(),
    status: 'trial'
  };
  
  await setDoc(doc(db, 'tenants', tenantId), tenant);
  
  // 3. Initialize tenant collections
  await initializeTenantCollections(tenant);
  
  // 4. Create admin user
  await createTenantAdmin(tenant, tenantData.adminEmail);
  
  return tenant;
}
```

### Tenant Switching

For users with access to multiple tenants:

```typescript
// Switch tenant context
async function switchTenant(userId: string, newTenantId: string) {
  // Verify user has access to the tenant
  const hasAccess = await checkTenantAccess(userId, newTenantId);
  if (!hasAccess) {
    throw new Error('Access denied to tenant');
  }
  
  // Load new tenant configuration
  const tenant = await loadTenant(newTenantId);
  
  // Update user context
  setTenantContext(tenant);
  
  // Reload application data
  await reloadTenantData();
}
```

## Performance Considerations

### 1. Collection Sharding

For large tenants, implement collection sharding:

```typescript
// Shard large collections by date or other criteria
const getShardedCollection = (tenant: Tenant, base: string, date: Date) => {
  const shard = format(date, 'yyyy-MM');
  return `${tenant.prefix}${base}_${shard}`;
};
```

### 2. Caching Strategy

```typescript
// Tenant-specific caching
class TenantCache {
  private cache = new Map<string, any>();
  private tenantId: string;
  
  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }
  
  getKey(key: string): string {
    return `${this.tenantId}:${key}`;
  }
  
  set(key: string, value: any, ttl?: number) {
    this.cache.set(this.getKey(key), {
      value,
      expires: ttl ? Date.now() + ttl : null
    });
  }
}
```

### 3. Query Optimization

```typescript
// Optimized tenant queries with composite indexes
const getRecentOrders = async (tenant: Tenant, limit = 50) => {
  const orders = await getDocs(
    query(
      collection(db, `${tenant.prefix}orders`),
      where('status', '!=', 'cancelled'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    )
  );
  return orders.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## Monitoring and Analytics

### Tenant Metrics

```typescript
interface TenantMetrics {
  tenantId: string;
  activeUsers: number;
  dataSize: number;
  apiCalls: number;
  storageUsed: number;
  lastActivity: Timestamp;
}

// Track tenant usage
async function trackTenantUsage(tenant: Tenant) {
  const metrics = await calculateTenantMetrics(tenant);
  await updateDoc(doc(db, 'tenantMetrics', tenant.id), {
    ...metrics,
    updatedAt: serverTimestamp()
  });
}
```

## Best Practices

1. **Always validate tenant context** before data operations
2. **Use tenant prefixes consistently** across all resources
3. **Implement proper access controls** at every layer
4. **Monitor tenant resource usage** to prevent abuse
5. **Test multi-tenant scenarios** thoroughly
6. **Document tenant-specific configurations**
7. **Implement tenant data backup strategies**
8. **Plan for tenant data migration and export**

## Migration and Data Export

```typescript
// Export tenant data
async function exportTenantData(tenantId: string) {
  const tenant = await loadTenant(tenantId);
  const collections = getTenantCollections(tenant);
  const exportData: any = {};
  
  for (const collectionName of collections) {
    const data = await exportCollection(collectionName);
    exportData[collectionName] = data;
  }
  
  return {
    tenant: tenant,
    exportDate: new Date(),
    data: exportData
  };
}
```