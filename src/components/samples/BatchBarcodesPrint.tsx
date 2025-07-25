import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import type { Sample } from '@/types/sample.types';

interface BatchBarcodesPrintProps {
  isOpen: boolean;
  onClose: () => void;
  samples: Sample[];
}

const BatchBarcodesPrint: React.FC<BatchBarcodesPrintProps> = ({
  isOpen,
  onClose,
  samples,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const generateQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sample Barcodes</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .print-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .barcode-label {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: center;
              page-break-inside: avoid;
            }
            .barcode-label img {
              max-width: 100%;
              height: auto;
            }
            .label-info {
              margin-top: 5px;
              font-size: 11px;
              line-height: 1.3;
            }
            .label-info strong {
              font-size: 12px;
            }
            @media print {
              .barcode-label {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Print Batch Barcodes</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="mb-4 text-sm text-gray-600">
              Preview of {samples.length} barcode labels. Click Print to generate labels.
            </div>

            {/* Print Preview */}
            <div ref={printRef}>
              <div className="print-container grid grid-cols-3 gap-2">
                {samples.map((sample) => (
                  <div key={sample.id} className="barcode-label border rounded p-3 text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${JSON.stringify({
                        sampleId: sample.id,
                        sampleNumber: sample.sampleNumber,
                        barcode: sample.barcode,
                      })}`}
                      alt={`Barcode for ${sample.sampleNumber}`}
                      className="mx-auto mb-2"
                    />
                    <div className="label-info text-xs">
                      <strong>{sample.sampleNumber}</strong>
                      <br />
                      {sample.barcode}
                      <br />
                      Type: {sample.type}
                      <br />
                      {new Date(sample.collectionDate.seconds * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchBarcodesPrint;