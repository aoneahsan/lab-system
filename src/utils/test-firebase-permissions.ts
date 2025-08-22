/**
 * Test script to verify Firebase permissions are working correctly
 * Run this in the browser console after logging in
 */

import { collection, query, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { useTenantStore } from '@/stores/tenant.store';
import { logger } from '@/services/logger.service';
import {
  getFirestoreCollectionName,
  COLLECTION_NAMES,
  ROOT_COLLECTIONS,
  SHARED_COLLECTIONS,
} from '@/config/firebase-collections-helper';

export const runPermissionTests = async () => {
  logger.log('🔍 Starting Firebase Permission Tests...\n');

  // Check auth state
  const user = auth.currentUser;
  if (!user) {
    logger.error('❌ No user authenticated. Please login first.');
    return;
  }

  logger.log('✅ User authenticated:', {
    uid: user.uid,
    email: user.email,
  });

  // Check tenant
  const tenant = useTenantStore.getState().currentTenant;
  if (!tenant) {
    logger.error('❌ No tenant selected. Please select a tenant.');
    return;
  }

  logger.log('✅ Tenant selected:', {
    id: tenant.id,
    name: tenant.name,
  });

  // Check tenant_user document
  logger.log('\n📋 Checking tenant_user document...');
  try {
    const tenantUserDocId = `${user.uid}_${tenant.id}`;
    const tenantUserDoc = await getDoc(doc(db, ROOT_COLLECTIONS.TENANT_USERS, tenantUserDocId));

    if (!tenantUserDoc.exists()) {
      logger.error(`❌ Tenant user document not found: ${tenantUserDocId}`);
      logger.error('   This is required for accessing tenant-specific collections.');
    } else {
      const data = tenantUserDoc.data();
      logger.log('✅ Tenant user found:', {
        docId: tenantUserDocId,
        role: data.role,
        isActive: data.isActive,
        tenantId: data.tenantId,
        userId: data.userId,
      });
    }
  } catch (error: any) {
    logger.error('❌ Error checking tenant_user:', error.message);
  }

  // Test root collections
  logger.log('\n📁 Testing ROOT collections...');
  for (const [name, collectionName] of Object.entries(ROOT_COLLECTIONS)) {
    try {
      const q = query(collection(db, collectionName), limit(1));
      await getDocs(q);
      logger.log(`✅ ${name} (${collectionName}): Accessible`);
    } catch (error: any) {
      logger.error(`❌ ${name} (${collectionName}): ${error.message}`);
    }
  }

  // Test shared collections
  logger.log('\n📁 Testing SHARED collections...');
  for (const [name, collectionName] of Object.entries(SHARED_COLLECTIONS)) {
    try {
      const q = query(collection(db, collectionName), limit(1));
      await getDocs(q);
      logger.log(`✅ ${name} (${collectionName}): Accessible`);
    } catch (error: any) {
      logger.error(`❌ ${name} (${collectionName}): ${error.message}`);
    }
  }

  // Test tenant-specific collections
  logger.log('\n📁 Testing TENANT-SPECIFIC collections...');
  const criticalCollections = [
    'PATIENTS',
    'TESTS',
    'SAMPLES',
    'RESULTS',
    'INVENTORY_ITEMS',
    'QC_TESTS',
    'REPORTS',
  ];

  for (const collectionKey of criticalCollections) {
    const collectionName = COLLECTION_NAMES[collectionKey as keyof typeof COLLECTION_NAMES];
    if (!collectionName) continue;

    try {
      const fullCollectionName = getFirestoreCollectionName(collectionName, tenant.id);
      logger.log(`\n   Testing ${collectionKey}...`);
      logger.log(`   Collection name: ${fullCollectionName}`);

      const q = query(collection(db, fullCollectionName), limit(1));
      const snapshot = await getDocs(q);

      logger.log(`   ✅ ${collectionKey}: Access GRANTED (${snapshot.size} docs found)`);
    } catch (error: any) {
      logger.error(`   ❌ ${collectionKey}: Access DENIED`);
      logger.error(`      Error: ${error.message}`);
      logger.error(`      Code: ${error.code}`);
    }
  }

  logger.log('\n✅ Permission test complete!');
  logger.log('\n💡 If you see "Missing or insufficient permissions" errors:');
  logger.log('   1. Ensure the tenant_users document exists with your user ID and tenant ID');
  logger.log('   2. Check that your role in tenant_users has the required permissions');
  logger.log('   3. Verify the collection name format is: labflow_{tenantId}_{collection}');
  logger.log('   4. Make sure Firebase rules and indexes are deployed');
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).testFirebasePermissions = runPermissionTests;
  logger.log('💡 Run testFirebasePermissions() to test Firebase permissions');
}
