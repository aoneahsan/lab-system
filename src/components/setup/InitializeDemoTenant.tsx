import { useEffect, useState } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { COLLECTIONS } from '@/config/firebase-collections';

const InitializeDemoTenant = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initializeDemoTenant = async () => {
      try {
        // Check if DEMO tenant already exists
        const demoDoc = await getDoc(doc(firestore, 'tenants', 'demo'));
        
        if (!demoDoc.exists()) {
          // Create DEMO tenant
          await setDoc(doc(firestore, 'tenants', 'demo'), {
            id: 'demo',
            code: 'DEMO',
            name: 'Demo Laboratory - Public Access',
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
              criticalValueNotification: true,
              requireOrderApproval: false,
              autoReleaseNormalResults: true,
              defaultTAT: 24, // hours
              enableSMS: true,
              enableEmail: true,
              enablePatientPortal: true
            },
            features: {
              billing: true,
              inventory: true,
              qualityControl: true,
              emrIntegration: true,
              mobileApps: true,
              barcoding: true,
              analytics: true,
              multiLanguage: true
            },
            subscription: {
              plan: 'demo',
              status: 'active',
              validUntil: new Date('2025-12-31'),
              maxUsers: 100,
              maxPatients: 10000,
              maxTestsPerMonth: 50000
            },
            branding: {
              primaryColor: '#2563eb',
              logo: '/demo-logo.png',
              reportHeader: 'Demo Laboratory Report'
            },
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log('DEMO tenant created successfully');
          
          // Create demo insurance providers
          const providersRef = collection(firestore, 'demo_insurance_providers');
          const existingProviders = await getDocs(query(providersRef, where('tenantId', '==', 'demo')));
          
          if (existingProviders.empty) {
            const demoProviders = [
              {
                tenantId: 'demo',
                name: 'Blue Cross Blue Shield',
                code: 'BCBS',
                type: 'ppo',
                payerId: 'BCBS001',
                claimFormats: ['837P', 'CMS-1500'],
                submissionMethod: 'electronic',
                contact: {
                  email: 'claims@bcbs-demo.com',
                  phone: '(800) 123-4567',
                  address: {
                    street: '100 Insurance Way',
                    city: 'Chicago',
                    state: 'IL',
                    zipCode: '60601'
                  }
                },
                requirements: {
                  preAuthorization: true,
                  referralRequired: false,
                  timeLimitDays: 90
                },
                reimbursementRates: {
                  labTests: 0.80,
                  procedures: 0.75,
                  supplies: 0.70
                },
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                tenantId: 'demo',
                name: 'United Healthcare',
                code: 'UHC',
                type: 'hmo',
                payerId: 'UHC001',
                claimFormats: ['837P', 'CMS-1500'],
                submissionMethod: 'electronic',
                contact: {
                  email: 'claims@uhc-demo.com',
                  phone: '(800) 234-5678',
                  address: {
                    street: '200 Health Plaza',
                    city: 'Minneapolis',
                    state: 'MN',
                    zipCode: '55401'
                  }
                },
                requirements: {
                  preAuthorization: true,
                  referralRequired: true,
                  timeLimitDays: 60
                },
                reimbursementRates: {
                  labTests: 0.85,
                  procedures: 0.80,
                  supplies: 0.75
                },
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                tenantId: 'demo',
                name: 'Aetna',
                code: 'AETNA',
                type: 'ppo',
                payerId: 'AET001',
                claimFormats: ['837P', 'CMS-1500'],
                submissionMethod: 'electronic',
                contact: {
                  email: 'claims@aetna-demo.com',
                  phone: '(800) 345-6789',
                  address: {
                    street: '300 Coverage Blvd',
                    city: 'Hartford',
                    state: 'CT',
                    zipCode: '06101'
                  }
                },
                requirements: {
                  preAuthorization: false,
                  referralRequired: false,
                  timeLimitDays: 120
                },
                reimbursementRates: {
                  labTests: 0.90,
                  procedures: 0.85,
                  supplies: 0.80
                },
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                tenantId: 'demo',
                name: 'Medicare',
                code: 'MEDICARE',
                type: 'government',
                payerId: 'MCARE001',
                claimFormats: ['837P', 'CMS-1500'],
                submissionMethod: 'electronic',
                contact: {
                  email: 'provider@medicare.gov',
                  phone: '(800) 633-4227',
                  address: {
                    street: '7500 Security Blvd',
                    city: 'Baltimore',
                    state: 'MD',
                    zipCode: '21244'
                  }
                },
                requirements: {
                  preAuthorization: false,
                  referralRequired: false,
                  timeLimitDays: 365
                },
                reimbursementRates: {
                  labTests: 1.00,
                  procedures: 0.80,
                  supplies: 0.80
                },
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                tenantId: 'demo',
                name: 'Medicaid',
                code: 'MEDICAID',
                type: 'government',
                payerId: 'MCAID001',
                claimFormats: ['837P', 'CMS-1500'],
                submissionMethod: 'electronic',
                contact: {
                  email: 'provider@medicaid.gov',
                  phone: '(800) 318-2596',
                  address: {
                    street: '200 Independence Ave SW',
                    city: 'Washington',
                    state: 'DC',
                    zipCode: '20201'
                  }
                },
                requirements: {
                  preAuthorization: true,
                  referralRequired: false,
                  timeLimitDays: 180
                },
                reimbursementRates: {
                  labTests: 0.65,
                  procedures: 0.60,
                  supplies: 0.55
                },
                active: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ];
            
            // Create insurance providers
            for (const provider of demoProviders) {
              await setDoc(doc(collection(firestore, 'demo_insurance_providers')), provider);
            }
            
            console.log('Demo insurance providers created successfully');
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing DEMO tenant:', error);
      } finally {
        setIsChecking(false);
      }
    };

    initializeDemoTenant();
  }, []);

  // This component doesn't render anything
  return null;
};

export default InitializeDemoTenant;