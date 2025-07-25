import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useTenantStore } from '@/stores/tenant.store';

// Debug utility to log all Firestore queries
export const enableFirestoreDebug = () => {
  // Override collection function to log collection names
  const originalCollection = collection;
  (window as any).__firestoreCollection = originalCollection;
  (window as any).collection = (...args: any[]) => {
    console.log('🔥 Firestore Collection:', args[1]);
    return originalCollection(...args as [any, any, ...any[]]);
  };

  // Override query function to log query constraints
  const originalQuery = query;
  (window as any).__firestoreQuery = originalQuery;
  (window as any).query = (...args: any[]) => {
    console.log('🔍 Firestore Query:', {
      collection: args[0]?.path || args[0],
      constraints: args.slice(1).map((c: any) => ({
        type: c?.type,
        fieldPath: c?._delegate?.fieldPath?.segments?.join('.'),
        op: c?._delegate?.op,
        value: c?._delegate?.value
      }))
    });
    return originalQuery(...args as [any, ...any[]]);
  };

  // Override getDocs to catch permission errors
  const originalGetDocs = getDocs;
  (window as any).__firestoreGetDocs = originalGetDocs;
  (window as any).getDocs = async (query: any) => {
    try {
      const result = await originalGetDocs(query);
      console.log('✅ Query Success:', query?.path || query);
      return result;
    } catch (error: any) {
      console.error('❌ Query Failed:', {
        path: query?.path || query,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  };
};

// Test all collection permissions for current user
export const testAllPermissions = async () => {
  console.log('🧪 Testing Firebase Permissions...');
  
  const user = auth.currentUser;
  const tenant = useTenantStore.getState().currentTenant;
  
  console.log('Current User:', {
    uid: user?.uid,
    email: user?.email,
    tenantId: tenant?.id
  });

  if (!user || !tenant) {
    console.error('❌ No user or tenant found');
    return;
  }

  // Check tenant_users document
  try {
    const tenantUserDocId = `${user.uid}_${tenant.id}`;
    const tenantUserQuery = query(
      collection(db, 'tenant_users'),
      where('__name__', '==', tenantUserDocId),
      limit(1)
    );
    const tenantUserSnap = await getDocs(tenantUserQuery);
    
    if (tenantUserSnap.empty) {
      console.error('❌ No tenant_users document found for:', tenantUserDocId);
    } else {
      const userData = tenantUserSnap.docs[0].data();
      console.log('✅ Tenant User Found:', {
        docId: tenantUserSnap.docs[0].id,
        role: userData.role,
        isActive: userData.isActive
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to check tenant_users:', error.message);
  }

  // Test collections
  const collections = [
    'patients',
    'tests', 
    'samples',
    'results',
    'inventory_items',
    'stock_transactions',
    'qc_tests',
    'qc_results',
    'reports',
    'report_templates',
    'critical_notifications',
    'batches',
    'sampleCollections',
    'resultValidations'
  ];

  for (const collName of collections) {
    try {
      // Get the collection name with tenant prefix
      const { getCollectionName } = await import('@/config/firebase-collections');
      const fullCollectionName = getCollectionName(collName);
      
      console.log(`\n📁 Testing: ${fullCollectionName}`);
      
      // Try a simple query
      const testQuery = query(
        collection(db, fullCollectionName),
        limit(1)
      );
      
      const snapshot = await getDocs(testQuery);
      console.log(`✅ ${fullCollectionName}: Access GRANTED (${snapshot.size} docs)`);
      
    } catch (error: any) {
      console.error(`❌ ${collName}: Access DENIED - ${error.message}`);
    }
  }

  console.log('\n🏁 Permission test complete');
};

// Log current auth and tenant state
export const logAuthState = () => {
  const user = auth.currentUser;
  const tenant = useTenantStore.getState().currentTenant;
  
  console.log('🔐 Auth State:', {
    user: user ? {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      metadata: user.metadata
    } : 'Not authenticated',
    tenant: tenant ? {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive
    } : 'No tenant selected'
  });
};

// Test a specific query
export const testQuery = async (collectionName: string, constraints: any[] = []) => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    console.log(`✅ Query successful: ${collectionName}`, {
      docs: snapshot.size,
      empty: snapshot.empty
    });
    return snapshot;
  } catch (error: any) {
    console.error(`❌ Query failed: ${collectionName}`, {
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

// Initialize debug mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).firebaseDebug = {
    enableDebug: enableFirestoreDebug,
    testPermissions: testAllPermissions,
    logAuthState,
    testQuery
  };
  
  console.log('🐛 Firebase Debug Mode Available. Use:');
  console.log('- firebaseDebug.enableDebug() to log all queries');
  console.log('- firebaseDebug.testPermissions() to test all collections');
  console.log('- firebaseDebug.logAuthState() to check auth state');
  console.log('- firebaseDebug.testQuery(collection, [constraints]) to test specific query');
}