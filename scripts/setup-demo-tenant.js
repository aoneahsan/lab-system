import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config from .env.production
const firebaseConfig = {
  apiKey: "AIzaSyBPQpNhG7BrNGD7fd29tG3VQSa5qBNUuG0",
  authDomain: "labsystem-a1.firebaseapp.com",
  projectId: "labsystem-a1",
  storageBucket: "labsystem-a1.firebasestorage.app",
  messagingSenderId: "451270476612",
  appId: "1:451270476612:web:c3b8bc2f7bb82cbe45aba6",
  measurementId: "G-CLWPVKC56X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const setupDemoTenant = async () => {
  console.log('Setting up demo tenant...');
  
  try {
    const tenantId = 'demo';
    const tenantData = {
      id: tenantId,
      name: 'Demo Laboratory',
      email: 'admin@demolab.com',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Lab Street',
        city: 'Demo City',
        state: 'CA',
        zip: '90210',
        country: 'USA'
      },
      isActive: true,
      subscription: {
        plan: 'enterprise',
        startDate: serverTimestamp(),
        endDate: null,
        maxUsers: 100,
        maxPatients: 10000,
        maxTestsPerMonth: 50000,
        features: [
          'patient_management',
          'test_management', 
          'sample_tracking',
          'result_management',
          'billing',
          'inventory',
          'quality_control',
          'reports',
          'mobile_apps',
          'emr_integration'
        ]
      },
      settings: {
        timeZone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        language: 'en',
        features: {
          enableHomeCollection: true,
          enableAppointments: true,
          enableTelemedicine: false,
          enableBiometricAuth: true,
          requireTwoFactor: false,
          enableOfflineMode: true,
          enableBarcodeScanning: true,
          enableVoiceDictation: true
        },
        resultSettings: {
          requirePathologistApproval: true,
          autoReleaseNormalResults: false,
          criticalValueNotification: true,
          resultAmendmentAllowed: true,
          maxAmendmentDays: 7
        },
        billingSettings: {
          taxRate: 8.25,
          defaultPaymentTerms: 30,
          enableOnlinePayments: true,
          acceptedPaymentMethods: ['cash', 'credit_card', 'insurance', 'check'],
          requirePaymentBeforeResults: false
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          resultReadyNotification: true,
          appointmentReminders: true,
          criticalResultAlerts: true
        }
      },
      metadata: {
        logoUrl: '',
        primaryColor: '#0ea5e9',
        secondaryColor: '#64748b',
        customFields: {}
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Create the tenant document
    await setDoc(doc(db, 'tenants', tenantId), tenantData);
    console.log('✅ Demo tenant created successfully!');
    
    // Create demo collections for the tenant
    const collections = [
      'labflow_demo_users',
      'labflow_demo_patients', 
      'labflow_demo_tests',
      'labflow_demo_samples',
      'labflow_demo_results',
      'labflow_demo_billing',
      'labflow_demo_inventory',
      'labflow_demo_quality_control',
      'labflow_demo_audit_logs',
      'labflow_demo_test_catalog',
      'labflow_demo_insurance',
      'labflow_demo_appointments',
      'labflow_demo_reports',
      'labflow_demo_test_orders',
      'labflow_demo_invoices',
      'labflow_demo_payments',
      'labflow_demo_insurance_claims',
      'labflow_demo_qc_runs',
      'labflow_demo_vendors',
      'labflow_demo_equipment',
      'labflow_demo_test_panels',
      'labflow_demo_result_validations',
      'labflow_demo_custom_fields',
      'labflow_demo_home_collections',
      'labflow_demo_collection_routes',
      'labflow_demo_emr_connections',
      'labflow_demo_webhooks',
      'labflow_demo_notification_templates',
      'labflow_demo_workflow_rules',
      'labflow_demo_report_templates',
      'labflow_demo_customer_feedback',
      'labflow_demo_reagents',
      'labflow_demo_consumables',
      'labflow_demo_purchase_orders',
      'labflow_demo_stock_movements',
      'labflow_demo_reagent_lots',
      'labflow_demo_calibrations',
      'labflow_demo_maintenance_logs',
      'labflow_demo_test_methods',
      'labflow_demo_reference_ranges',
      'labflow_demo_loinc_mappings',
      'labflow_demo_hl7_mappings',
      'labflow_demo_interface_logs',
      'labflow_demo_fhir_resources',
      'labflow_demo_sample_containers',
      'labflow_demo_collection_sites',
      'labflow_demo_courier_tracking',
      'labflow_demo_sample_rejections'
    ];
    
    // Create placeholder documents for each collection to initialize them
    console.log('Creating demo collections...');
    for (const collectionName of collections) {
      await setDoc(doc(db, collectionName, '_placeholder'), {
        _isPlaceholder: true,
        createdAt: serverTimestamp(),
        description: 'This is a placeholder document to initialize the collection'
      });
      console.log(`  ✓ Created ${collectionName}`);
    }
    
    console.log('\n✅ All demo collections created successfully!');
    console.log('\nDemo tenant setup complete. You can now log in with a user that has tenantId: "demo"');
    
  } catch (error) {
    console.error('❌ Error setting up demo tenant:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the setup
setupDemoTenant();