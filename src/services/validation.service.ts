import type { TestDefinition } from '@/types/test.types';
type Test = TestDefinition;
import type { TestResult, ResultValidation } from '@/types/result.types';

interface ValidationRule {
  testId: string;
  normalLow?: number;
  normalHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  absoluteLow?: number;
  absoluteHigh?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  flag: TestResult['flag'];
  status: TestResult['status'];
  isCritical?: boolean;
  criticalType?: 'high' | 'low';
}

export class ValidationService {
  validateResult(
    test: Test,
    value: string,
    unit?: string,
    rules?: ValidationRule[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let flag: TestResult['flag'] = 'normal';
    let isCritical = false;
    let criticalType: 'high' | 'low' | undefined;

    // Basic validation
    if (!value || value.trim() === '') {
      errors.push({
        field: 'value',
        message: 'Result value is required',
        severity: 'error',
      });
    }

    // Check if numeric test requires numeric value
    if (test.resultType === 'numeric' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push({
          field: 'value',
          message: 'Value must be numeric',
          severity: 'error',
        });
        return {
          isValid: false,
          errors,
          warnings,
          flag,
          status: 'entered',
          isCritical,
          criticalType,
        };
      }

      // Apply validation rules
      const rule = rules?.find((r) => r.testId === test.id);
      if (rule) {
        // Check critical ranges first
        if (rule.criticalLow !== undefined && numValue < rule.criticalLow) {
          errors.push({
            field: 'value',
            message: `Critical low value: ${value} is below critical limit of ${rule.criticalLow}`,
            severity: 'critical',
          });
          flag = 'critical_low';
          isCritical = true;
          criticalType = 'low';
        } else if (rule.criticalHigh !== undefined && numValue > rule.criticalHigh) {
          errors.push({
            field: 'value',
            message: `Critical high value: ${value} is above critical limit of ${rule.criticalHigh}`,
            severity: 'critical',
          });
          flag = 'critical_high';
          isCritical = true;
          criticalType = 'high';
        }
        // Check normal ranges
        else if (rule.normalLow !== undefined && numValue < rule.normalLow) {
          warnings.push({
            field: 'value',
            message: `Low value: ${value} is below normal range of ${rule.normalLow}`,
          });
          flag = 'low';
        } else if (rule.normalHigh !== undefined && numValue > rule.normalHigh) {
          warnings.push({
            field: 'value',
            message: `High value: ${value} is above normal range of ${rule.normalHigh}`,
          });
          flag = 'high';
        }

        // Check absolute limits
        if (rule.absoluteLow !== undefined && numValue < rule.absoluteLow) {
          errors.push({
            field: 'value',
            message: `Impossible value: ${value} is below absolute minimum of ${rule.absoluteLow}`,
            severity: 'error',
          });
        } else if (rule.absoluteHigh !== undefined && numValue > rule.absoluteHigh) {
          errors.push({
            field: 'value',
            message: `Impossible value: ${value} is above absolute maximum of ${rule.absoluteHigh}`,
            severity: 'error',
          });
        }
      }

      // Simple reference range parsing if no rules
      if (!rule && test.referenceRanges?.[0]) {
        const refRange = test.referenceRanges[0];
        let min: number | undefined;
        let max: number | undefined;
        
        // Use normalMin and normalMax if available
        if (refRange.normalMin !== undefined && refRange.normalMax !== undefined) {
          min = refRange.normalMin;
          max = refRange.normalMax;
        } 
        // Otherwise try to parse textRange
        else if (refRange.textRange) {
          const rangeMatch = refRange.textRange.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
          if (rangeMatch) {
            const [, minStr, maxStr] = rangeMatch;
            min = parseFloat(minStr);
            max = parseFloat(maxStr);
          }
        }

        if (min !== undefined && max !== undefined) {

          // Assume critical values are 20% beyond normal range
          const criticalLow = min - (max - min) * 0.2;
          const criticalHigh = max + (max - min) * 0.2;

          if (numValue < criticalLow) {
            flag = 'critical_low';
            isCritical = true;
            criticalType = 'low';
            errors.push({
              field: 'value',
              message: `Critical low value: ${value} is significantly below reference range`,
              severity: 'critical',
            });
          } else if (numValue > criticalHigh) {
            flag = 'critical_high';
            isCritical = true;
            criticalType = 'high';
            errors.push({
              field: 'value',
              message: `Critical high value: ${value} is significantly above reference range`,
              severity: 'critical',
            });
          } else if (numValue < min) {
            flag = 'low';
            warnings.push({
              field: 'value',
              message: `Low value: ${value} is below reference range ${refRange}`,
            });
          } else if (numValue > max) {
            flag = 'high';
            warnings.push({
              field: 'value',
              message: `High value: ${value} is above reference range ${refRange}`,
            });
          }
        }
      }
    }

    // Unit validation
    if (test.unit && unit && test.unit !== unit) {
      warnings.push({
        field: 'unit',
        message: `Unit mismatch: expected ${test.unit}, got ${unit}`,
      });
    }

    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
      flag,
      status: errors.length > 0 ? 'entered' : 'verified',
      isCritical,
      criticalType,
    };
  }

  // Check if a result requires immediate notification
  requiresImmediateNotification(validation: ValidationResult): boolean {
    return validation.isCritical === true;
  }

  // Get critical value notification template
  getCriticalValueTemplate(
    test: Test,
    value: string,
    unit: string,
    criticalType: 'high' | 'low'
  ): string {
    return `Critical ${criticalType} value detected for ${test.name}: ${value} ${unit}. Immediate physician notification required.`;
  }
}

export const validationService = new ValidationService();
