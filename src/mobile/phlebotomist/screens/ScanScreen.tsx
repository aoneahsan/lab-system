import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Flashlight,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  User,
  FileText,
  Clipboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { barcodeScannerService } from '@/services/barcode-scanner.service';
import type { BarcodeData, ScanResult } from '@/services/barcode-scanner.service';

interface ScanHistory {
  id: string;
  type: BarcodeData['type'];
  content: string;
  timestamp: Date;
  success: boolean;
}

export const ScanScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BarcodeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const scanTypes = [
    { id: 'sample', label: 'Sample Tube', icon: Package, color: 'blue' },
    { id: 'patient', label: 'Patient ID', icon: User, color: 'green' },
    { id: 'order', label: 'Test Order', icon: FileText, color: 'purple' },
  ];

  useEffect(() => {
    // Load scan history from local storage
    const savedHistory = localStorage.getItem('phlebotomist_scan_history');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }

    return () => {
      // Ensure scanner is stopped when component unmounts
      if (isScanning) {
        barcodeScannerService.stopScan();
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanResult(null);
    setIsScanning(true);

    try {
      const result = await barcodeScannerService.startScan();

      if (result && result.hasContent) {
        handleScanResult(result);
      } else {
        setError('No barcode detected. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan barcode');
    } finally {
      setIsScanning(false);
      setTorchEnabled(false);
    }
  };

  const handleScanResult = (result: ScanResult) => {
    const parsedData = barcodeScannerService.parseBarcode(result.content);

    if (parsedData) {
      setScanResult(parsedData);
      addToHistory(parsedData, result.content, true);

      // Navigate based on scan type
      setTimeout(() => {
        switch (parsedData.type) {
          case 'sample':
            navigate(`/phlebotomist/sample/${parsedData.id}`);
            break;
          case 'patient':
            navigate(`/phlebotomist/patient/${parsedData.id}`);
            break;
          case 'order':
            navigate(`/phlebotomist/order/${parsedData.id}`);
            break;
        }
      }, 1500);
    } else {
      setError('Invalid barcode format. Please scan a valid LabFlow barcode.');
      addToHistory(null, result.content, false);
    }
  };

  const addToHistory = (data: BarcodeData | null, content: string, success: boolean) => {
    const newEntry: ScanHistory = {
      id: Date.now().toString(),
      type: data?.type || 'sample',
      content,
      timestamp: new Date(),
      success,
    };

    const updatedHistory = [newEntry, ...scanHistory].slice(0, 20); // Keep last 20 scans
    setScanHistory(updatedHistory);
    localStorage.setItem('phlebotomist_scan_history', JSON.stringify(updatedHistory));
  };

  const toggleTorch = async () => {
    if (!isScanning) return;

    await barcodeScannerService.toggleTorch();
    const newState = await barcodeScannerService.getTorchState();
    setTorchEnabled(newState);
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('phlebotomist_scan_history');
  };

  const getScanTypeInfo = (type: BarcodeData['type']) => {
    return scanTypes.find((t) => t.id === type) || scanTypes[0];
  };

  if (!barcodeScannerService.isSupported()) {
    return (
      <div className="flex-1 bg-gray-50 p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Scanner Not Available</p>
              <p className="text-sm text-yellow-700 mt-1">
                Barcode scanning is only available on mobile devices. Please use the LabFlow mobile
                app for scanning functionality.
              </p>
            </div>
          </div>
        </div>

        {/* Mock scanning for development */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Mode</h3>
          <button
            onClick={startScanning}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium"
          >
            Simulate Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {!isScanning ? (
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
            <p className="text-gray-600 mt-1">Scan sample tubes, patient IDs, or test orders</p>
          </div>

          {/* Scan Types */}
          <div className="grid grid-cols-3 gap-3">
            {scanTypes.map((type) => (
              <div
                key={type.id}
                className={`bg-white p-4 rounded-lg border-2 border-${type.color}-200 text-center`}
              >
                <type.icon className={`h-8 w-8 text-${type.color}-600 mx-auto mb-2`} />
                <p className="text-sm font-medium text-gray-900">{type.label}</p>
              </div>
            ))}
          </div>

          {/* Last Scan Result */}
          {scanResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">Scan Successful</p>
                  <p className="text-sm text-green-700 mt-1">
                    {getScanTypeInfo(scanResult.type).label}: {scanResult.id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Scan Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Start Scan Button */}
          <button
            onClick={startScanning}
            className="w-full py-4 px-6 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            <QrCode className="h-6 w-6" />
            <span>Start Scanning</span>
          </button>

          {/* Scan History */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Clipboard className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Scan History</span>
                <span className="text-sm text-gray-500">({scanHistory.length})</span>
              </div>
              <span className="text-gray-400">{showHistory ? '−' : '+'}</span>
            </button>

            {showHistory && (
              <div className="border-t border-gray-200">
                {scanHistory.length > 0 ? (
                  <>
                    <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                      {scanHistory.map((scan) => (
                        <div key={scan.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {scan.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getScanTypeInfo(scan.type).label}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(scan.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 font-mono">
                            {scan.content.substring(0, 15)}...
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <button onClick={clearHistory} className="text-sm text-red-600 font-medium">
                        Clear History
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="p-4 text-sm text-gray-500 text-center">No scan history</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Scanner View */
        <div className="fixed inset-0 bg-black z-50">
          <div className="absolute inset-0 scanner-viewport" />

          {/* Scanner UI Overlay */}
          <div className="absolute inset-0 flex flex-col">
            {/* Header */}
            <div className="bg-black/50 p-4 flex items-center justify-between">
              <button onClick={() => barcodeScannerService.stopScan()} className="text-white p-2">
                <X className="h-6 w-6" />
              </button>
              <p className="text-white font-medium">Scanning...</p>
              <button
                onClick={toggleTorch}
                className={`text-white p-2 ${torchEnabled ? 'bg-white/20 rounded' : ''}`}
              >
                <Flashlight className="h-6 w-6" />
              </button>
            </div>

            {/* Scanning Frame */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="relative">
                <div className="w-64 h-64 border-2 border-white rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-0.5 w-full bg-red-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-black/50 p-4">
              <p className="text-white text-center text-sm">
                Position the barcode within the frame
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
