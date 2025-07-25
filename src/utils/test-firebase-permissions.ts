/**
 * Test script to verify Firebase permissions are working correctly
 * Run this in the browser console after logging in
 */

import { collection, query, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useTenantStore } from '@/stores/tenant.store';
import { getFirestoreCollectionName, COLLECTION_NAMES, ROOT_COLLECTIONS, SHARED_COLLECTIONS } from '@/config/firebase-collections-helper';

export const runPermissionTests = async () => {
  console.log('🔍 Starting Firebase Permission Tests...\n');
  
  // Check auth state
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No user authenticated. Please login first.');
    return;
  }
  
  console.log('✅ User authenticated:', {
    uid: user.uid,
    email: user.email
  });
  
  // Check tenant
  const tenant = useTenantStore.getState().currentTenant;
  if (!tenant) {
    console.error('❌ No tenant selected. Please select a tenant.');
    return;
  }
  
  console.log('✅ Tenant selected:', {
    id: tenant.id,
    name: tenant.name
  });
  
  // Check tenant_user document
  console.log('\n📋 Checking tenant_user document...');
  try {
    const tenantUserDocId = `${user.uid}_${tenant.id}`;
    const tenantUserDoc = await getDoc(doc(db, ROOT_COLLECTIONS.TENANT_USERS, tenantUserDocId));
    
    if (!tenantUserDoc.exists()) {
      console.error(`❌ Tenant user document not found: ${tenantUserDocId}`);
      console.error('   This is required for accessing tenant-specific collections.');
    } else {
      const data = tenantUserDoc.data();
      console.log('✅ Tenant user found:', {
        docId: tenantUserDocId,
        role: data.role,
        isActive: data.isActive,
        tenantId: data.tenantId,
        userId: data.userId
      });
    }
  } catch (error: any) {
    console.error('❌ Error checking tenant_user:', error.message);
  }
  
  // Test root collections
  console.log('\n📁 Testing ROOT collections...');
  for (const [name, collectionName] of Object.entries(ROOT_COLLECTIONS)) {
    try {
      const q = query(collection(db, collectionName), limit(1));
      const snapshot = await getDocs(q);
      console.log(`✅ ${name} (${collectionName}): Accessible`);
    } catch (error: any) {
      console.error(`❌ ${name} (${collectionName}): ${error.message}`);
    }
  }
  
  // Test shared collections
  console.log('\n📁 Testing SHARED collections...');
  for (const [name, collectionName] of Object.entries(SHARED_COLLECTIONS)) {
    try {
      const q = query(collection(db, collectionName), limit(1));
      const snapshot = await getDocs(q);
      console.log(`✅ ${name} (${collectionName}): Accessible`);
    } catch (error: any) {
      console.error(`❌ ${name} (${collectionName}): ${error.message}`);
    }
  }
  
  // Test tenant-specific collections
  console.log('\n📁 Testing TENANT-SPECIFIC collections...');
  const criticalCollections = [
    'PATIENTS',
    'TESTS', 
    'SAMPLES',
    'RESULTS',
    'INVENTORY_ITEMS',
    'QC_TESTS',
    'REPORTS'
  ];
  
  for (const collectionKey of criticalCollections) {
    const collectionName = COLLECTION_NAMES[collectionKey as keyof typeof COLLECTION_NAMES];
    if (!collectionName) continue;
    
    try {
      const fullCollectionName = getFirestoreCollectionName(collectionName, tenant.id);
      console.log(`\n   Testing ${collectionKey}...`);
      console.log(`   Collection name: ${fullCollectionName}`);
      
      const q = query(collection(db, fullCollectionName), limit(1));
      const snapshot = await getDocs(q);
      
      console.log(`   ✅ ${collectionKey}: Access GRANTED (${snapshot.size} docs found)`);
    } catch (error: any) {
      console.error(`   ❌ ${collectionKey}: Access DENIED`);
      console.error(`      Error: ${error.message}`);
      console.error(`      Code: ${error.code}`);
    }
  }
  
  console.log('\n✅ Permission test complete!');
  console.log('\n💡 If you see "Missing or insufficient permissions" errors:');
  console.log('   1. Ensure the tenant_users document exists with your user ID and tenant ID');
  console.log('   2. Check that your role in tenant_users has the required permissions');
  console.log('   3. Verify the collection name format is: labflow_{tenantId}_{collection}');
  console.log('   4. Make sure Firebase rules and indexes are deployed');
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).testFirebasePermissions = runPermissionTests;
  console.log('💡 Run testFirebasePermissions() to test Firebase permissions');
}