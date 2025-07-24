// Browser Console Script to Create Demo Tenant
// Run this in the browser console while on the app

async function createDemoTenant() {
  const { firestore } = await import('/src/config/firebase.config.js');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  
  try {
    console.log('🚀 Creating demo tenant...');
    
    // Create demo tenant
    const tenantId = 'demo';
    const tenantData = {
      id: tenantId,
      name: 'Demo Laboratory',
      code: 'DEMO',
      type: 'clinical_lab',
      address: {
        street: '123 Lab Street',
        city: 'Demo City',
        state: 'DS',
        zipCode: '12345',
        country: 'USA'
      },
      contact: {
        phone: '+1 (555) 123-4567',
        email: 'admin@demolab.com',
        website: 'https://demolab.com'
      },
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        language: 'en'
      },
      features: {
        emrIntegration: true,
        barcodeScanning: true,
        biometricAuth: true,
        mobileApp: true,
        patientPortal: true
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(firestore, 'tenants', tenantId), tenantData);
    console.log('✅ Demo tenant created successfully!');
    console.log('📋 Now register with Tenant Code: DEMO');
    
  } catch (error) {
    console.error('❌ Error creating demo tenant:', error);
  }
}

// Run the function
createDemoTenant();