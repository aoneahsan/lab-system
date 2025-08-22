import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { logger } from '@/services/logger.service';

export const initializeDemoTenant = async () => {
  try {
    // Check if DEMO tenant already exists
    const demoDoc = await getDoc(doc(firestore, 'tenants', 'demo'));

    if (!demoDoc.exists()) {
      logger.log('Creating DEMO tenant...');

      // Create DEMO tenant
      await setDoc(doc(firestore, 'tenants', 'demo'), {
        id: 'demo',
        code: 'DEMO',
        name: 'Demo Laboratory',
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
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      logger.log('✅ DEMO tenant created successfully');
    }
  } catch {
    // Silently fail if no permissions - this is expected for regular users
    logger.log('Could not initialize DEMO tenant - this is normal for non-admin users');
  }
};
