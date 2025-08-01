/**
 * Barcode and QR code generation utilities for test orders and samples
 * Uses code-craft-studio package for QR code generation
 */

import { QRCodeStudio } from 'code-craft-studio';

/**
 * Interface for barcode data structure
 */
export interface BarcodeData {
  sampleId: string;
  testOrderId: string;
  patientId: string;
  collectionDate: string;
  tenantId?: string;
}

/**
 * Interface for parsed barcode data
 */
export interface ParsedBarcodeData extends BarcodeData {
  version: string;
}

/**
 * Barcode data version for backward compatibility
 */
const BARCODE_VERSION = '1.0';

/**
 * Delimiter used in barcode data string
 */
const DELIMITER = '|';

/**
 * Counter for sequential sample IDs (in production, this should be stored in database)
 */
let sampleIdCounter = 0;

/**
 * Generates a unique sample ID with format YYYYMMDD-XXXX
 * @param date - Optional date for the sample ID (defaults to current date)
 * @returns Unique sample ID string
 */
export function generateSampleId(date?: Date): string {
  const sampleDate = date || new Date();
  
  // Format date as YYYYMMDD
  const year = sampleDate.getFullYear();
  const month = String(sampleDate.getMonth() + 1).padStart(2, '0');
  const day = String(sampleDate.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Increment counter and format as 4-digit number
  sampleIdCounter = (sampleIdCounter + 1) % 10000;
  const sequentialNumber = String(sampleIdCounter).padStart(4, '0');
  
  return `${dateString}-${sequentialNumber}`;
}

/**
 * Resets the sample ID counter (useful for testing or daily reset)
 * @param newValue - Optional new value for the counter
 */
export function resetSampleIdCounter(newValue: number = 0): void {
  sampleIdCounter = newValue;
}

/**
 * Formats barcode data into a structured string
 * @param data - Barcode data object
 * @returns Formatted barcode string
 */
export function formatBarcodeData(data: BarcodeData): string {
  const parts = [
    BARCODE_VERSION,
    data.sampleId,
    data.testOrderId,
    data.patientId,
    data.collectionDate,
    data.tenantId || ''
  ];
  
  return parts.join(DELIMITER);
}

/**
 * Parses a barcode string back into structured data
 * @param barcodeString - The barcode string to parse
 * @returns Parsed barcode data or null if invalid
 */
export function parseBarcodeData(barcodeString: string): ParsedBarcodeData | null {
  try {
    const parts = barcodeString.split(DELIMITER);
    
    if (parts.length < 5) {
      console.error('Invalid barcode format: insufficient data parts');
      return null;
    }
    
    return {
      version: parts[0],
      sampleId: parts[1],
      testOrderId: parts[2],
      patientId: parts[3],
      collectionDate: parts[4],
      tenantId: parts[5] || undefined
    };
  } catch (error) {
    console.error('Error parsing barcode data:', error);
    return null;
  }
}

/**
 * Generates a QR code for sample data
 * @param data - Barcode data object
 * @param options - QR code generation options
 * @returns Promise resolving to QR code data URL
 */
export async function generateSampleQRCode(
  data: BarcodeData,
  options?: {
    size?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  const barcodeString = formatBarcodeData(data);
  
  try {
    const result = await QRCodeStudio.generate({
      data: barcodeString,
      type: 'text',
      options: {
        width: options?.size || 256,
        height: options?.size || 256,
        margin: options?.margin || 4,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
        color: {
          dark: options?.darkColor || '#000000',
          light: options?.lightColor || '#FFFFFF'
        }
      }
    });
    
    return result.dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generates a QR code canvas element for sample data
 * @param data - Barcode data object
 * @param canvas - HTML canvas element
 * @param options - QR code generation options
 * @returns Promise resolving when QR code is drawn
 */
export async function generateSampleQRCodeToCanvas(
  data: BarcodeData,
  canvas: HTMLCanvasElement,
  options?: {
    size?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<void> {
  const barcodeString = formatBarcodeData(data);
  
  try {
    // Generate QR code data URL first
    const result = await QRCodeStudio.generate({
      data: barcodeString,
      type: 'text',
      options: {
        width: options?.size || 256,
        height: options?.size || 256,
        margin: options?.margin || 4,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
        color: {
          dark: options?.darkColor || '#000000',
          light: options?.lightColor || '#FFFFFF'
        }
      }
    });
    
    // Draw the generated image to canvas
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = result.dataUrl;
  } catch (error) {
    console.error('Error generating QR code to canvas:', error);
    throw new Error('Failed to generate QR code to canvas');
  }
}

/**
 * Creates complete sample barcode data with auto-generated sample ID
 * @param testOrderId - The test order ID
 * @param patientId - The patient ID
 * @param collectionDate - Optional collection date (defaults to current date)
 * @param tenantId - Optional tenant ID for multi-tenant systems
 * @returns Complete barcode data object
 */
export function createSampleBarcodeData(
  testOrderId: string,
  patientId: string,
  collectionDate?: Date,
  tenantId?: string
): BarcodeData {
  const date = collectionDate || new Date();
  const sampleId = generateSampleId(date);
  
  return {
    sampleId,
    testOrderId,
    patientId,
    collectionDate: date.toISOString(),
    tenantId
  };
}

/**
 * Validates barcode data for required fields
 * @param data - Barcode data to validate
 * @returns True if valid, false otherwise
 */
export function validateBarcodeData(data: Partial<BarcodeData>): data is BarcodeData {
  return !!(
    data.sampleId &&
    data.testOrderId &&
    data.patientId &&
    data.collectionDate
  );
}

/**
 * Generates a human-readable label for the barcode
 * @param data - Barcode data object
 * @returns Human-readable label string
 */
export function generateBarcodeLabel(data: BarcodeData): string {
  const date = new Date(data.collectionDate);
  const formattedDate = date.toLocaleDateString();
  
  return `Sample: ${data.sampleId}\nOrder: ${data.testOrderId}\nPatient: ${data.patientId}\nCollected: ${formattedDate}`;
}

/**
 * Utility to generate multiple sample IDs in batch
 * @param count - Number of sample IDs to generate
 * @param date - Optional date for all sample IDs
 * @returns Array of unique sample IDs
 */
export function generateBatchSampleIds(count: number, date?: Date): string[] {
  const sampleIds: string[] = [];
  
  for (let i = 0; i < count; i++) {
    sampleIds.push(generateSampleId(date));
  }
  
  return sampleIds;
}

/**
 * Exports barcode data as JSON for backup/transfer
 * @param data - Barcode data object
 * @returns JSON string representation
 */
export function exportBarcodeDataAsJson(data: BarcodeData): string {
  return JSON.stringify({
    version: BARCODE_VERSION,
    ...data
  }, null, 2);
}

/**
 * Imports barcode data from JSON string
 * @param jsonString - JSON string to parse
 * @returns Parsed barcode data or null if invalid
 */
export function importBarcodeDataFromJson(jsonString: string): BarcodeData | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (validateBarcodeData(parsed)) {
      return parsed;
    }
    
    console.error('Invalid barcode data in JSON');
    return null;
  } catch (error) {
    console.error('Error parsing barcode JSON:', error);
    return null;
  }
}