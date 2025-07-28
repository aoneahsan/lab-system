import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
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
    return Capacitor.isNativePlatform();
  }

  // Request camera permission
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Barcode scanning is only supported on native platforms');
      return false;
    }

    try {
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (status.granted) {
        return true;
      }

      if (status.denied) {
        // User denied permission
        alert('Camera permission is required for barcode scanning. Please enable it in settings.');
        return false;
      }

      if (status.restricted || status.unknown) {
        // iOS only - permission is restricted
        return false;
      }

      // Permission not requested yet
      const newStatus = await BarcodeScanner.checkPermission({ force: true });
      return newStatus.granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  // Start scanning
  async startScan(): Promise<ScanResult | null> {
    if (!this.isSupported()) {
      return this.mockScan();
    }

    if (this.isScanning) {
      console.warn('Scanner is already active');
      return null;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      this.isScanning = true;

      // Hide background to show camera preview
      await BarcodeScanner.hideBackground();
      document.body.classList.add('scanner-active');

      const result = await BarcodeScanner.startScan();

      return {
        hasContent: result.hasContent,
        content: result.content || '',
        format: result.format || 'UNKNOWN',
      };
    } catch (error) {
      console.error('Error during barcode scan:', error);
      return null;
    } finally {
      await this.stopScan();
    }
  }

  // Stop scanning
  async stopScan(): Promise<void> {
    if (!this.isScanning) return;

    try {
      await BarcodeScanner.stopScan();
      await BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');
      this.isScanning = false;
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
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

  // Enable torch/flashlight
  async enableTorch(): Promise<void> {
    if (!this.isSupported() || !this.isScanning) return;

    try {
      await BarcodeScanner.enableTorch();
    } catch (error) {
      console.error('Error enabling torch:', error);
    }
  }

  // Disable torch/flashlight
  async disableTorch(): Promise<void> {
    if (!this.isSupported() || !this.isScanning) return;

    try {
      await BarcodeScanner.disableTorch();
    } catch (error) {
      console.error('Error disabling torch:', error);
    }
  }

  // Toggle torch/flashlight
  async toggleTorch(): Promise<void> {
    if (!this.isSupported() || !this.isScanning) return;

    try {
      await BarcodeScanner.toggleTorch();
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  }

  // Get torch status
  async getTorchState(): Promise<boolean> {
    if (!this.isSupported() || !this.isScanning) return false;

    try {
      const state = await BarcodeScanner.getTorchState();
      return state.isEnabled || false;
    } catch (error) {
      console.error('Error getting torch state:', error);
      return false;
    }
  }
}

export const barcodeScannerService = new BarcodeScannerService();
