import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, AlertCircle } from 'lucide-react';
import { QRCodeScanner } from 'qrcode-studio';
const BarcodeScanner = QRCodeScanner;

const ScanScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState('');

  const startScan = async () => {
    try {
      setScanError(null);
      setIsScanning(true);

      const permission = await BarcodeScanner.requestPermission();
      if (!permission.granted) {
        throw new Error('Camera permission denied');
      }

      const result = await BarcodeScanner.startScan();
      if (result.hasContent) {
        handleScanResult(result.content);
      }
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Failed to start scanner');
    } finally {
      setIsScanning(false);
      BarcodeScanner.stopScan();
    }
  };

  const handleScanResult = (content: string) => {
    // Parse the barcode content and navigate to appropriate screen
    console.log('Scanned:', content);

    // Example: Navigate to collection detail if it's an order barcode
    if (content.startsWith('ORD-')) {
      navigate(`/phlebotomist/collection/${content}`);
    } else if (content.startsWith('SAMPLE-')) {
      navigate(`/phlebotomist/sample/${content}`);
    } else {
      setScanError('Unknown barcode format');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      handleScanResult(manualEntry.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Scan Barcode</h1>
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!isScanning ? (
          <div className="w-full max-w-sm space-y-6">
            {/* Camera Button */}
            <button
              onClick={startScan}
              className="w-full bg-blue-500 text-white rounded-lg p-6 flex flex-col items-center space-y-3 hover:bg-blue-600 transition-colors"
            >
              <Camera className="h-12 w-12" />
              <span className="text-lg font-medium">Start Scanner</span>
            </button>

            {/* Manual Entry */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Or enter code manually</h2>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  placeholder="Enter barcode number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors"
                >
                  Submit
                </button>
              </form>
            </div>

            {/* Error Message */}
            {scanError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Scan Error</p>
                  <p className="text-sm text-red-600 mt-1">{scanError}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Position the barcode within the scanner frame</p>
              <p className="text-xs text-gray-500">
                Supported formats: Order barcodes, Sample barcodes
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <Camera className="h-16 w-16 text-blue-500 mx-auto" />
            </div>
            <p className="text-lg font-medium text-gray-900">Scanning...</p>
            <button
              onClick={() => setIsScanning(false)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;
