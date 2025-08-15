import { Capacitor } from '@capacitor/core';

interface ScanResult {
  cancelled: boolean;
  text?: string;
  format?: string;
}

class BarcodeScannerService {
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // Try to import the actual barcode scanner plugin
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      return !!(BarcodeScanner);
    } catch (error) {
      console.log('Barcode scanner plugin not available:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      const status = await BarcodeScanner.checkPermission({ force: true });
      return status.granted;
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  async startScan(): Promise<ScanResult> {
    if (!Capacitor.isNativePlatform()) {
      // Web fallback - simulate scan
      return this.simulateScan();
    }

    try {
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { cancelled: true };
      }

      // Hide background to show camera
      await BarcodeScanner.hideBackground();
      document.body.classList.add('scanner-active');

      const result = await BarcodeScanner.startScan();
      
      // Restore background
      await BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');

      return {
        cancelled: !result.hasContent,
        text: result.content,
        format: result.format
      };
    } catch (error) {
      console.error('Scan failed:', error);
      return { cancelled: true };
    }
  }

  async stopScan(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      await BarcodeScanner.stopScan();
      await BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');
    } catch (error) {
      console.error('Failed to stop scan:', error);
    }
  }

  private simulateScan(): Promise<ScanResult> {
    return new Promise((resolve) => {
      // Simulate scanning delay
      setTimeout(() => {
        const mockBarcodes = [
          'PAT123456789', // Patient ID
          'SAMPLE20241027001', // Sample ID  
          'TUBE789012345', // Tube ID
          'ORDER456789123' // Order ID
        ];
        
        const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        resolve({
          cancelled: false,
          text: randomBarcode,
          format: 'QR_CODE'
        });
      }, 1500);
    });
  }

  parseScanResult(scannedText: string): { type: string; data: any } {
    // Parse different barcode formats
    if (scannedText.startsWith('PAT')) {
      return {
        type: 'patient',
        data: {
          patientId: scannedText,
          name: 'John Doe', // Would be looked up in real implementation
          dob: '1980-05-15',
          mrn: scannedText.replace('PAT', 'MRN')
        }
      };
    } else if (scannedText.startsWith('SAMPLE')) {
      return {
        type: 'sample',
        data: {
          sampleId: scannedText,
          patientId: 'PAT123456789',
          collectionDate: new Date().toISOString(),
          tests: ['CBC', 'Lipid Panel']
        }
      };
    } else if (scannedText.startsWith('TUBE')) {
      return {
        type: 'tube',
        data: {
          tubeId: scannedText,
          tubeType: 'Lavender Top',
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } else if (scannedText.startsWith('ORDER')) {
      return {
        type: 'order',
        data: {
          orderId: scannedText,
          patientId: 'PAT123456789',
          tests: ['CBC', 'CMP', 'TSH'],
          priority: 'routine'
        }
      };
    }

    return {
      type: 'unknown',
      data: { text: scannedText }
    };
  }
}

export const barcodeScanner = new BarcodeScannerService();