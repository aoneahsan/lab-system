import * as admin from 'firebase-admin';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

interface ValidationRule {
  id: string;
  ruleType: 'range' | 'delta' | 'critical' | 'absurd' | 'pattern';
  testCode: string;
  conditions: {
    minValue?: number;
    maxValue?: number;
    deltaPercentage?: number;
    pattern?: string;
    criticalLow?: number;
    criticalHigh?: number;
    absurdLow?: number;
    absurdHigh?: number;
  };
  actions: {
    flag?: string;
    requiresReview?: boolean;
    notifyCritical?: boolean;
    autoReject?: boolean;
  };
}

interface TestResult {
  id?: string;
  tenantId: string;
  patientId: string;
  testOrderId: string;
  testCode: string;
  testName: string;
  value: number | string;
  unit?: string;
  referenceRange?: string;
  flag?: string;
  status: 'pending' | 'validated' | 'rejected' | 'requires_review';
  validationErrors?: string[];
  isCritical?: boolean;
  createdAt: admin.firestore.Timestamp;
  createdBy: string;
}

export const resultValidationWorkflow = async (
  event: FirestoreEvent<QueryDocumentSnapshot, { tenantId: string; resultId: string }>
) => {
  console.log('Starting result validation workflow...');
  
  const snapshot = event.data;
  if (!snapshot) return;
  
  const { tenantId, resultId } = event.params;
  const resultData = snapshot.data() as TestResult;
  
  try {
    // Skip if already validated
    if (resultData.status !== 'pending') {
      console.log(`Result ${resultId} already processed with status: ${resultData.status}`);
      return;
    }
    
    // Get validation rules for this test
    const validationRules = await getValidationRules(tenantId, resultData.testCode);
    
    if (validationRules.length === 0) {
      console.log(`No validation rules found for test ${resultData.testCode}`);
      // Mark as validated if no rules exist
      await snapshot.ref.update({
        status: 'validated',
        validatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }
    
    // Apply validation rules
    const validationResults = await applyValidationRules(resultData, validationRules);
    
    // Update result based on validation
    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (validationResults.isValid) {
      updates.status = validationResults.requiresReview ? 'requires_review' : 'validated';
      updates.validatedAt = admin.firestore.FieldValue.serverTimestamp() as any;
    } else {
      updates.status = 'rejected';
      updates.validationErrors = validationResults.errors;
    }
    
    if (validationResults.flags.length > 0) {
      updates.flag = validationResults.flags[0]; // Use the highest priority flag
      updates.isCritical = validationResults.isCritical;
    }
    
    await snapshot.ref.update(updates);
    
    // Handle critical results
    if (validationResults.isCritical) {
      await handleCriticalResult(tenantId, resultId, resultData);
    }
    
    // Create audit log
    await createAuditLog(tenantId, resultId, 'validation', {
      rules: validationRules.map(r => r.id),
      results: validationResults,
      finalStatus: updates.status
    });
    
    console.log(`Result ${resultId} validation completed with status: ${updates.status}`);
    
  } catch (error) {
    console.error('Error in result validation workflow:', error);
    
    // Update result with error status
    await snapshot.ref.update({
      status: 'requires_review',
      validationErrors: ['Validation system error'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
};

async function getValidationRules(tenantId: string, testCode: string): Promise<ValidationRule[]> {
  const rulesSnapshot = await admin.firestore()
    .collection(`labflow_${tenantId}_validation_rules`)
    .where('testCode', '==', testCode)
    .where('isActive', '==', true)
    .orderBy('priority', 'asc')
    .get();
  
  return rulesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ValidationRule));
}

async function applyValidationRules(
  result: TestResult,
  rules: ValidationRule[]
): Promise<{
  isValid: boolean;
  errors: string[];
  flags: string[];
  requiresReview: boolean;
  isCritical: boolean;
}> {
  const errors: string[] = [];
  const flags: string[] = [];
  let requiresReview = false;
  let isCritical = false;
  let isValid = true;
  
  // Convert value to number if possible
  const numericValue = typeof result.value === 'string' 
    ? parseFloat(result.value) 
    : result.value;
  
  for (const rule of rules) {
    switch (rule.ruleType) {
      case 'range':
        if (rule.conditions.minValue !== undefined && numericValue < rule.conditions.minValue) {
          flags.push('low');
          if (rule.actions.requiresReview) requiresReview = true;
        }
        if (rule.conditions.maxValue !== undefined && numericValue > rule.conditions.maxValue) {
          flags.push('high');
          if (rule.actions.requiresReview) requiresReview = true;
        }
        break;
        
      case 'critical':
        if (rule.conditions.criticalLow !== undefined && numericValue <= rule.conditions.criticalLow) {
          flags.push('critical_low');
          isCritical = true;
          requiresReview = true;
        }
        if (rule.conditions.criticalHigh !== undefined && numericValue >= rule.conditions.criticalHigh) {
          flags.push('critical_high');
          isCritical = true;
          requiresReview = true;
        }
        break;
        
      case 'absurd':
        if (rule.conditions.absurdLow !== undefined && numericValue < rule.conditions.absurdLow) {
          errors.push(`Value ${numericValue} is below absurd low limit ${rule.conditions.absurdLow}`);
          isValid = false;
        }
        if (rule.conditions.absurdHigh !== undefined && numericValue > rule.conditions.absurdHigh) {
          errors.push(`Value ${numericValue} is above absurd high limit ${rule.conditions.absurdHigh}`);
          isValid = false;
        }
        break;
        
      case 'pattern':
        if (rule.conditions.pattern && typeof result.value === 'string') {
          const regex = new RegExp(rule.conditions.pattern);
          if (!regex.test(result.value)) {
            errors.push(`Value does not match required pattern: ${rule.conditions.pattern}`);
            if (rule.actions.autoReject) isValid = false;
          }
        }
        break;
        
      case 'delta':
        // Delta check would require fetching previous results
        // Implement if needed
        break;
    }
    
    // Apply rule actions
    if (rule.actions.flag && !flags.includes(rule.actions.flag)) {
      flags.push(rule.actions.flag);
    }
  }
  
  return {
    isValid,
    errors,
    flags,
    requiresReview,
    isCritical
  };
}

async function handleCriticalResult(tenantId: string, resultId: string, result: TestResult) {
  // Create critical result notification record
  await admin.firestore()
    .collection(`labflow_${tenantId}_critical_results`)
    .add({
      resultId,
      patientId: result.patientId,
      testOrderId: result.testOrderId,
      testCode: result.testCode,
      testName: result.testName,
      value: result.value,
      unit: result.unit,
      flag: result.flag,
      notificationStatus: 'pending',
      acknowledgedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  console.log(`Critical result notification created for result ${resultId}`);
}

async function createAuditLog(
  tenantId: string,
  resultId: string,
  action: string,
  details: any
) {
  await admin.firestore()
    .collection(`labflow_${tenantId}_audit_logs`)
    .add({
      resourceType: 'result',
      resourceId: resultId,
      action,
      details,
      performedBy: 'system',
      performedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}