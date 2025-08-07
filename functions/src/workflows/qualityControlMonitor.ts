import * as admin from 'firebase-admin';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

interface QCResult {
  id: string;
  tenantId: string;
  testCode: string;
  testName: string;
  controlLevel: 'low' | 'normal' | 'high';
  value: number;
  unit: string;
  mean: number;
  sd: number;
  cv?: number;
  status?: 'pass' | 'warning' | 'fail';
  westgardRules?: string[];
  createdAt: admin.firestore.Timestamp;
  createdBy: string;
}

interface WestgardViolation {
  rule: string;
  description: string;
  severity: 'warning' | 'error';
}

export const qualityControlMonitor = async (
  event: FirestoreEvent<QueryDocumentSnapshot, { tenantId: string; qcResultId: string }>
) => {
  console.log('Starting quality control monitor...');
  
  const snapshot = event.data;
  if (!snapshot) return;
  
  const { tenantId, qcResultId } = event.params;
  const qcData = snapshot.data() as QCResult;
  
  try {
    // Apply Westgard rules
    const violations = await applyWestgardRules(tenantId, qcData);
    
    // Determine QC status
    let status: 'pass' | 'warning' | 'fail' = 'pass';
    if (violations.some(v => v.severity === 'error')) {
      status = 'fail';
    } else if (violations.length > 0) {
      status = 'warning';
    }
    
    // Update QC result
    await snapshot.ref.update({
      status,
      westgardRules: violations.map(v => v.rule),
      westgardViolations: violations,
      evaluatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Handle QC failures
    if (status === 'fail') {
      await handleQCFailure(tenantId, qcResultId, qcData, violations);
    }
    
    // Update QC statistics
    await updateQCStatistics(tenantId, qcData, status);
    
    console.log(`QC result ${qcResultId} evaluated with status: ${status}`);
    
  } catch (error) {
    console.error('Error in quality control monitor:', error);
    
    await snapshot.ref.update({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
};

async function applyWestgardRules(
  tenantId: string, 
  qcResult: QCResult
): Promise<WestgardViolation[]> {
  const violations: WestgardViolation[] = [];
  
  // Get recent QC results for trend analysis
  const recentResults = await getRecentQCResults(
    tenantId, 
    qcResult.testCode, 
    qcResult.controlLevel,
    20 // Last 20 results
  );
  
  // Add current result to the array
  const allResults = [...recentResults, qcResult];
  
  // 1-2s Rule: Warning if outside 2SD
  const zScore = (qcResult.value - qcResult.mean) / qcResult.sd;
  if (Math.abs(zScore) >= 2 && Math.abs(zScore) < 3) {
    violations.push({
      rule: '1-2s',
      description: `Result is ${zScore.toFixed(2)} SD from mean (warning)`,
      severity: 'warning'
    });
  }
  
  // 1-3s Rule: Reject if outside 3SD
  if (Math.abs(zScore) >= 3) {
    violations.push({
      rule: '1-3s',
      description: `Result is ${zScore.toFixed(2)} SD from mean (reject)`,
      severity: 'error'
    });
  }
  
  // 2-2s Rule: Reject if 2 consecutive results outside 2SD on same side
  if (recentResults.length >= 1) {
    const lastResult = recentResults[recentResults.length - 1];
    const lastZScore = (lastResult.value - lastResult.mean) / lastResult.sd;
    
    if (Math.abs(zScore) >= 2 && Math.abs(lastZScore) >= 2 && 
        Math.sign(zScore) === Math.sign(lastZScore)) {
      violations.push({
        rule: '2-2s',
        description: '2 consecutive results outside 2SD on same side',
        severity: 'error'
      });
    }
  }
  
  // R-4s Rule: Reject if range exceeds 4SD
  if (recentResults.length >= 1) {
    const lastResult = recentResults[recentResults.length - 1];
    const range = Math.abs(qcResult.value - lastResult.value);
    const avgSD = (qcResult.sd + lastResult.sd) / 2;
    
    if (range > 4 * avgSD) {
      violations.push({
        rule: 'R-4s',
        description: 'Range between consecutive results exceeds 4SD',
        severity: 'error'
      });
    }
  }
  
  // 4-1s Rule: Reject if 4 consecutive results outside 1SD on same side
  if (allResults.length >= 4) {
    const last4 = allResults.slice(-4);
    const all1SD = last4.every(r => {
      const z = (r.value - r.mean) / r.sd;
      return Math.abs(z) > 1;
    });
    
    const sameSide = last4.every(r => {
      const z = (r.value - r.mean) / r.sd;
      return Math.sign(z) === Math.sign(zScore);
    });
    
    if (all1SD && sameSide) {
      violations.push({
        rule: '4-1s',
        description: '4 consecutive results outside 1SD on same side',
        severity: 'error'
      });
    }
  }
  
  // 10x Rule: Warning if 10 consecutive results on same side of mean
  if (allResults.length >= 10) {
    const last10 = allResults.slice(-10);
    const allSameSide = last10.every(r => 
      Math.sign(r.value - r.mean) === Math.sign(qcResult.value - qcResult.mean)
    );
    
    if (allSameSide) {
      violations.push({
        rule: '10x',
        description: '10 consecutive results on same side of mean',
        severity: 'warning'
      });
    }
  }
  
  return violations;
}

async function getRecentQCResults(
  tenantId: string,
  testCode: string,
  controlLevel: string,
  limit: number
): Promise<QCResult[]> {
  const snapshot = await admin.firestore()
    .collection(`labflow_${tenantId}_qc_results`)
    .where('testCode', '==', testCode)
    .where('controlLevel', '==', controlLevel)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QCResult));
}

async function handleQCFailure(
  tenantId: string,
  qcResultId: string,
  qcResult: QCResult,
  violations: WestgardViolation[]
) {
  // Create QC failure alert
  await admin.firestore()
    .collection(`labflow_${tenantId}_qc_alerts`)
    .add({
      qcResultId,
      testCode: qcResult.testCode,
      testName: qcResult.testName,
      controlLevel: qcResult.controlLevel,
      value: qcResult.value,
      mean: qcResult.mean,
      sd: qcResult.sd,
      violations,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  // Notify QC managers
  const managers = await admin.firestore()
    .collection('labflow_users')
    .where('tenantId', '==', tenantId)
    .where('roles', 'array-contains', 'qc_manager')
    .where('notificationsEnabled', '==', true)
    .get();
  
  for (const managerDoc of managers.docs) {
    await admin.firestore()
      .collection(`labflow_${tenantId}_notifications`)
      .add({
        userId: managerDoc.id,
        type: 'qc_failure',
        title: 'QC Failure Alert',
        message: `QC failure for ${qcResult.testName} (${qcResult.controlLevel} control): ${violations.map(v => v.rule).join(', ')}`,
        data: { qcResultId, violations },
        priority: 'high',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
  }
}

async function updateQCStatistics(
  tenantId: string,
  qcResult: QCResult,
  status: string
) {
  const statsId = `${qcResult.testCode}_${qcResult.controlLevel}`;
  const statsRef = admin.firestore()
    .collection(`labflow_${tenantId}_qc_statistics`)
    .doc(statsId);
  
  const stats = await statsRef.get();
  
  if (!stats.exists) {
    // Create new statistics document
    await statsRef.set({
      testCode: qcResult.testCode,
      testName: qcResult.testName,
      controlLevel: qcResult.controlLevel,
      totalRuns: 1,
      passCount: status === 'pass' ? 1 : 0,
      warningCount: status === 'warning' ? 1 : 0,
      failCount: status === 'fail' ? 1 : 0,
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // Update existing statistics
    await statsRef.update({
      totalRuns: admin.firestore.FieldValue.increment(1),
      passCount: status === 'pass' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
      warningCount: status === 'warning' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
      failCount: status === 'fail' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
      lastRunAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}