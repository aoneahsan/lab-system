// Web Worker for heavy data processing

interface ProcessMessage {
  type: 'PROCESS_RESULTS' | 'CALCULATE_STATISTICS' | 'EXPORT_DATA' | 'VALIDATE_BATCH';
  data: any;
}

interface ProcessResponse {
  type: string;
  result: any;
  error?: string;
}

// Process lab results in batches
function processResults(results: any[]): any[] {
  return results.map(result => ({
    ...result,
    status: validateResult(result),
    flags: calculateFlags(result),
    normalizedValue: normalizeValue(result),
  }));
}

// Validate result against reference ranges
function validateResult(result: any): string {
  const { value, referenceRange } = result;
  
  if (!value || !referenceRange) return 'pending';
  
  const numValue = parseFloat(value);
  const { min, max } = referenceRange;
  
  if (numValue < min) return 'low';
  if (numValue > max) return 'high';
  return 'normal';
}

// Calculate result flags
function calculateFlags(result: any): string[] {
  const flags: string[] = [];
  const { value, referenceRange, criticalRange } = result;
  
  if (!value) return flags;
  
  const numValue = parseFloat(value);
  
  if (criticalRange) {
    if (numValue < criticalRange.min || numValue > criticalRange.max) {
      flags.push('CRITICAL');
    }
  }
  
  if (referenceRange) {
    if (numValue < referenceRange.min) flags.push('LOW');
    if (numValue > referenceRange.max) flags.push('HIGH');
  }
  
  return flags;
}

// Normalize values for different units
function normalizeValue(result: any): number | null {
  const { value, unit } = result;
  if (!value) return null;
  
  const numValue = parseFloat(value);
  
  // Convert common units to standard
  switch (unit) {
    case 'g/dL':
      return numValue * 10; // Convert to g/L
    case 'mg/dL':
      return numValue / 100; // Convert to g/L
    case 'mmol/L':
      return numValue; // Already standard
    default:
      return numValue;
  }
}

// Calculate statistics for a dataset
function calculateStatistics(data: number[]): any {
  if (!data.length) return null;
  
  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;
  
  // Calculate standard deviation
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate percentiles
  const getPercentile = (p: number) => {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  };
  
  return {
    count: data.length,
    mean: mean.toFixed(2),
    median: getPercentile(50),
    stdDev: stdDev.toFixed(2),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: getPercentile(25),
    p75: getPercentile(75),
    p95: getPercentile(95),
  };
}

// Export data to CSV format
function exportToCSV(data: any[], columns: string[]): string {
  const headers = columns.join(',');
  
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col];
      // Escape quotes and handle special characters
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

// Validate batch data
function validateBatch(batch: any[]): any {
  const errors: any[] = [];
  const warnings: any[] = [];
  let validCount = 0;
  
  batch.forEach((item, index) => {
    const itemErrors: string[] = [];
    const itemWarnings: string[] = [];
    
    // Required field validation
    if (!item.patientId) itemErrors.push('Missing patient ID');
    if (!item.testId) itemErrors.push('Missing test ID');
    if (!item.value && item.value !== 0) itemErrors.push('Missing value');
    
    // Data type validation
    if (item.value && isNaN(parseFloat(item.value))) {
      itemErrors.push('Invalid numeric value');
    }
    
    // Range validation
    if (item.value && item.referenceRange) {
      const value = parseFloat(item.value);
      if (value < 0) itemWarnings.push('Negative value detected');
      if (value > 10000) itemWarnings.push('Unusually high value');
    }
    
    if (itemErrors.length > 0) {
      errors.push({ index, errors: itemErrors });
    } else {
      validCount++;
    }
    
    if (itemWarnings.length > 0) {
      warnings.push({ index, warnings: itemWarnings });
    }
  });
  
  return {
    totalItems: batch.length,
    validItems: validCount,
    invalidItems: errors.length,
    errors,
    warnings,
    validationRate: (validCount / batch.length * 100).toFixed(2) + '%',
  };
}

// Message handler
self.onmessage = (event: MessageEvent<ProcessMessage>) => {
  const { type, data } = event.data;
  let response: ProcessResponse;
  
  try {
    switch (type) {
      case 'PROCESS_RESULTS':
        response = {
          type,
          result: processResults(data),
        };
        break;
        
      case 'CALCULATE_STATISTICS':
        response = {
          type,
          result: calculateStatistics(data),
        };
        break;
        
      case 'EXPORT_DATA':
        response = {
          type,
          result: exportToCSV(data.items, data.columns),
        };
        break;
        
      case 'VALIDATE_BATCH':
        response = {
          type,
          result: validateBatch(data),
        };
        break;
        
      default:
        response = {
          type,
          result: null,
          error: `Unknown message type: ${type}`,
        };
    }
  } catch (error) {
    response = {
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Processing error',
    };
  }
  
  self.postMessage(response);
};

export {};