import * as functions from 'firebase-functions';
import { db } from '../config/firebase';
import axios from 'axios';

const PROJECT_PREFIX = 'labflow_';

// Verify insurance eligibility
export const verifyInsuranceEligibility = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { payerId, memberId, dateOfService } = data;

  try {
    // Mock eligibility check - replace with actual payer API
    const eligibility = {
      eligible: true,
      coverageActive: true,
      copay: 25,
      deductible: 1500,
      deductibleMet: 750,
      outOfPocketMax: 5000,
      outOfPocketMet: 1200,
      coverageDetails: {
        labTests: {
          covered: true,
          coveragePercentage: 80,
          priorAuthRequired: false,
        },
      },
    };

    // Log verification
    await db.collection(`${PROJECT_PREFIX}insurance_verifications`).add({
      payerId,
      memberId,
      dateOfService,
      result: eligibility,
      verifiedBy: context.auth.uid,
      verifiedAt: new Date(),
    });

    return eligibility;
  } catch (error) {
    console.error('Error verifying insurance:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify insurance');
  }
});

// Submit insurance claim
export const submitInsuranceClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const claim = data;

  try {
    // Generate claim ID
    const claimId = `CLM${Date.now()}`;

    // Save claim
    await db.collection(`${PROJECT_PREFIX}insurance_claims`).doc(claimId).set({
      ...claim,
      claimId,
      status: 'submitted',
      submittedBy: context.auth.uid,
      submittedAt: new Date(),
    });

    // Mock claim submission - replace with actual payer API
    // await submitToPayerAPI(claim);

    return { claimId, status: 'submitted' };
  } catch (error) {
    console.error('Error submitting claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit claim');
  }
});

// Check claim status
export const checkClaimStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { claimId } = data;

  try {
    const claimDoc = await db.collection(`${PROJECT_PREFIX}insurance_claims`).doc(claimId).get();
    
    if (!claimDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Claim not found');
    }

    const claim = claimDoc.data();
    
    // Mock status check - replace with actual payer API
    const status = {
      status: claim?.status || 'submitted',
      lastUpdated: claim?.lastUpdated || claim?.submittedAt,
      details: {
        paymentAmount: claim?.status === 'approved' ? claim.amount * 0.8 : 0,
        denialReason: claim?.status === 'denied' ? 'Service not covered' : null,
      },
    };

    return status;
  } catch (error) {
    console.error('Error checking claim status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check claim status');
  }
});

// Process EDI 837 claim file
export const processEDI837 = functions.storage.object().onFinalize(async (object) => {
  if (!object.name?.includes('edi/837/')) return;

  try {
    // Process EDI file
    console.log('Processing EDI 837 file:', object.name);
    
    // Parse EDI file and extract claims
    // Submit claims to payers
    // Update claim statuses
  } catch (error) {
    console.error('Error processing EDI file:', error);
  }
});