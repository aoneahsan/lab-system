import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Camera,
  Search,
  Package,
  User,
  TestTube,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { BarcodeScanner } from '@capacitor/barcode-scanner';
import { toast } from '@/hooks/useToast';

interface ScanResult {
  type: 'patient' | 'sample' | 'order';
  id: string;
  data: any;
  timestamp: Date;
}

const PhlebotomistScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    // Load recent scans from local storage
    const stored = localStorage.getItem('recentScans');
    if (stored) {
      setRecentScans(JSON.parse(stored));
    }

    return () => {
      // Clean up scanner if component unmounts while scanning
      if (isScanning) {
        BarcodeScanner.stopScan();
        document.querySelector('body')?.classList.remove('barcode-scanner-active');
      }
    };
  }, [isScanning]);

  const startScan = async () => {
    try {
      const permission = await BarcodeScanner.checkPermission({ force: true });
      
      if (!permission.granted) {
        toast.error('Camera permission is required to scan barcodes');
        return;
      }

      setIsScanning(true);
      document.querySelector('body')?.classList.add('barcode-scanner-active');
      
      const result = await BarcodeScanner.startScan();
      
      if (result.hasContent) {
        handleScanResult(result.content);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Failed to scan barcode');
    } finally {
      setIsScanning(false);
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      BarcodeScanner.stopScan();
    }
  };

  const handleScanResult = (content: string) => {
    // Parse the scanned content to determine type
    // In real app, this would follow a specific barcode format
    let scanResult: ScanResult;

    if (content.startsWith('PAT-')) {
      // Patient barcode
      scanResult = {
        type: 'patient',
        id: content,
        data: {
          patientId: content,
          name: 'John Doe', // Mock data
          dob: '1980-01-01',
        },
        timestamp: new Date(),
      };
      toast.success('Patient barcode scanned');
    } else if (content.startsWith('SAM-')) {
      // Sample barcode
      scanResult = {
        type: 'sample',
        id: content,
        data: {
          sampleId: content,
          patientName: 'Jane Smith', // Mock data
          tests: ['CBC', 'BMP'],
          collectedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };
      toast.success('Sample barcode scanned');
    } else if (content.startsWith('ORD-')) {
      // Order barcode
      scanResult = {
        type: 'order',
        id: content,
        data: {
          orderId: content,
          patientName: 'Robert Johnson', // Mock data
          tests: ['Lipid Panel'],
          priority: 'urgent',
        },
        timestamp: new Date(),
      };
      toast.success('Order barcode scanned');
    } else {
      // Unknown barcode format
      scanResult = {
        type: 'sample', // Default to sample
        id: content,
        data: { raw: content },
        timestamp: new Date(),
      };
      toast.info('Unknown barcode format');
    }

    // Add to recent scans
    const updatedScans = [scanResult, ...recentScans.slice(0, 9)]; // Keep last 10
    setRecentScans(updatedScans);
    localStorage.setItem('recentScans', JSON.stringify(updatedScans));

    // Navigate based on type
    if (scanResult.type === 'patient') {
      navigate(`/patient/${scanResult.id}`);
    } else if (scanResult.type === 'sample') {
      navigate(`/collection?sampleId=${scanResult.id}`);
    } else if (scanResult.type === 'order') {
      navigate(`/collection?orderId=${scanResult.id}`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanResult(manualInput.trim());
      setManualInput('');
    }
  };

  const getTypeIcon = (type: ScanResult['type']) => {
    switch (type) {
      case 'patient':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'sample':
        return <TestTube className="h-5 w-5 text-purple-500" />;
      case 'order':
        return <Package className="h-5 w-5 text-green-500" />;
    }
  };

  const clearHistory = () => {
    setRecentScans([]);
    localStorage.removeItem('recentScans');
    toast.info('Scan history cleared');
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Barcode Scanner</h1>
        
        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setScanMode('auto')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              scanMode === 'auto' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            Camera Scan
          </button>
          <button
            onClick={() => setScanMode('manual')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              scanMode === 'manual' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600'
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="px-6 py-4">
        {scanMode === 'auto' ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-12 w-12 text-purple-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Scan Barcode or QR Code
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Point your camera at any patient, sample, or order barcode
              </p>
              <button
                onClick={startScan}
                disabled={isScanning}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
                {isScanning ? 'Scanning...' : 'Start Scanner'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Manual Barcode Entry
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode Number
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="PAT-12345, SAM-67890, etc."
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Search className="h-5 w-5" />
                Submit
              </button>
            </div>
          </form>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Barcode Formats:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Patient: PAT-XXXXX</li>
                <li>Sample: SAM-XXXXX</li>
                <li>Order: ORD-XXXXX</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="flex-1 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Scans</h3>
            <button
              onClick={clearHistory}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear History
            </button>
          </div>
          
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <div
                key={index}
                onClick={() => handleScanResult(scan.id)}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3"
              >
                {getTypeIcon(scan.type)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{scan.id}</p>
                  <p className="text-sm text-gray-600">
                    {scan.type.charAt(0).toUpperCase() + scan.type.slice(1)} • {
                      new Date(scan.timestamp).toLocaleTimeString()
                    }
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div className="flex-1 relative">
            {/* Scanner viewfinder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
            </div>
          </div>
          
          <div className="p-6 text-center">
            <p className="text-white mb-4">Position barcode within the frame</p>
            <button
              onClick={() => {
                setIsScanning(false);
                BarcodeScanner.stopScan();
                document.querySelector('body')?.classList.remove('barcode-scanner-active');
              }}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebotomistScanPage;