export interface CSVParserOptions {
  delimiter?: string;
  encoding?: string;
  headerRow?: number;
  maxRows?: number;
  skipEmptyRows?: boolean;
}

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, any>[];
  errors: string[];
}

export class CSVParser {
  static async parseFile(file: File, options: CSVParserOptions = {}): Promise<ParsedCSVData> {
    const {
      delimiter = ',',
      encoding = 'UTF-8',
      headerRow = 0,
      maxRows,
      skipEmptyRows = true,
    } = options;
    
    const errors: string[] = [];
    
    try {
      const text = await this.readFileAsText(file, encoding);
      const lines = text.split(/\r?\n/);
      
      if (lines.length <= headerRow) {
        throw new Error('No data found in CSV file');
      }
      
      // Extract headers
      const headers = this.parseLine(lines[headerRow], delimiter)
        .map(h => h.trim())
        .filter(h => h.length > 0);
      
      if (headers.length === 0) {
        throw new Error('No headers found');
      }
      
      // Parse rows
      const rows: Record<string, any>[] = [];
      const dataStartRow = headerRow + 1;
      const maxRowIndex = maxRows 
        ? Math.min(dataStartRow + maxRows, lines.length)
        : lines.length;
      
      for (let i = dataStartRow; i < maxRowIndex; i++) {
        const line = lines[i];
        
        if (skipEmptyRows && !line.trim()) continue;
        
        const values = this.parseLine(line, delimiter);
        const row: Record<string, any> = {};
        let hasData = false;
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (value !== undefined && value !== '') {
            row[header] = this.parseValue(value);
            hasData = true;
          }
        });
        
        if (hasData) {
          rows.push(row);
        }
      }
      
      return {
        headers,
        rows,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        headers: [],
        rows: [],
        errors,
      };
    }
  }
  
  private static async readFileAsText(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, encoding);
    });
  }
  
  private static parseLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last value
    values.push(current.trim());
    
    return values;
  }
  
  private static parseValue(value: string): any {
    const trimmed = value.trim();
    
    // Remove surrounding quotes if present
    const unquoted = trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1).replace(/""/g, '"')
      : trimmed;
    
    // Empty value
    if (!unquoted) return '';
    
    // Boolean
    if (unquoted.toLowerCase() === 'true') return true;
    if (unquoted.toLowerCase() === 'false') return false;
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(unquoted)) {
      const num = parseFloat(unquoted);
      if (!isNaN(num)) return num;
    }
    
    // Date (simple check for ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(unquoted)) {
      const date = new Date(unquoted);
      if (!isNaN(date.getTime())) return date;
    }
    
    return unquoted;
  }
  
  static exportToCSV(
    data: Record<string, any>[],
    filename: string,
    options: { delimiter?: string; includeHeaders?: boolean } = {}
  ): void {
    const { delimiter = ',', includeHeaders = true } = options;
    
    if (data.length === 0) {
      throw new Error('No data to export');
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    const lines: string[] = [];
    
    // Add headers
    if (includeHeaders) {
      lines.push(headers.map(h => this.escapeValue(h, delimiter)).join(delimiter));
    }
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return this.escapeValue(value, delimiter);
      });
      lines.push(values.join(delimiter));
    });
    
    // Create and download file
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  private static escapeValue(value: any, delimiter: string): string {
    if (value === null || value === undefined) return '';
    
    const strValue = value.toString();
    
    // Check if escaping is needed
    if (strValue.includes(delimiter) || strValue.includes('"') || strValue.includes('\n')) {
      // Escape quotes by doubling them
      const escaped = strValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return strValue;
  }
}