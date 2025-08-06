import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import { QRScanner, BarcodeScanner as CraftBarcodeScanner } from 'code-craft-studio';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/stores/toast.store';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  supportedFormats?: string[];
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  supportedFormats = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'QR_CODE', 'DATA_MATRIX'],
}) => {
  const [error, setError] = useState<string>('');

  const handleScanSuccess = (result: any) => {
    const data = typeof result === 'string' ? result : result?.data || result?.text;
    if (data) {
      onScan(data);
      toast.success('Barcode Scanned', `Code: ${data}`);
      onClose();
    }
  };

  const handleScanError = (error: any) => {
    console.error('Scan error:', error);
    const errorMessage = error?.message || error?.toString() || 'Failed to scan barcode';
    setError(errorMessage);
    toast.error('Scan Failed', errorMessage);
  };

  // For web platform, show alternative input
  if (!Capacitor.isNativePlatform() && typeof navigator !== 'undefined' && !navigator.mediaDevices) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Scan Barcode</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center py-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Camera access is not available in this browser
            </p>
            <p className="text-sm text-gray-500">
              Please enter the barcode manually or use a supported browser
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Barcode Manually
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter barcode number"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  onScan(e.currentTarget.value);
                  onClose();
                }
              }}
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-[600px] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner */}
        <div className="relative h-[calc(100%-60px)]">
          {/* Use code-craft-studio's BarcodeScanner component */}
          <CraftBarcodeScanner
            formats={supportedFormats as any}
            onScan={handleScanSuccess}
            onError={handleScanError}
            className="w-full h-full"
          />

          {/* Error Message */}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
            <p className="text-white text-sm bg-black bg-opacity-50 rounded px-4 py-2 inline-block">
              Align barcode within the frame
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;