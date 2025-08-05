import { QRCodeStudio, QRType } from 'qrcode-studio';
import { Capacitor } from '@capacitor/core';

export interface ScanResult {
  hasContent: boolean;
  content: string;
  format: string;
}

export interface BarcodeData {
  type: 'patient' | 'sample' | 'test' | 'order';
  id: string;
  metadata?: Record<string, any>;
}

class BarcodeScannerService {
  private isScanning = false;

  // Check if barcode scanning is supported
  isSupported(): boolean {
    return Capacitor.isNativePlatform() || 'mediaDevices' in navigator;
  }

  // Request camera permission
  async requestPermission(): Promise<boolean> {
    try {
      const result = await QRCodeStudio.checkPermissions();
      
      if (result.camera === 'granted') {
        return true;
      }
      
      if (result.camera === 'denied') {
        alert('Camera permission is required for barcode scanning. Please enable it in settings.');
        return false;
      }
      
      // Request permissions if not yet granted
      const requested = await QRCodeStudio.requestPermissions();
      return requested.camera === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  // Start scanning (This will be replaced by React component usage)
  async startScan(): Promise<ScanResult | null> {
    if (this.isScanning) {
      console.warn('Scanner is already active');
      return null;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return null;
    }

    // For native platforms, we need to use the React component
    // This service method will be deprecated in favor of component-based scanning
    console.warn('Direct scanning via service is deprecated. Use QRScanner or BarcodeScanner components from code-craft-studio');
    
    // Return mock data for now
    return this.mockScan();
  }

  // Stop scanning
  async stopScan(): Promise<void> {
    this.isScanning = false;
    // Scanning stop will be handled by the React component
  }

  // Parse barcode content
  parseBarcode(content: string): BarcodeData | null {
    try {
      // Try to parse as JSON first
      const data = JSON.parse(content);
      if (data.type && data.id) {
        return data as BarcodeData;
      }
    } catch {
      // Not JSON, try other formats
    }

    // Try to parse as formatted string (e.g., "PATIENT:P123456")
    const match = content.match(/^(PATIENT|SAMPLE|TEST|ORDER):(.+)$/);
    if (match) {
      return {
        type: match[1].toLowerCase() as BarcodeData['type'],
        id: match[2],
      };
    }

    // Try to parse as sample tube barcode (common format)
    if (/^[A-Z]{2}\d{6,}$/.test(content)) {
      return {
        type: 'sample',
        id: content,
      };
    }

    // Try to parse as patient ID
    if (/^P\d{6,}$/.test(content)) {
      return {
        type: 'patient',
        id: content,
      };
    }

    return null;
  }

  // Generate barcode content
  generateBarcodeContent(data: BarcodeData): string {
    // For complex data, use JSON
    if (data.metadata && Object.keys(data.metadata).length > 0) {
      return JSON.stringify(data);
    }

    // For simple data, use formatted string
    return `${data.type.toUpperCase()}:${data.id}`;
  }

  // Generate barcode image using code-craft-studio
  async generateBarcodeImage(
    content: string,
    format: 'CODE128' | 'CODE39' | 'EAN13' = 'CODE128'
  ): Promise<string> {
    try {
      const result = await QRCodeStudio.generateBarcode({
        data: content,
        format,
        options: {
          width: 300,
          height: 100,
          displayValue: true,
        },
      });
      return result.dataUrl;
    } catch (error) {
      console.error('Error generating barcode:', error);
      throw error;
    }
  }

  // Generate QR code using code-craft-studio
  async generateQRCode(content: string): Promise<string> {
    try {
      const result = await QRCodeStudio.generate({
        type: QRType.TEXT,
        data: {
          text: content
        } as any,
        size: 200,
        margin: 4,
        errorCorrectionLevel: 'M' as any,
      });
      return result.dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Mock scan for web/development
  private async mockScan(): Promise<ScanResult> {
    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return mock data
    const mockData = [
      { content: 'SAMPLE:ST20241027001', format: 'CODE128' },
      { content: 'PATIENT:P12345678', format: 'QR_CODE' },
      {
        content: JSON.stringify({
          type: 'order',
          id: 'ORD20241027001',
          metadata: { priority: 'urgent' },
        }),
        format: 'QR_CODE',
      },
    ];

    const randomIndex = Math.floor(Math.random() * mockData.length);

    return {
      hasContent: true,
      ...mockData[randomIndex],
    };
  }

  // Read barcode from image file
  async readFromImage(imageUrl: string): Promise<ScanResult | null> {
    try {
      const results = await QRCodeStudio.readBarcodesFromImage({
        path: imageUrl,
      });
      
      if (results && results.length > 0) {
        const firstResult = results[0];
        return {
          hasContent: true,
          content: (firstResult as any).displayValue || (firstResult as any).rawValue || '',
          format: firstResult.format || 'UNKNOWN',
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error reading barcode from image:', error);
      return null;
    }
  }
}

export const barcodeScannerService = new BarcodeScannerService();