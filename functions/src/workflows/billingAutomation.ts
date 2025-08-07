import * as admin from 'firebase-admin';
import type { FirestoreEvent, Change } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

interface TestResult {
  id: string;
  tenantId: string;
  patientId: string;
  testOrderId: string;
  testCode: string;
  testName: string;
  status: string;
  billingStatus?: string;
  billedAt?: admin.firestore.Timestamp;
}

interface BillingProfile {
  id: string;
  testCode: string;
  testName: string;
  basePrice: number;
  insurancePrice?: number;
  selfPayPrice?: number;
  cptCodes?: string[];
}

interface PatientInsurance {
  id: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
  isActive: boolean;
}

export const billingAutomation = async (
  event: FirestoreEvent<Change<DocumentSnapshot>, { tenantId: string; resultId: string }>
) => {
  console.log('Processing billing automation...');
  
  const { tenantId, resultId } = event.params;
  const snapshot = event.data.after;
  if (!snapshot.exists) return;
  
  const resultData = snapshot.data() as TestResult;
  
  try {
    // Skip if already billed or not validated
    if (resultData.billingStatus === 'billed' || resultData.status !== 'validated') {
      console.log(`Result ${resultId} skipped - status: ${resultData.status}, billing: ${resultData.billingStatus}`);
      return;
    }
    
    // Get billing profile for the test
    const billingProfile = await getBillingProfile(tenantId, resultData.testCode);
    if (!billingProfile) {
      console.error(`No billing profile found for test ${resultData.testCode}`);
      return;
    }
    
    // Get patient insurance information
    const patientInsurance = await getActiveInsurance(tenantId, resultData.patientId);
    
    // Create billing record
    const billingData = {
      resultId,
      testOrderId: resultData.testOrderId,
      patientId: resultData.patientId,
      testCode: resultData.testCode,
      testName: resultData.testName,
      billingType: patientInsurance ? 'insurance' : 'self_pay',
      basePrice: billingProfile.basePrice,
      finalPrice: patientInsurance ? billingProfile.insurancePrice : billingProfile.selfPayPrice,
      cptCodes: billingProfile.cptCodes || [],
      insuranceId: patientInsurance?.id,
      insuranceProvider: patientInsurance?.providerName,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    };
    
    const billingRef = await admin.firestore()
      .collection(`labflow_${tenantId}_billing`)
      .add(billingData);
    
    // Update result with billing status
    await snapshot.ref.update({
      billingStatus: 'billed',
      billingId: billingRef.id,
      billedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If insurance, create claim
    if (patientInsurance) {
      await createInsuranceClaim(tenantId, billingRef.id, billingData, patientInsurance);
    }
    
    console.log(`Billing record created: ${billingRef.id} for result ${resultId}`);
    
  } catch (error) {
    console.error('Error in billing automation:', error);
    
    await snapshot.ref.update({
      billingStatus: 'error',
      billingError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

async function getBillingProfile(tenantId: string, testCode: string): Promise<BillingProfile | null> {
  const doc = await admin.firestore()
    .collection(`labflow_${tenantId}_billing_profiles`)
    .where('testCode', '==', testCode)
    .where('isActive', '==', true)
    .limit(1)
    .get();
  
  if (doc.empty) return null;
  
  return { id: doc.docs[0].id, ...doc.docs[0].data() } as BillingProfile;
}

async function getActiveInsurance(tenantId: string, patientId: string): Promise<PatientInsurance | null> {
  const insuranceSnapshot = await admin.firestore()
    .collection(`labflow_${tenantId}_patient_insurance`)
    .where('patientId', '==', patientId)
    .where('isActive', '==', true)
    .where('isPrimary', '==', true)
    .limit(1)
    .get();
  
  if (insuranceSnapshot.empty) return null;
  
  return { id: insuranceSnapshot.docs[0].id, ...insuranceSnapshot.docs[0].data() } as PatientInsurance;
}

async function createInsuranceClaim(
  tenantId: string,
  billingId: string,
  billingData: any,
  insurance: PatientInsurance
) {
  const claimNumber = `CLM-${Date.now()}`;
  
  await admin.firestore()
    .collection(`labflow_${tenantId}_insurance_claims`)
    .add({
      claimNumber,
      billingId,
      patientId: billingData.patientId,
      insuranceId: insurance.id,
      providerId: insurance.providerId,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
      groupNumber: insurance.groupNumber,
      serviceDate: admin.firestore.FieldValue.serverTimestamp(),
      cptCodes: billingData.cptCodes,
      totalAmount: billingData.finalPrice,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    });
  
  console.log(`Insurance claim ${claimNumber} created for billing ${billingId}`);
}