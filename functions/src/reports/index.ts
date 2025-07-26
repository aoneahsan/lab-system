import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generatePDF } from '../services/pdfGeneratorService';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const db = admin.firestore();
const storage = admin.storage();

export const generateMonthlyReport = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['ADMIN', 'LAB_SUPERVISOR'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { tenantId, month, year } = data;
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  try {
    // Gather report data
    const reportData = await gatherMonthlyReportData(tenantId, startDate, endDate);

    // Generate PDF
    const pdfBuffer = await generatePDF({
      template: 'monthly-report',
      data: {
        tenantId,
        period: format(startDate, 'MMMM yyyy'),
        ...reportData,
        generatedAt: new Date(),
        generatedBy: context.auth.uid,
      },
    });

    // Save to storage
    const fileName = `labflow/reports/${tenantId}/monthly/${year}-${month.toString().padStart(2, '0')}.pdf`;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2500',
    });

    // Save report record
    await db.collection('labflow_reports').add({
      type: 'monthly',
      tenantId,
      period: { month, year },
      url,
      data: reportData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    return { success: true, url };
  } catch (error) {
    console.error('Error generating monthly report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

export const generatePatientReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { patientId, startDate, endDate } = data;

  try {
    // Verify access
    if (context.auth.token.role === 'PATIENT' && context.auth.uid !== patientId) {
      throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
    }

    // Get patient details
    const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
    const patient = patientDoc.data();

    if (!patient) {
      throw new functions.https.HttpsError('not-found', 'Patient not found');
    }

    // Get results within date range
    const resultsQuery = await db.collection('labflow_results')
      .where('patientId', '==', patientId)
      .where('status', '==', 'completed')
      .where('performedAt', '>=', new Date(startDate))
      .where('performedAt', '<=', new Date(endDate))
      .orderBy('performedAt', 'desc')
      .get();

    const results = resultsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Generate PDF
    const pdfBuffer = await generatePDF({
      template: 'patient-report',
      data: {
        patient,
        results,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        generatedAt: new Date(),
      },
    });

    // Save to storage
    const fileName = `labflow/reports/${patient.tenantId}/patients/${patientId}/${Date.now()}.pdf`;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2500',
    });

    return { success: true, url };
  } catch (error) {
    console.error('Error generating patient report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

export const generateQualityControlReport = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['ADMIN', 'LAB_SUPERVISOR', 'QC_SPECIALIST'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { tenantId, analyzerId, startDate, endDate } = data;

  try {
    // Get QC data
    const qcQuery = await db.collection('labflow_qc_results')
      .where('tenantId', '==', tenantId)
      .where('analyzerId', '==', analyzerId)
      .where('performedAt', '>=', new Date(startDate))
      .where('performedAt', '<=', new Date(endDate))
      .orderBy('performedAt', 'asc')
      .get();

    const qcData = qcQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate statistics
    const statistics = calculateQCStatistics(qcData);

    // Generate Levey-Jennings charts data
    const chartData = generateLeveyJenningsData(qcData);

    // Generate PDF
    const pdfBuffer = await generatePDF({
      template: 'qc-report',
      data: {
        tenantId,
        analyzerId,
        period: {
          start: new Date(startDate),
          end: new Date(endDate),
        },
        statistics,
        chartData,
        qcData,
        generatedAt: new Date(),
        generatedBy: context.auth.uid,
      },
    });

    // Save to storage
    const fileName = `labflow/reports/${tenantId}/qc/${analyzerId}/${Date.now()}.pdf`;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2500',
    });

    return { success: true, url, statistics };
  } catch (error) {
    console.error('Error generating QC report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

async function gatherMonthlyReportData(tenantId: string, startDate: Date, endDate: Date) {
  // Get test statistics
  const testsQuery = await db.collection('labflow_results')
    .where('tenantId', '==', tenantId)
    .where('performedAt', '>=', startDate)
    .where('performedAt', '<=', endDate)
    .get();

  const totalTests = testsQuery.size;
  const testsByStatus = testsQuery.docs.reduce((acc, doc) => {
    const status = doc.data().status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get TAT statistics
  const tatData = testsQuery.docs.map(doc => {
    const data = doc.data();
    const collected = data.collectedAt?.toDate();
    const completed = data.completedAt?.toDate();
    if (collected && completed) {
      return (completed.getTime() - collected.getTime()) / (1000 * 60 * 60); // Hours
    }
    return null;
  }).filter(Boolean) as number[];

  const avgTAT = tatData.length > 0 
    ? tatData.reduce((a, b) => a + b, 0) / tatData.length 
    : 0;

  // Get revenue data
  const billingQuery = await db.collection('labflow_billing')
    .where('tenantId', '==', tenantId)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const totalRevenue = billingQuery.docs.reduce((sum, doc) => {
    return sum + (doc.data().amount || 0);
  }, 0);

  // Get patient statistics
  const patientsQuery = await db.collection('labflow_patients')
    .where('tenantId', '==', tenantId)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const newPatients = patientsQuery.size;

  return {
    totalTests,
    testsByStatus,
    avgTAT: Math.round(avgTAT * 10) / 10,
    totalRevenue,
    newPatients,
    period: {
      start: startDate,
      end: endDate,
    },
  };
}

function calculateQCStatistics(qcData: any[]): any {
  const parameterStats: Record<string, any> = {};

  qcData.forEach(result => {
    Object.entries(result.values || {}).forEach(([param, value]) => {
      if (!parameterStats[param]) {
        parameterStats[param] = {
          values: [],
          mean: 0,
          sd: 0,
          cv: 0,
          violations: 0,
        };
      }
      parameterStats[param].values.push(value as number);
    });
  });

  // Calculate statistics for each parameter
  Object.keys(parameterStats).forEach(param => {
    const values = parameterStats[param].values;
    const n = values.length;
    
    // Mean
    const mean = values.reduce((a: number, b: number) => a + b, 0) / n;
    
    // Standard deviation
    const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    
    // Coefficient of variation
    const cv = (sd / mean) * 100;
    
    // Check for Westgard rule violations
    const violations = checkWestgardRules(values, mean, sd);
    
    parameterStats[param] = {
      ...parameterStats[param],
      mean: Math.round(mean * 100) / 100,
      sd: Math.round(sd * 100) / 100,
      cv: Math.round(cv * 100) / 100,
      violations,
    };
  });

  return parameterStats;
}

function checkWestgardRules(values: number[], mean: number, sd: number): number {
  let violations = 0;
  
  // 1-3s rule: One control exceeds ±3SD
  values.forEach(value => {
    if (Math.abs(value - mean) > 3 * sd) violations++;
  });
  
  // 2-2s rule: Two consecutive controls exceed ±2SD
  for (let i = 1; i < values.length; i++) {
    if (Math.abs(values[i] - mean) > 2 * sd && 
        Math.abs(values[i-1] - mean) > 2 * sd) {
      violations++;
    }
  }
  
  return violations;
}

function generateLeveyJenningsData(qcData: any[]): any {
  // Transform QC data for Levey-Jennings chart format
  return qcData.map(result => ({
    date: result.performedAt.toDate(),
    values: result.values,
    violations: result.violations || [],
  }));
}