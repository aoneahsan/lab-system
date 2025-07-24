import { 
  collection, 
  doc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/constants/firebase';
import { useAuthStore } from '@/stores/auth.store';
import { useTenantStore } from '@/stores/tenant.store';
import type { 
  ResultValidationRule, 
  TestResult,
  ResultFlag 
} from '@/types/result.types';

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  flags: ResultFlag[];
  requiresReview: boolean;
  isCritical: boolean;
}

export const resultValidationService = {
  async getValidationRules(testId?: string): Promise<ResultValidationRule[]> {
    const tenantId = useTenantStore.getState().tenantId;
    if (!tenantId) throw new Error('No tenant selected');

    let q = query(
      collection(db, COLLECTIONS.VALIDATION_RULES),
      where('tenantId', '==', tenantId),
      where('active', '==', true)
    );

    if (testId) {
      q = query(q, where('testId', '==', testId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ResultValidationRule));
  },

  async createValidationRule(data: Omit<ResultValidationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const tenantId = useTenantStore.getState().tenantId;
    const user = useAuthStore.getState().user;
    if (!tenantId || !user) throw new Error('Authentication required');

    const ruleData = {
      ...data,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      updatedBy: user.uid
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.VALIDATION_RULES),
      ruleData
    );

    return docRef.id;
  },

  async updateValidationRule(id: string, data: Partial<ResultValidationRule>): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Authentication required');

    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid
    };

    await updateDoc(
      doc(db, COLLECTIONS.VALIDATION_RULES, id),
      updateData
    );
  },

  async deleteValidationRule(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.VALIDATION_RULES, id));
  },

  async validateResult(
    testId: string, 
    value: string | number, 
    patientId: string,
    referenceRange?: { min?: number; max?: number }
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      flags: [],
      requiresReview: false,
      isCritical: false
    };

    // Get validation rules for this test
    const rules = await this.getValidationRules(testId);
    
    // Convert value to number if possible
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const isNumeric = !isNaN(numericValue);

    // Get previous results for delta checks
    const previousResult = await this.getPreviousResult(testId, patientId);

    for (const rule of rules) {
      switch (rule.ruleType) {
        case 'range':
          if (isNumeric && rule.minValue !== undefined && rule.maxValue !== undefined) {
            if (numericValue < rule.minValue || numericValue > rule.maxValue) {
              this.handleRuleViolation(rule, `Value ${numericValue} is outside acceptable range (${rule.minValue}-${rule.maxValue})`, result);
            }
          }
          break;

        case 'absurd':
          if (isNumeric) {
            if (rule.absurdLow !== undefined && numericValue < rule.absurdLow) {
              this.handleRuleViolation(rule, `Value ${numericValue} is absurdly low (< ${rule.absurdLow})`, result);
            }
            if (rule.absurdHigh !== undefined && numericValue > rule.absurdHigh) {
              this.handleRuleViolation(rule, `Value ${numericValue} is absurdly high (> ${rule.absurdHigh})`, result);
            }
          }
          break;

        case 'critical':
          if (isNumeric) {
            if (rule.criticalLow !== undefined && numericValue < rule.criticalLow) {
              result.isCritical = true;
              result.flags.push('critical_low');
              this.handleRuleViolation(rule, `Critical low value: ${numericValue} (< ${rule.criticalLow})`, result);
            }
            if (rule.criticalHigh !== undefined && numericValue > rule.criticalHigh) {
              result.isCritical = true;
              result.flags.push('critical_high');
              this.handleRuleViolation(rule, `Critical high value: ${numericValue} (> ${rule.criticalHigh})`, result);
            }
          }
          break;

        case 'delta':
          if (isNumeric && previousResult && rule.deltaThreshold !== undefined) {
            const previousValue = typeof previousResult.value === 'string' 
              ? parseFloat(previousResult.value) 
              : previousResult.value;
            
            if (!isNaN(previousValue)) {
              const delta = rule.deltaType === 'percentage'
                ? Math.abs((numericValue - previousValue) / previousValue * 100)
                : Math.abs(numericValue - previousValue);
              
              if (delta > rule.deltaThreshold) {
                const deltaMsg = rule.deltaType === 'percentage'
                  ? `${delta.toFixed(1)}% change`
                  : `${delta} change`;
                this.handleRuleViolation(
                  rule, 
                  `Significant delta from previous result: ${deltaMsg} (previous: ${previousValue}, current: ${numericValue})`, 
                  result
                );
              }
            }
          }
          break;

        case 'custom':
          // Custom rules would be evaluated here
          // For now, we'll skip custom rule evaluation
          break;
      }
    }

    // Check reference ranges if no critical flags
    if (!result.isCritical && isNumeric && referenceRange) {
      if (referenceRange.min !== undefined && numericValue < referenceRange.min) {
        result.flags.push('low');
      } else if (referenceRange.max !== undefined && numericValue > referenceRange.max) {
        result.flags.push('high');
      } else {
        result.flags.push('normal');
      }
    }

    // Set overall validity
    result.isValid = result.errors.length === 0;

    return result;
  },

  handleRuleViolation(rule: ResultValidationRule, message: string, result: ValidationResult): void {
    switch (rule.action) {
      case 'warn':
        result.warnings.push(message);
        break;
      case 'block':
        result.errors.push(message);
        result.isValid = false;
        break;
      case 'flag':
        result.warnings.push(message);
        break;
    }

    if (rule.requiresReview) {
      result.requiresReview = true;
    }
  },

  async getPreviousResult(testId: string, patientId: string): Promise<TestResult | null> {
    const tenantId = useTenantStore.getState().tenantId;
    if (!tenantId) return null;

    const q = query(
      collection(db, COLLECTIONS.RESULTS),
      where('tenantId', '==', tenantId),
      where('testId', '==', testId),
      where('patientId', '==', patientId),
      where('status', '==', 'final'),
      orderBy('performedAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as TestResult;
  },

  calculateReferenceRangeFlag(
    value: number,
    referenceRange: { min?: number; max?: number }
  ): ResultFlag {
    if (referenceRange.min !== undefined && value < referenceRange.min) {
      return 'low';
    } else if (referenceRange.max !== undefined && value > referenceRange.max) {
      return 'high';
    }
    return 'normal';
  }
};