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
import type {
  TestResult,
  ResultStatus,
  ResultFlag,
} from '@/types/result.types';

const RESULTS_COLLECTION = 'results';
const VALIDATIONS_COLLECTION = 'resultValidations';

export const resultService = {
  // Get results for an order
  async getResultsByOrder(tenantId: string, orderId: string): Promise<TestResult[]> {
    const collectionName = `${tenantId}_${RESULTS_COLLECTION}`;
    const q = query(
      collection(db, collectionName),
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
    const collectionName = `${tenantId}_${RESULTS_COLLECTION}`;
    const q = query(
      collection(db, collectionName),
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
    const collectionName = `${tenantId}_${VALIDATIONS_COLLECTION}`;
    const q = query(
      collection(db, collectionName),
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
    const collectionName = `${tenantId}_${RESULTS_COLLECTION}`;
    
    const resultData = {
      ...data,
      tenantId,
      enteredBy: userId,
      enteredAt: Timestamp.now(),
      status: 'entered' as ResultStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collectionName), resultData);
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
    const collectionName = `${tenantId}_${RESULTS_COLLECTION}`;
    const docRef = doc(db, collectionName, resultId);
    
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
    const collectionName = `${tenantId}_${RESULTS_COLLECTION}`;
    const docRef = doc(db, collectionName, resultId);
    
    await updateDoc(docRef, {
      status: 'verified',
      verifiedBy: userId,
      verifiedAt: Timestamp.now(),
      updatedAt: serverTimestamp(),
    });
  },
};