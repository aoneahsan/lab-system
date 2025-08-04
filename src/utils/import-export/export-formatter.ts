import { Test, InventoryItem } from '@/types';
import { format } from 'date-fns';

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json';
  includeMetadata?: boolean;
  dateFormat?: string;
  fields?: string[];
}

export class ExportFormatter {
  static formatTestsForExport(
    tests: Test[],
    options: ExportOptions
  ): Record<string, any>[] {
    const { includeMetadata = true, dateFormat = 'yyyy-MM-dd', fields } = options;
    
    return tests.map(test => {
      const baseData: Record<string, any> = {
        code: test.code,
        name: test.name,
        category: test.category,
        price: test.price || 0,
        turnaroundTime: test.turnaroundTime?.routine || 0,
        isActive: test.isActive !== false,
      };
      
      if (includeMetadata) {
        Object.assign(baseData, {
          loincCode: test.loincCode || '',
          cptCode: test.cptCode || '',
          department: test.department || '',
          specimenType: test.specimen?.type || '',
          containerType: test.specimen?.container || '',
          minimumVolume: test.specimen?.volume || '',
          volumeUnit: test.specimen?.volumeUnit || '',
          methodology: test.methodology || '',
          unit: test.unit || '',
          referenceRanges: JSON.stringify(test.referenceRanges || []),
          criticalLow: test.criticalValues?.low || '',
          criticalHigh: test.criticalValues?.high || '',
          notes: test.notes || '',
          createdAt: test.createdAt ? format(typeof test.createdAt === 'object' && 'toDate' in test.createdAt ? test.createdAt.toDate() : test.createdAt, dateFormat) : '',
          updatedAt: test.updatedAt ? format(typeof test.updatedAt === 'object' && 'toDate' in test.updatedAt ? test.updatedAt.toDate() : test.updatedAt, dateFormat) : '',
        });
      }
      
      // Filter fields if specified
      if (fields && fields.length > 0) {
        const filteredData: Record<string, any> = {};
        fields.forEach(field => {
          if (field in baseData) {
            filteredData[field] = baseData[field];
          }
        });
        return filteredData;
      }
      
      return baseData;
    });
  }
  
  static formatInventoryForExport(
    items: InventoryItem[],
    options: ExportOptions
  ): Record<string, any>[] {
    const { includeMetadata = true, dateFormat = 'yyyy-MM-dd', fields } = options;
    
    return items.map(item => {
      const baseData: Record<string, any> = {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        unitCost: item.unitCost || 0,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock || 0,
      };
      
      if (includeMetadata) {
        Object.assign(baseData, {
          description: item.description || '',
          manufacturer: item.manufacturer || '',
          catalogNumber: item.catalogNumber || '',
          storageCondition: item.storageCondition || '',
          lastPurchasePrice: item.lastPurchasePrice || 0,
          isActive: item.isActive !== false,
          createdAt: item.createdAt ? format(item.createdAt.toDate(), dateFormat) : '',
          updatedAt: item.updatedAt ? format(item.updatedAt.toDate(), dateFormat) : '',
        });
      }
      
      // Filter fields if specified
      if (fields && fields.length > 0) {
        const filteredData: Record<string, any> = {};
        fields.forEach(field => {
          if (field in baseData) {
            filteredData[field] = baseData[field];
          }
        });
        return filteredData;
      }
      
      return baseData;
    });
  }
  
  static generateTestImportTemplate(): Record<string, any>[] {
    return [
      {
        code: 'CBC001',
        name: 'Complete Blood Count',
        category: 'Hematology',
        price: 45.00,
        turnaroundTime: 1,
        turnaroundUnit: 'days',
        loincCode: '58410-2',
        cptCode: '85025',
        description: 'Complete blood count with differential',
        specimenType: 'Whole Blood',
        containerType: 'EDTA tube',
        minimumVolume: 3,
        volumeUnit: 'mL',
        storageTemperature: '2-8°C',
        methodology: 'Flow Cytometry',
        units: 'cells/μL',
        referenceRange: 'See individual components',
        criticalLow: '',
        criticalHigh: '',
        notes: 'Do not freeze specimen',
        isActive: true,
      },
      {
        code: 'GLUC001',
        name: 'Glucose, Fasting',
        category: 'Chemistry',
        price: 25.00,
        turnaroundTime: 4,
        turnaroundUnit: 'hours',
        loincCode: '2345-7',
        cptCode: '82947',
        description: 'Fasting glucose measurement',
        specimenType: 'Serum/Plasma',
        containerType: 'SST or PST',
        minimumVolume: 1,
        volumeUnit: 'mL',
        storageTemperature: '2-8°C',
        methodology: 'Hexokinase',
        units: 'mg/dL',
        referenceRange: '70-100',
        criticalLow: '40',
        criticalHigh: '500',
        notes: 'Patient must fast for 8-12 hours',
        isActive: true,
      },
    ];
  }
  
  static generateInventoryImportTemplate(): Record<string, any>[] {
    return [
      {
        itemCode: 'REG001',
        name: 'Glucose Reagent',
        category: 'Reagents',
        unit: 'bottle',
        quantity: 25,
        reorderLevel: 10,
        reorderQuantity: 50,
        unitCost: 125.50,
        location: 'Chemistry Lab - Shelf A2',
        vendorName: 'Lab Supplies Inc',
        vendorItemCode: 'LS-GLUC-500',
        lotNumber: 'LOT2024001',
        expiryDate: '2025-12-31',
        storageConditions: '2-8°C',
        notes: 'For use with analyzer model XYZ',
      },
      {
        itemCode: 'TUBE001',
        name: 'EDTA Tubes 3mL',
        category: 'Consumables',
        unit: 'box',
        quantity: 100,
        reorderLevel: 50,
        reorderQuantity: 200,
        unitCost: 45.00,
        location: 'Phlebotomy Station',
        vendorName: 'Medical Supplies Co',
        vendorItemCode: 'MS-EDTA-3ML',
        lotNumber: 'LOT2024002',
        expiryDate: '2026-06-30',
        storageConditions: 'Room temperature',
        notes: 'Purple top tubes for hematology',
      },
    ];
  }
  
  static formatJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }
  
  static generateFilename(
    prefix: string,
    fileFormat: 'excel' | 'csv' | 'json'
  ): string {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const extension = fileFormat === 'excel' ? 'xlsx' : fileFormat;
    return `${prefix}_export_${timestamp}.${extension}`;
  }
}