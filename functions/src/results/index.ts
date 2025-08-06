import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generatePDF } from '../services/pdfGeneratorService';

const db = admin.firestore();
const storage = admin.storage();

export const processResult = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sampleId, testId, values, performedBy } = request.data;

  try {
    // Get sample details
    const sampleDoc = await db.collection('labflow_samples').doc(sampleId).get();
    const sample = sampleDoc.data();

    if (!sample) {
      throw new functions.https.HttpsError('not-found', 'Sample not found');
    }

    // Get test details
    const testDoc = await db.collection('labflow_tests').doc(testId).get();
    const test = testDoc.data();

    if (!test) {
      throw new functions.https.HttpsError('not-found', 'Test not found');
    }

    // Validate results against reference ranges
    const validatedResults = validateResults(values, test.parameters);

    // Check for critical values
    const criticalValues = checkCriticalValues(validatedResults, test.parameters);

    // Create result document
    const resultRef = await db.collection('labflow_results').add({
      sampleId,
      testId,
      patientId: sample.patientId,
      values: validatedResults,
      status: 'pending_verification',
      performedBy,
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
      hasCriticalValues: criticalValues.length > 0,
      criticalValues,
      tenantId: sample.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update sample status
    await db.collection('labflow_samples').doc(sampleId).update({
      status: 'results_entered',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If critical values, trigger notification
    if (criticalValues.length > 0) {
      // Trigger critical result notification
      // This will be handled by a separate function or scheduled job
      await db.collection('labflow_notifications').add({
        type: 'critical_result',
        resultId: resultRef.id,
        patientId: sample.patientId,
        clinicianId: sample.orderingPhysician,
        values: criticalValues,
        status: 'pending',
        tenantId: sample.tenantId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { 
      success: true, 
      resultId: resultRef.id,
      hasCriticalValues: criticalValues.length > 0 
    };
  } catch (error) {
    console.error('Error processing result:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process result');
  }
});

export const verifyResult = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth || !['LAB_SUPERVISOR', 'PATHOLOGIST', 'ADMIN'].includes(request.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized to verify results');
  }

  const { resultId, comments } = request.data;

  try {
    const resultDoc = await db.collection('labflow_results').doc(resultId).get();
    const result = resultDoc.data();

    if (!result) {
      throw new functions.https.HttpsError('not-found', 'Result not found');
    }

    // Update result status
    await db.collection('labflow_results').doc(resultId).update({
      status: 'completed',
      verifiedBy: request.auth.uid,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationComments: comments,
    });

    // Generate PDF report
    const pdfUrl = await generateResultPDF(resultId, result);

    // Update with PDF URL
    await db.collection('labflow_results').doc(resultId).update({
      reportUrl: pdfUrl,
    });

    // Trigger result ready notification
    await db.collection('labflow_notifications').add({
      type: 'result_verified',
      resultId,
      patientId: result.patientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, reportUrl: pdfUrl };
  } catch (error) {
    console.error('Error verifying result:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify result');
  }
});

function validateResults(values: any, parameters: any[]): any {
  const validated: any = {};

  parameters.forEach(param => {
    const value = values[param.code];
    if (value !== undefined && value !== null) {
      const numValue = parseFloat(value);
      
      validated[param.code] = {
        value: numValue,
        unit: param.unit,
        referenceRange: param.referenceRange,
        flag: determineFlag(numValue, param.referenceRange),
      };
    }
  });

  return validated;
}

function checkCriticalValues(results: any, parameters: any[]): any[] {
  const critical: any[] = [];

  parameters.forEach(param => {
    const result = results[param.code];
    if (result && param.criticalRange) {
      const value = result.value;
      const { low, high } = param.criticalRange;

      if ((low !== undefined && value < low) || (high !== undefined && value > high)) {
        critical.push({
          parameter: param.name,
          code: param.code,
          value: result.value,
          unit: result.unit,
          criticalRange: param.criticalRange,
        });
      }
    }
  });

  return critical;
}

function determineFlag(value: number, referenceRange: any): string {
  if (!referenceRange) return 'normal';
  
  const { low, high } = referenceRange;
  
  if (low !== undefined && value < low) return 'low';
  if (high !== undefined && value > high) return 'high';
  
  return 'normal';
}

async function generateResultPDF(resultId: string, result: any): Promise<string> {
  try {
    // Get patient details
    const patientDoc = await db.collection('labflow_patients').doc(result.patientId).get();
    const patient = patientDoc.data();

    // Get test details
    const testDoc = await db.collection('labflow_tests').doc(result.testId).get();
    const test = testDoc.data();

    // Generate PDF
    const pdfBuffer = await generatePDF({
      template: 'lab-result',
      data: {
        resultId,
        patient,
        test,
        result,
        generatedAt: new Date(),
      },
    });

    // Upload to storage
    const bucket = storage.bucket();
    const fileName = `labflow/results/${result.tenantId}/${resultId}.pdf`;
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    // Get download URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2500', // Far future date
    });

    return url;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}