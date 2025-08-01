import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  errors: string[];
}

export interface ExcelParserOptions {
  sheet?: string | number;
  headerRow?: number;
  maxRows?: number;
}

export class ExcelParser {
  static async parseFile(file: File, options: ExcelParserOptions = {}): Promise<ParsedData> {
    const { sheet = 0, headerRow = 0, maxRows } = options;
    const errors: string[] = [];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get sheet
      const sheetName = typeof sheet === 'string' 
        ? sheet 
        : workbook.SheetNames[sheet];
      
      if (!sheetName) {
        throw new Error(`Sheet ${sheet} not found`);
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd',
      }) as any[][];
      
      if (jsonData.length === 0) {
        throw new Error('No data found in sheet');
      }
      
      // Extract headers
      const headers = jsonData[headerRow] as string[];
      if (!headers || headers.length === 0) {
        throw new Error('No headers found');
      }
      
      // Clean headers (remove empty, trim whitespace)
      const cleanHeaders = headers
        .map(h => (h || '').toString().trim())
        .filter(h => h.length > 0);
      
      // Extract rows
      const rows: Record<string, any>[] = [];
      const dataStartRow = headerRow + 1;
      const maxRowIndex = maxRows 
        ? Math.min(dataStartRow + maxRows, jsonData.length)
        : jsonData.length;
      
      for (let i = dataStartRow; i < maxRowIndex; i++) {
        const rowData = jsonData[i];
        if (!rowData || rowData.every(cell => !cell)) continue;
        
        const row: Record<string, any> = {};
        let hasData = false;
        
        cleanHeaders.forEach((header, index) => {
          const value = rowData[index];
          if (value !== undefined && value !== null && value !== '') {
            row[header] = this.parseValue(value);
            hasData = true;
          }
        });
        
        if (hasData) {
          rows.push(row);
        }
      }
      
      return {
        headers: cleanHeaders,
        rows,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        headers: [],
        rows: [],
        errors,
      };
    }
  }
  
  static async parseMultipleSheets(file: File): Promise<Record<string, ParsedData>> {
    const result: Record<string, ParsedData> = {};
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      for (const sheetName of workbook.SheetNames) {
        result[sheetName] = await this.parseFile(file, { sheet: sheetName });
      }
      
      return result;
    } catch (error) {
      return {
        error: {
          headers: [],
          rows: [],
          errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        },
      };
    }
  }
  
  private static parseValue(value: any): any {
    // Already parsed by XLSX
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;
    
    const strValue = value.toString().trim();
    
    // Check for boolean strings
    if (strValue.toLowerCase() === 'true') return true;
    if (strValue.toLowerCase() === 'false') return false;
    
    // Check for number strings
    if (/^-?\d+(\.\d+)?$/.test(strValue)) {
      const num = parseFloat(strValue);
      if (!isNaN(num)) return num;
    }
    
    // Return as string
    return strValue;
  }
  
  static createWorkbook(data: Record<string, any>[], sheetName = 'Sheet1'): XLSX.WorkBook {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
  }
  
  static exportToExcel(
    data: Record<string, any>[], 
    filename: string, 
    sheetName = 'Sheet1'
  ): void {
    const workbook = this.createWorkbook(data, sheetName);
    XLSX.writeFile(workbook, filename);
  }
  
  static exportMultipleSheetsToExcel(
    sheets: Record<string, Record<string, any>[]>,
    filename: string
  ): void {
    const workbook = XLSX.utils.book_new();
    
    Object.entries(sheets).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    XLSX.writeFile(workbook, filename);
  }
}