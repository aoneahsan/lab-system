import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import type {
  TestResult,
  ResultStatus,
  ResultFlag,
} from '@/types/result.types';

export const resultService = {
  // Get results for an order
  async getResultsByOrder(tenantId: string, orderId: string): Promise<TestResult[]> {
    const q = query(
      collection(db, COLLECTIONS.RESULTS),
      where('orderId', '==', orderId),
      orderBy('testName')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TestResult));
  },

  // Get results for a patient
  async getResultsByPatient(tenantId: string, patientId: string): Promise<TestResult[]> {
    const q = query(
      collection(db, COLLECTIONS.RESULTS),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TestResult));
  },

  // Calculate result flag based on reference range
  calculateFlag(value: number, min?: number, max?: number): ResultFlag | undefined {
    if (!min && !max) return undefined;
    
    if (min !== undefined && value < min) {
      return value < min * 0.5 ? 'LL' : 'L';
    }
    if (max !== undefined && value > max) {
      return value > max * 1.5 ? 'HH' : 'H';
    }
    
    return undefined;
  },

  // Validate result
  async validateResult(
    tenantId: string,
    testId: string,
    value: number,
    previousValue?: number
  ): Promise<{ valid: boolean; warnings: string[]; errors: string[] }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Get validation rules
    const validations = await this.getValidationRules(tenantId, testId);

    for (const rule of validations) {
      if (!rule.enabled) continue;

      const params = rule.parameters;

      switch (rule.ruleType) {
        case 'range':
          if (params.min !== undefined && value < params.min) {
            const msg = `Value ${value} is below minimum ${params.min}`;
            if (rule.action === 'block') {
              errors.push(msg);
            } else {
              warnings.push(msg);
            }
          }
          if (params.max !== undefined && value > params.max) {
            const msg = `Value ${value} is above maximum ${params.max}`;
            if (rule.action === 'block') {
              errors.push(msg);
            } else {
              warnings.push(msg);
            }
          }
          break;

        case 'critical':
          if (params.criticalLow !== undefined && value < params.criticalLow) {
            errors.push(`Critical low value: ${value} < ${params.criticalLow}`);
          }
          if (params.criticalHigh !== undefined && value > params.criticalHigh) {
            errors.push(`Critical high value: ${value} > ${params.criticalHigh}`);
          }
          break;

        case 'delta':
          if (previousValue !== undefined) {
            const delta = Math.abs(value - previousValue);
            const deltaPercent = (delta / previousValue) * 100;
            
            if (params.deltaPercent && deltaPercent > params.deltaPercent) {
              warnings.push(`Value changed by ${deltaPercent.toFixed(1)}%`);
            }
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },

  // Get validation rules for a test
  async getValidationRules(tenantId: string, testId: string) {
    const q = query(
      collection(db, COLLECTIONS.RESULTS),
      where('testId', '==', testId),
      where('enabled', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Create result
  async createResult(
    tenantId: string,
    userId: string,
    data: Omit<TestResult, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<TestResult> {
    
    const resultData = {
      ...data,
      tenantId,
      enteredBy: userId,
      enteredAt: Timestamp.now(),
      status: 'entered' as ResultStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.RESULTS), resultData);
    return {
      id: docRef.id,
      ...resultData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as TestResult;
  },

  // Update result
  async updateResult(
    tenantId: string,
    userId: string,
    resultId: string,
    data: Partial<TestResult>
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.RESULTS, resultId);
    
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Verify result
  async verifyResult(
    tenantId: string,
    userId: string,
    resultId: string
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.RESULTS, resultId);
    
    await updateDoc(docRef, {
      status: 'verified',
      verifiedBy: userId,
      verifiedAt: Timestamp.now(),
      updatedAt: serverTimestamp(),
    });
  },

  // Amendment/Correction workflow
  async amendResult(
    tenantId: string,
    resultId: string,
    amendment: {
      newValue: string;
      newUnit?: string;
      newFlag?: ResultFlag;
      reason: string;
      amendedBy: string;
      amendedByName: string;
    }
  ): Promise<void> {
    const resultRef = doc(db, COLLECTIONS.RESULTS, resultId);
    
    // Create audit record
    const auditRecord = {
      tenantId,
      entityType: 'result',
      entityId: resultId,
      action: 'amendment',
      performedBy: amendment.amendedBy,
      performedByName: amendment.amendedByName,
      timestamp: Timestamp.now(),
      changes: {
        previousValue: null, // Will be populated from current result
        newValue: amendment.newValue,
        previousUnit: null,
        newUnit: amendment.newUnit,
        previousFlag: null,
        newFlag: amendment.newFlag,
        reason: amendment.reason,
      },
      ipAddress: null, // Would be captured in production
      userAgent: navigator.userAgent,
    };

    // Get current result to store previous values
    const currentResult = await getDocs(query(
      collection(db, COLLECTIONS.RESULTS),
      where('__name__', '==', resultId)
    ));
    
    if (!currentResult.empty) {
      const currentData = currentResult.docs[0].data();
      auditRecord.changes.previousValue = currentData.value;
      auditRecord.changes.previousUnit = currentData.unit;
      auditRecord.changes.previousFlag = currentData.flag;
    }

    // Save audit record
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), auditRecord);

    // Update result with amendment
    await updateDoc(resultRef, {
      value: amendment.newValue,
      unit: amendment.newUnit || undefined,
      flag: amendment.newFlag || undefined,
      amendedAt: Timestamp.now(),
      amendedBy: amendment.amendedBy,
      amendedByName: amendment.amendedByName,
      amendmentReason: amendment.reason,
      status: 'amended' as ResultStatus,
      updatedAt: serverTimestamp(),
    });
  },

  // Get amendment history for a result
  async getAmendmentHistory(tenantId: string, resultId: string): Promise<any[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('entityType', '==', 'result'),
      where('entityId', '==', resultId),
      where('action', '==', 'amendment'),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Batch result entry
  async enterBatchResults(
    tenantId: string,
    orderId: string,
    results: Array<{
      testId: string;
      testCode: string;
      testName: string;
      value: string;
      unit?: string;
      referenceRange?: string;
      flag?: ResultFlag;
    }>,
    enteredBy: string,
    enteredByName: string
  ): Promise<void> {
    const batch = [];
    const timestamp = Timestamp.now();

    for (const result of results) {
      const newResult: Partial<TestResult> = {
        tenantId,
        orderId,
        testId: result.testId,
        testCode: result.testCode,
        testName: result.testName,
        value: result.value,
        unit: result.unit,
        referenceRange: result.referenceRange,
        flag: result.flag,
        status: 'preliminary',
        enteredBy,
        enteredByName,
        enteredAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      batch.push(addDoc(collection(db, COLLECTIONS.RESULTS), newResult));
    }

    await Promise.all(batch);
  },

  // Mark result as critical and notify
  async markCritical(
    tenantId: string,
    resultId: string,
    criticalInfo: {
      markedBy: string;
      markedByName: string;
      notificationSent: boolean;
      notifiedPersonnel?: string[];
    }
  ): Promise<void> {
    const resultRef = doc(db, COLLECTIONS.RESULTS, resultId);
    
    await updateDoc(resultRef, {
      isCritical: true,
      criticalMarkedAt: Timestamp.now(),
      criticalMarkedBy: criticalInfo.markedBy,
      criticalMarkedByName: criticalInfo.markedByName,
      criticalNotificationSent: criticalInfo.notificationSent,
      criticalNotifiedPersonnel: criticalInfo.notifiedPersonnel || [],
      updatedAt: serverTimestamp(),
    });

    // Create audit log
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      tenantId,
      entityType: 'result',
      entityId: resultId,
      action: 'marked_critical',
      performedBy: criticalInfo.markedBy,
      performedByName: criticalInfo.markedByName,
      timestamp: Timestamp.now(),
      details: {
        notificationSent: criticalInfo.notificationSent,
        notifiedPersonnel: criticalInfo.notifiedPersonnel,
      },
    });
  },
};