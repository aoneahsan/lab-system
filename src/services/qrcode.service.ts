import * as QRCodeStudio from 'qrcode-studio';
import type { SampleLabel, QRCodeConfig } from '@/types/sample.types';

export const qrcodeService = {
  // Generate QR code for sample
  async generateSampleQRCode(sampleLabel: SampleLabel, config?: QRCodeConfig): Promise<string> {
    const qrData = {
      sampleId: sampleLabel.sampleId,
      barcode: sampleLabel.barcode,
      sampleNumber: sampleLabel.sampleNumber,
      patientMRN: sampleLabel.medicalRecordNumber,
      collectionDate: sampleLabel.collectionDate,
      type: sampleLabel.sampleType,
      priority: sampleLabel.priority,
    };

    const options = {
      size: config?.size || 200,
      errorCorrectionLevel: config?.errorCorrectionLevel || 'M',
      margin: config?.includeMargin ? 4 : 0,
      color: {
        dark: config?.color?.dark || '#000000',
        light: config?.color?.light || '#FFFFFF',
      },
    };

    const qrCodeDataUrl = await (QRCodeStudio as any).generateQRCode(
      JSON.stringify(qrData),
      options
    );
    return qrCodeDataUrl;
  },

  // Generate barcode for sample
  async generateSampleBarcode(
    barcode: string,
    config?: {
      format?: 'CODE128' | 'CODE39' | 'EAN13';
      width?: number;
      height?: number;
      includeText?: boolean;
    }
  ): Promise<string> {
    // Using QRCodeStudio's barcode functionality
    const barcodeOptions = {
      format: config?.format || 'CODE128',
      width: config?.width || 300,
      height: config?.height || 100,
      displayValue: config?.includeText !== false,
    };

    const barcodeDataUrl = await (QRCodeStudio as any).generateBarcode(barcode, barcodeOptions);
    return barcodeDataUrl;
  },

  // Initialize QR code scanner
  async initializeScanner(
    videoElement: HTMLVideoElement,
    onScanSuccess: (decodedText: string, decodedResult: unknown) => void,
    onScanFailure?: (error: string) => void
  ): Promise<any> {
    const scanner = await (QRCodeStudio as any).createScanner();

    await scanner.start(videoElement, {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      onScanSuccess: (decodedText: string, decodedResult: unknown) => {
        try {
          // Try to parse as JSON for our QR codes
          const qrData = JSON.parse(decodedText);
          onScanSuccess(decodedText, qrData);
        } catch {
          // If not JSON, just pass the raw text
          onScanSuccess(decodedText, decodedResult);
        }
      },
      onScanFailure,
    });

    return scanner;
  },

  // Stop scanner
  async stopScanner(scanner: any): Promise<void> {
    await scanner.stop();
  },

  // Generate sample label with QR code and barcode
  async generateSampleLabel(
    sampleLabel: SampleLabel,
    qrConfig?: QRCodeConfig,
    barcodeConfig?: {
      format?: 'CODE128' | 'CODE39' | 'EAN13';
      width?: number;
      height?: number;
      includeText?: boolean;
    }
  ): Promise<{
    qrCode: string;
    barcode: string;
    labelHtml: string;
  }> {
    const qrCode = await this.generateSampleQRCode(sampleLabel, qrConfig);
    const barcode = await this.generateSampleBarcode(sampleLabel.barcode, barcodeConfig);

    // Generate label HTML
    const labelHtml = `
      <div style="width: 4in; height: 2in; padding: 10px; border: 1px solid #000; font-family: Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between;">
          <div style="flex: 1;">
            <h3 style="margin: 0; font-size: 14px;">${sampleLabel.patientName}</h3>
            <p style="margin: 2px 0; font-size: 12px;">MRN: ${sampleLabel.medicalRecordNumber}</p>
            <p style="margin: 2px 0; font-size: 12px;">DOB: ${sampleLabel.patientDOB}</p>
            <p style="margin: 2px 0; font-size: 12px;">Sample: ${sampleLabel.sampleNumber}</p>
            <p style="margin: 2px 0; font-size: 12px;">Type: ${sampleLabel.sampleType}</p>
            <p style="margin: 2px 0; font-size: 12px;">Date: ${sampleLabel.collectionDate} ${
              sampleLabel.collectionTime
            }</p>
            ${
              sampleLabel.priority !== 'routine'
                ? `<p style="margin: 2px 0; font-size: 12px; color: red; font-weight: bold;">PRIORITY: ${sampleLabel.priority.toUpperCase()}</p>`
                : ''
            }
          </div>
          <div style="text-align: center;">
            <img src="${qrCode}" width="80" height="80" />
          </div>
        </div>
        <div style="margin-top: 10px; text-align: center;">
          <img src="${barcode}" height="40" />
        </div>
        ${
          sampleLabel.specialInstructions
            ? `<p style="margin: 5px 0 0 0; font-size: 10px; font-style: italic;">${sampleLabel.specialInstructions}</p>`
            : ''
        }
      </div>
    `;

    return {
      qrCode,
      barcode,
      labelHtml,
    };
  },

  // Print label
  printLabel(labelHtml: string): void {
    const printWindow = window.open('', 'PRINT', 'height=400,width=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sample Label</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0; size: 4in 2in; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            ${labelHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  },

  // Batch print labels
  printBatchLabels(labels: string[]): void {
    const printWindow = window.open('', 'PRINT', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sample Labels</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0.5in; }
                .page-break { page-break-after: always; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            ${labels
              .map(
                (label, index) =>
                  `${label}${index < labels.length - 1 ? '<div class="page-break"></div>' : ''}`
              )
              .join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  },
};
