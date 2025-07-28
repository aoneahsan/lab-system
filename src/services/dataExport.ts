import { api } from './api';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  fields?: string[];
  filters?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface ImportOptions {
  format: 'csv' | 'excel' | 'json';
  mapping?: Record<string, string>;
  validation?: boolean;
  batchSize?: number;
}

class DataExportService {
  // Export data from a specific collection
  async exportData(
    collection: string,
    options: ExportOptions
  ): Promise<void> {
    try {
      const response = await api.post(`/api/export/${collection}`, {
        ...options,
        format: options.format === 'pdf' || options.format === 'excel' ? 'json' : options.format
      });

      const data = response.data;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${collection}-export-${timestamp}`;

      switch (options.format) {
        case 'csv':
          this.downloadCSV(data, filename);
          break;
        case 'excel':
          this.downloadExcel(data, filename);
          break;
        case 'json':
          this.downloadJSON(data, filename);
          break;
        case 'pdf':
          this.downloadPDF(data, filename, collection);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Import data into a specific collection
  async importData(
    collection: string,
    file: File,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      const data = await this.parseFile(file, options.format);
      
      // Validate data if required
      if (options.validation) {
        const validationResult = await this.validateData(collection, data);
        if (!validationResult.valid) {
          return {
            success: false,
            errors: validationResult.errors,
            imported: 0,
            failed: data.length
          };
        }
      }

      // Apply field mapping if provided
      const mappedData = options.mapping ? 
        this.applyMapping(data, options.mapping) : data;

      // Import in batches
      const batchSize = options.batchSize || 100;
      const results = await this.importInBatches(
        collection, 
        mappedData, 
        batchSize
      );

      return results;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Parse file based on format
  private async parseFile(file: File, format: string): Promise<any[]> {
    switch (format) {
      case 'csv':
        return this.parseCSV(file);
      case 'excel':
        return this.parseExcel(file);
      case 'json':
        return this.parseJSON(file);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // CSV parsing
  private async parseCSV(file: File): Promise<any[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      data.push(record);
    }

    return data;
  }

  // Excel parsing
  private async parseExcel(file: File): Promise<any[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet);
  }

  // JSON parsing
  private async parseJSON(file: File): Promise<any[]> {
    const text = await file.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  }

  // Apply field mapping
  private applyMapping(
    data: any[],
    mapping: Record<string, string>
  ): any[] {
    return data.map(record => {
      const mappedRecord: Record<string, any> = {};
      Object.entries(mapping).forEach(([from, to]) => {
        if (Object.prototype.hasOwnProperty.call(record, from)) {
          mappedRecord[to] = record[from];
        }
      });
      return mappedRecord;
    });
  }

  // Validate data
  private async validateData(
    collection: string,
    data: any[]
  ): Promise<ValidationResult> {
    const response = await api.post(`/api/validate/${collection}`, { data });
    return response.data;
  }

  // Import data in batches
  private async importInBatches(
    collection: string,
    data: any[],
    batchSize: number
  ): Promise<ImportResult> {
    const results: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      try {
        const response = await api.post(`/api/import/${collection}`, {
          data: batch
        });
        
        results.imported += response.data.imported;
        results.failed += response.data.failed;
        if (response.data.errors) {
          results.errors.push(...response.data.errors);
        }
      } catch (error: any) {
        results.failed += batch.length;
        results.errors.push({
          batch: Math.floor(i / batchSize),
          error: error.message
        });
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  // Download helpers
  private downloadCSV(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${filename}.csv`);
  }

  private downloadExcel(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `${filename}.xlsx`);
  }

  private downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  }

  private downloadPDF(data: any[], filename: string, title: string): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title.charAt(0).toUpperCase() + title.slice(1) + ' Export', 14, 15);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Records: ${data.length}`, 14, 30);

    // Prepare table data
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(item =>
        headers.map(header => String(item[header] || ''))
      );

      // Add table
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8, cellPadding: 2 }
      });
    }

    doc.save(`${filename}.pdf`);
  }

  // Batch export multiple collections
  async exportMultiple(
    collections: string[],
    options: ExportOptions
  ): Promise<void> {
    const allData: Record<string, any[]> = {};
    
    for (const collection of collections) {
      const response = await api.post(`/api/export/${collection}`, {
        ...options,
        format: 'json'
      });
      allData[collection] = response.data;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `labflow-export-${timestamp}`;

    switch (options.format) {
      case 'excel':
        this.downloadMultiSheetExcel(allData, filename);
        break;
      case 'json':
        this.downloadJSON(allData, filename);
        break;
      default:
        throw new Error('Multi-collection export only supports Excel and JSON formats');
    }
  }

  private downloadMultiSheetExcel(
    data: Record<string, any[]>,
    filename: string
  ): void {
    const workbook = XLSX.utils.book_new();
    
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `${filename}.xlsx`);
  }
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: any[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const dataExportService = new DataExportService();