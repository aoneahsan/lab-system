import { useEffect, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import { QRCodeStudio, BarcodeFormat } from 'qrcode-studio';

interface BarcodeGeneratorProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  fontSize?: number;
  className?: string;
}

export default function BarcodeGenerator({
  value,
  format = 'CODE128',
  width = 300,
  height = 100,
  displayValue = true,
  text,
  fontSize = 20,
  className = '',
}: BarcodeGeneratorProps) {
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!value) return;

    const generateBarcode = async () => {
      try {
        setError('');
        const formatMap: Record<string, BarcodeFormat> = {
          'CODE128': BarcodeFormat.CODE_128,
          'CODE39': BarcodeFormat.CODE_39,
          'EAN13': BarcodeFormat.EAN_13,
          'EAN8': BarcodeFormat.EAN_8,
          'UPC': BarcodeFormat.UPC_A
        };
        const result = await QRCodeStudio.generateBarcode({
          data: value,
          format: formatMap[format] || BarcodeFormat.CODE_128,
          width,
          height,
          displayText: displayValue,
          text: text || value,
          margins: { top: 10, right: 10, bottom: 10, left: 10 },
          // Remove unsupported properties
        });
        setBarcodeDataUrl(result.dataUrl);
      } catch (err) {
        console.error('Error generating barcode:', err);
        setError('Failed to generate barcode');
      }
    };

    generateBarcode();
  }, [value, format, width, height, displayValue, text, fontSize]);

  const handlePrint = () => {
    if (!barcodeDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <img src="${barcodeDataUrl}" alt="Barcode" />
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!barcodeDataUrl) return;

    // Download the barcode image
    const a = document.createElement('a');
    a.href = barcodeDataUrl;
    a.download = `barcode-${value}.png`;
    a.click();
  };

  if (error) {
    return (
      <div className={`bg-red-50 p-4 rounded-lg border border-red-200 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
      <div className="mb-4 flex justify-center">
        {barcodeDataUrl ? (
          <img src={barcodeDataUrl} alt="Generated Barcode" />
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Generating barcode...
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={handlePrint}
          className="btn btn-secondary"
          title="Print Barcode"
          disabled={!barcodeDataUrl}
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-secondary"
          title="Download Barcode"
          disabled={!barcodeDataUrl}
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
}