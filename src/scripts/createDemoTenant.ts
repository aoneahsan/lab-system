import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase.config';
import { logger } from '@/services/logger.service';

// This script creates a demo tenant that users can use immediately
// Run this once to set up the demo tenant in Firestore

export const createDemoTenant = async () => {
  const demoCode = 'DEMO';

  try {
    await setDoc(doc(firestore, 'tenants', demoCode.toLowerCase()), {
      id: demoCode.toLowerCase(),
      code: demoCode,
      name: 'Demo Laboratory - Public Access',
      type: 'demo',
      address: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'DC',
        zipCode: '12345',
        country: 'USA',
      },
      contact: {
        email: 'demo@labflow.com',
        phone: '(555) 123-4567',
        fax: '(555) 123-4568',
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        resultFormat: 'standard',
        criticalValueNotification: true,
      },
      features: {
        billing: true,
        inventory: true,
        qualityControl: true,
        emrIntegration: true,
        mobileApps: true,
      },
      subscription: {
        plan: 'demo',
        status: 'active',
        validUntil: new Date('2025-12-31'), // Valid for a long time
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.log('Demo tenant created successfully with code: DEMO');
  } catch (error) {
    logger.error('Error creating demo tenant:', error);
  }
};

// Uncomment the line below and run this file once to create the demo tenant
// createDemoTenant();
