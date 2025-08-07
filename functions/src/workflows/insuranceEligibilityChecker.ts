import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

interface InsuranceCheckRequest {
  data: {
    tenantId: string;
    patientId: string;
    insuranceId: string;
    testCodes: string[];
    serviceDate?: string;
  };
}

interface InsuranceProvider {
  id: string;
  name: string;
  apiEndpoint?: string;
  apiKey?: string;
  requiresAuth: boolean;
}

export const checkInsuranceEligibility = async (request: InsuranceCheckRequest) => {
  console.log('Verifying insurance eligibility...');
  
  const { tenantId, patientId, insuranceId, testCodes, serviceDate } = request.data;
  
  if (!tenantId || !patientId || !insuranceId || !testCodes?.length) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    // Get patient insurance details
    const insuranceDoc = await admin.firestore()
      .collection(`labflow_${tenantId}_patient_insurance`)
      .doc(insuranceId)
      .get();
    
    if (!insuranceDoc.exists) {
      throw new HttpsError('not-found', 'Insurance record not found');
    }
    
    const insurance = insuranceDoc.data();
    
    // Get insurance provider details
    const providerDoc = await admin.firestore()
      .collection(`labflow_${tenantId}_insurance_providers`)
      .doc(insurance.providerId)
      .get();
    
    if (!providerDoc.exists) {
      throw new HttpsError('not-found', 'Insurance provider not found');
    }
    
    const provider = providerDoc.data() as InsuranceProvider;
    
    // Mock eligibility check (replace with actual API call)
    const eligibilityResult = await checkEligibilityWithProvider(
      provider,
      insurance,
      testCodes,
      serviceDate || new Date().toISOString()
    );
    
    // Store eligibility check result
    const resultRef = await admin.firestore()
      .collection(`labflow_${tenantId}_eligibility_checks`)
      .add({
        patientId,
        insuranceId,
        providerId: provider.id,
        providerName: provider.name,
        testCodes,
        serviceDate,
        result: eligibilityResult,
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system'
      });
    
    return {
      success: true,
      eligibilityId: resultRef.id,
      result: eligibilityResult
    };
    
  } catch (error) {
    console.error('Error checking insurance eligibility:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to check insurance eligibility');
  }
};

async function checkEligibilityWithProvider(
  provider: InsuranceProvider,
  insurance: any,
  testCodes: string[],
  serviceDate: string
): Promise<any> {
  // Mock implementation - replace with actual API integration
  const mockResults = testCodes.map(testCode => ({
    testCode,
    covered: Math.random() > 0.2, // 80% coverage rate
    copay: Math.floor(Math.random() * 50) + 10,
    deductibleMet: Math.random() > 0.5,
    requiresPreAuth: testCode.includes('MRI') || testCode.includes('CT'),
    notes: ''
  }));
  
  return {
    eligible: true,
    policyActive: true,
    coverageDetails: mockResults,
    deductible: {
      total: 1000,
      met: 750,
      remaining: 250
    },
    outOfPocketMax: {
      total: 5000,
      met: 2000,
      remaining: 3000
    }
  };
}