import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, AlertCircle } from 'lucide-react';
import { QRScanner } from 'code-craft-studio';

const ScanScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState('');

  const handleScanResult = (content: string) => {
    // Parse the barcode content and navigate to appropriate screen
    console.log('Scanned:', content);
    setScanError(null);
    setIsScanning(false);

    // Example: Navigate to collection detail if it's an order barcode
    if (content.startsWith('ORD-')) {
      navigate(`/phlebotomist/collection/${content}`);
    } else if (content.startsWith('SAMPLE-')) {
      navigate(`/phlebotomist/sample/${content}`);
    } else {
      setScanError('Unknown barcode format');
    }
  };

  const handleScanError = (error: Error) => {
    setScanError(error.message || 'Failed to scan barcode');
    setIsScanning(false);
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
              onClick={() => setIsScanning(true)}
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
          <div className="fixed inset-0 bg-black z-50">
            <QRScanner
              onScan={(result) => handleScanResult(result.data)}
              onError={handleScanError}
              options={{
                showTorchButton: true,
                showFlipCameraButton: true,
                scanDelay: 500,
              }}
              showOverlay={true}
              className="h-full"
            />
            <button
              onClick={() => setIsScanning(false)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;