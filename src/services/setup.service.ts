import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Tenant } from '@/types/tenant.types';

export const setupService = {
  async createDemoTenant(): Promise<void> {
    const tenantId = 'demo';
    const tenantData: Omit<Tenant, 'id'> = {
      name: 'Demo Laboratory',
      code: 'DEMO',
      description: 'Demo laboratory for testing LabFlow features',
      logo: '',
      firebasePrefix: 'labflow_demo_',
      isActive: true,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date(),
        endDate: undefined,
        billingCycle: 'yearly',
        maxUsers: 100,
        maxPatients: 10000,
        maxTestsPerMonth: 50000,
        storageQuotaGB: 100,
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
        language: 'en',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        addressFormat: 'US',
        features: {
          enableBilling: true,
          enableInventory: true,
          enableAppointments: true,
          enableTelemedicine: false,
          enablePatientPortal: true,
          enableMobileApp: true,
          enableBiometricAuth: true,
          enableOfflineMode: true,
          enableQualityControl: true,
          enableInsuranceClaims: true,
          enableHL7Integration: true,
          enableFHIRIntegration: true
        },
        branding: {
          primaryColor: '#0ea5e9',
          secondaryColor: '#64748b',
          logoUrl: '',
          companyName: 'Demo Laboratory',
          companyAddress: '123 Lab Street, Demo City, CA 90210',
          companyPhone: '+1 (555) 123-4567',
          companyEmail: 'admin@demolab.com',
          companyWebsite: 'https://demolab.com'
        },
        notifications: {
          enableEmailNotifications: true,
          enableSMSNotifications: true,
          enablePushNotifications: true,
          enableInAppNotifications: true,
          criticalResultsNotification: 'both',
          appointmentReminders: true,
          resultReadyNotifications: true
        },
        integrations: {
          emrSystem: 'demo',
          lisSystem: 'demo',
          billingSystem: 'demo'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      metadata: {
        setupVersion: '1.0.0',
        demoData: true
      }
    };
    
    // Create the tenant document
    await setDoc(doc(db, 'tenants', tenantId), {
      ...tenantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async createDemoData(tenantId: string = 'demo'): Promise<void> {
    // Create some sample test catalog items
    const testCatalogRef = doc(db, `labflow_${tenantId}_test_catalog`, 'cbc');
    await setDoc(testCatalogRef, {
      testCode: 'CBC',
      testName: 'Complete Blood Count',
      category: 'hematology',
      subCategory: 'routine',
      sampleType: 'blood',
      sampleVolume: '3ml',
      container: 'EDTA',
      turnaroundTime: 4,
      price: 25.00,
      isActive: true,
      loincCode: '58410-2',
      cptCode: '85025',
      parameters: [
        { name: 'WBC', unit: '10^3/μL', referenceMin: 4.5, referenceMax: 11.0 },
        { name: 'RBC', unit: '10^6/μL', referenceMin: 4.5, referenceMax: 5.5 },
        { name: 'Hemoglobin', unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5 },
        { name: 'Hematocrit', unit: '%', referenceMin: 41, referenceMax: 53 },
        { name: 'Platelets', unit: '10^3/μL', referenceMin: 150, referenceMax: 400 }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const lipidRef = doc(db, `labflow_${tenantId}_test_catalog`, 'lipid-panel');
    await setDoc(lipidRef, {
      testCode: 'LIPID',
      testName: 'Lipid Panel',
      category: 'chemistry',
      subCategory: 'cardiovascular',
      sampleType: 'blood',
      sampleVolume: '5ml',
      container: 'SST',
      turnaroundTime: 8,
      price: 45.00,
      isActive: true,
      loincCode: '57698-3',
      cptCode: '80061',
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', referenceMin: 0, referenceMax: 200 },
        { name: 'LDL Cholesterol', unit: 'mg/dL', referenceMin: 0, referenceMax: 100 },
        { name: 'HDL Cholesterol', unit: 'mg/dL', referenceMin: 40, referenceMax: 60 },
        { name: 'Triglycerides', unit: 'mg/dL', referenceMin: 0, referenceMax: 150 }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create a sample patient
    const patientRef = doc(db, `labflow_${tenantId}_patients`, 'demo-patient-1');
    await setDoc(patientRef, {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-01-15'),
      gender: 'male',
      email: 'john.doe@example.com',
      phone: '+1 (555) 234-5678',
      address: {
        street: '456 Patient Ave',
        city: 'Demo City',
        state: 'CA',
        zip: '90210',
        country: 'USA'
      },
      patientId: 'P2024001',
      tenantId: tenantId,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Create sample statistics docs for dashboard
    const statsRef = doc(db, `labflow_${tenantId}_stats`, 'dashboard');
    await setDoc(statsRef, {
      totalPatients: 1,
      testsToday: 0,
      pendingResults: 0,
      revenueToday: 0,
      updatedAt: serverTimestamp()
    });
  }
};