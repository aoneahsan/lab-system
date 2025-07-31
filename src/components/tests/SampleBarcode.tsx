import React, { useEffect, useState } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';
import { generateSampleQRCode, createSampleBarcodeData, generateBarcodeLabel } from '@/utils/barcode.utils';
import type { TestOrder } from '@/types/test.types';

interface SampleBarcodeProps {
  order: TestOrder;
  patientName: string;
  className?: string;
}

const SampleBarcode: React.FC<SampleBarcodeProps> = ({ order, patientName, className = '' }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [sampleId, setSampleId] = useState<string>('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    const generateBarcode = async () => {
      const barcodeData = createSampleBarcodeData(
        order.id,
        order.patientId,
        new Date(),
        order.tenantId
      );
      
      setSampleId(barcodeData.sampleId);
      
      const qrCodeUrl = await generateSampleQRCode(barcodeData, {
        size: 200,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
      
      setQrCode(qrCodeUrl);
    };

    generateBarcode();
  }, [order]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `sample-${sampleId}.png`;
    link.href = qrCode;
    link.click();
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Sample Barcode
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              title="Download barcode"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              title="Print label"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="text-center">
          {qrCode ? (
            <>
              <img 
                src={qrCode} 
                alt="Sample QR Code" 
                className="mx-auto mb-3"
                style={{ width: '150px', height: '150px' }}
              />
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-mono font-medium">{sampleId}</p>
                <p>{patientName}</p>
                <p>Order: {order.orderNumber}</p>
              </div>
            </>
          ) : (
            <div className="h-[150px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Print Preview (hidden from view, only for printing) */}
      {showPrintPreview && (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-8">
          <style>
            {`
              @media print {
                .print-only {
                  display: block !important;
                }
                body > *:not(.print-only) {
                  display: none !important;
                }
              }
              @media screen {
                .print-only {
                  display: none !important;
                }
              }
            `}
          </style>
          <div className="max-w-sm mx-auto">
            <div className="border-2 border-black p-4 rounded">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">{order.tenantId} Laboratory</h2>
                <p className="text-sm">Sample Label</p>
              </div>
              
              <img 
                src={qrCode} 
                alt="Sample QR Code" 
                className="mx-auto mb-4"
                style={{ width: '200px', height: '200px' }}
              />
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Sample ID:</span>
                  <span className="font-mono ml-2">{sampleId}</span>
                </div>
                <div>
                  <span className="font-semibold">Patient:</span>
                  <span className="ml-2">{patientName}</span>
                </div>
                <div>
                  <span className="font-semibold">Order #:</span>
                  <span className="ml-2">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="font-semibold">Priority:</span>
                  <span className="ml-2 uppercase">{order.priority}</span>
                </div>
                <div>
                  <span className="font-semibold">Collection Date:</span>
                  <span className="ml-2">{formatDate(new Date())}</span>
                </div>
                <div>
                  <span className="font-semibold">Tests:</span>
                  <div className="ml-2 text-xs mt-1">
                    {order.tests.slice(0, 3).map((test, idx) => (
                      <div key={idx}>{test.testCode} - {test.testName}</div>
                    ))}
                    {order.tests.length > 3 && (
                      <div>... and {order.tests.length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold">Collected by:</p>
                    <div className="border-b border-black mt-4"></div>
                  </div>
                  <div>
                    <p className="font-semibold">Date/Time:</p>
                    <div className="border-b border-black mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SampleBarcode;