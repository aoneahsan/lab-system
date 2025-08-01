export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone';
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: any[];
  custom?: (value: any, row: Record<string, any>) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRows: Record<string, any>[];
  invalidRows: Record<string, any>[];
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

export class DataValidator {
  static validate(
    data: Record<string, any>[],
    rules: ValidationRule[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validRows: Record<string, any>[] = [];
    const invalidRows: Record<string, any>[] = [];
    
    data.forEach((row, index) => {
      const rowErrors: ValidationError[] = [];
      const rowWarnings: ValidationWarning[] = [];
      
      rules.forEach(rule => {
        const value = row[rule.field];
        const error = this.validateField(value, rule, row);
        
        if (error) {
          if (error.severity === 'error') {
            rowErrors.push({
              row: index + 1,
              field: rule.field,
              value,
              message: error.message,
            });
          } else {
            rowWarnings.push({
              row: index + 1,
              field: rule.field,
              value,
              message: error.message,
            });
          }
        }
      });
      
      errors.push(...rowErrors);
      warnings.push(...rowWarnings);
      
      if (rowErrors.length === 0) {
        validRows.push(row);
      } else {
        invalidRows.push(row);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows,
      invalidRows,
    };
  }
  
  private static validateField(
    value: any,
    rule: ValidationRule,
    row: Record<string, any>
  ): { message: string; severity: 'error' | 'warning' } | null {
    // Required field check
    if (rule.required && (value === null || value === undefined || value === '')) {
      return { message: `${rule.field} is required`, severity: 'error' };
    }
    
    // Skip further validation if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null;
    }
    
    // Type validation
    if (rule.type) {
      const typeError = this.validateType(value, rule.type, rule.field);
      if (typeError) return { message: typeError, severity: 'error' };
    }
    
    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return { 
          message: `${rule.field} does not match required pattern`, 
          severity: 'error' 
        };
      }
    }
    
    // Numeric range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return { 
          message: `${rule.field} must be at least ${rule.min}`, 
          severity: 'error' 
        };
      }
      if (rule.max !== undefined && value > rule.max) {
        return { 
          message: `${rule.field} must not exceed ${rule.max}`, 
          severity: 'error' 
        };
      }
    }
    
    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return { 
          message: `${rule.field} must be at least ${rule.minLength} characters`, 
          severity: 'error' 
        };
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return { 
          message: `${rule.field} must not exceed ${rule.maxLength} characters`, 
          severity: 'error' 
        };
      }
    }
    
    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return { 
        message: `${rule.field} must be one of: ${rule.enum.join(', ')}`, 
        severity: 'error' 
      };
    }
    
    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value, row);
      if (customError) {
        return { message: customError, severity: 'error' };
      }
    }
    
    return null;
  }
  
  private static validateType(
    value: any,
    type: string,
    field: string
  ): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`;
        }
        break;
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a number`;
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} must be a boolean`;
        }
        break;
        
      case 'date':
        if (!(value instanceof Date) || isNaN(value.getTime())) {
          return `${field} must be a valid date`;
        }
        break;
        
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return `${field} must be a valid email address`;
        }
        break;
        
      case 'phone':
        if (typeof value !== 'string' || !this.isValidPhone(value)) {
          return `${field} must be a valid phone number`;
        }
        break;
    }
    
    return null;
  }
  
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - can be customized
    const phoneRegex = /^[\d\s\-+()\]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
  
  // Common validation rules for lab data
  static readonly TEST_CATALOG_RULES: ValidationRule[] = [
    { field: 'code', required: true, type: 'string', maxLength: 50 },
    { field: 'name', required: true, type: 'string', maxLength: 200 },
    { field: 'category', required: true, type: 'string' },
    { field: 'price', required: true, type: 'number', min: 0 },
    { field: 'turnaroundTime', type: 'number', min: 0 },
    { field: 'loincCode', type: 'string', pattern: /^\d{1,5}-\d$/ },
    { field: 'specimenType', type: 'string' },
    { field: 'containerType', type: 'string' },
    { field: 'minimumVolume', type: 'number', min: 0 },
    { field: 'isActive', type: 'boolean' },
  ];
  
  static readonly INVENTORY_RULES: ValidationRule[] = [
    { field: 'itemCode', required: true, type: 'string', maxLength: 50 },
    { field: 'name', required: true, type: 'string', maxLength: 200 },
    { field: 'category', required: true, type: 'string' },
    { field: 'unit', required: true, type: 'string' },
    { field: 'quantity', required: true, type: 'number', min: 0 },
    { field: 'reorderLevel', type: 'number', min: 0 },
    { field: 'reorderQuantity', type: 'number', min: 0 },
    { field: 'unitCost', type: 'number', min: 0 },
    { field: 'expiryDate', type: 'date' },
    { field: 'vendorName', type: 'string' },
    { field: 'location', type: 'string' },
  ];
}