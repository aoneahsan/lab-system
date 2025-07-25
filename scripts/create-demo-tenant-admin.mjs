#!/usr/bin/env node

// This script requires Firebase Admin SDK and service account credentials
// To use:
// 1. Go to Firebase Console > Project Settings > Service Accounts
// 2. Generate new private key
// 3. Save as 'serviceAccountKey.json' in the scripts folder
// 4. Run: node scripts/create-demo-tenant-admin.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
let serviceAccount;
try {
  const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Service account key not found!');
  console.log('\nTo create the DEMO tenant:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Generate new private key');
  console.log('3. Save as scripts/serviceAccountKey.json');
  console.log('4. Run this script again\n');
  console.log('OR');
  console.log('\n1. Start the dev server: yarn dev');
  console.log('2. Navigate to: http://localhost:6293/setup-demo');
  console.log('3. Click "Create Demo Laboratory"');
  console.log('4. Use the generated code or "DEMO" to register\n');
  process.exit(1);
}

// Initialize admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function createDemoTenant() {
  try {
    console.log('🚀 Creating DEMO tenant...');
    
    const tenantData = {
      id: 'demo',
      code: 'DEMO',
      name: 'Demo Laboratory',
      type: 'demo',
      address: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'DC',
        zipCode: '12345',
        country: 'USA'
      },
      contact: {
        email: 'demo@labflow.com',
        phone: '(555) 123-4567',
        fax: '(555) 123-4568'
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        resultFormat: 'standard',
        criticalValueNotification: true
      },
      features: {
        billing: true,
        inventory: true,
        qualityControl: true,
        emrIntegration: true,
        mobileApps: true
      },
      subscription: {
        plan: 'demo',
        status: 'active',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('tenants').doc('demo').set(tenantData);
    
    console.log('✅ DEMO tenant created successfully!');
    console.log('\n📋 You can now register with:');
    console.log('Tenant Code: DEMO');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating DEMO tenant:', error);
    process.exit(1);
  }
}

createDemoTenant();