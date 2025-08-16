import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, X, Scan } from 'lucide-react';
import { barcodeScanner } from '@/services/barcode-scanner.service';
import { toast } from '@/stores/toast.store';
import { Capacitor } from '@capacitor/core';
import BarcodeScanner from '@/components/samples/BarcodeScanner';
import { sampleService } from '@/services/sample.service';
import { useTenantStore } from '@/stores/tenant.store';

const SampleScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTenant } = useTenantStore();
  const [isScanning, setIsScanning] = useState(false);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<{ sampleId?: string; sampleNumber?: string } | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const isNativePlatform = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isScanning) {
      const performScan = async () => {
        try {
          const result = await barcodeScanner.startScan();
          if (result && result.hasContent) {
            // Handle scan result inline
            try {
              const parsed = JSON.parse(result.content);
              setScanResult(parsed);

              if (parsed.sampleId) {
                toast.success('Sample Found', `Sample ${parsed.sampleNumber} scanned successfully`);
                navigate(`/samples/${parsed.sampleId}`);
              }
            } catch {
              toast.error('Invalid QR Code', 'The scanned code is not a valid sample QR code');
            }
            setIsScanning(false);
          }

          if (!result) {
            toast.error('Scanner Error', 'Failed to start scanner');
            setIsScanning(false);
          }
        } catch {
          toast.error('Scanner Error', 'Failed to access camera');
          setIsScanning(false);
        }
      };
      performScan();
    }
    return () => {
      if (isScanning) {
        barcodeScanner.stopScan();
      }
    };
  }, [isScanning, navigate]);

  const _startScanning = async () => {
    try {
      const result = await barcodeScanner.startScan();
      if (result && result.hasContent) {
        handleScanResult(result.content);
        setIsScanning(false);
      }

      if (!result) {
        toast.error('Scanner Error', 'Failed to start scanner');
        setIsScanning(false);
      }
    } catch {
      toast.error('Scanner Error', 'Failed to access camera');
      setIsScanning(false);
    }
  };

  const handleScanResult = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      setScanResult(parsed);

      if (parsed.sampleId) {
        toast.success('Sample Found', `Sample ${parsed.sampleNumber} scanned successfully`);
        navigate(`/samples/${parsed.sampleId}`);
      }
    } catch {
      toast.error('Invalid QR Code', 'The scanned code is not a valid sample QR code');
    }
  };

  const searchSample = async (barcodeOrNumber: string) => {
    if (!currentTenant) {
      toast.error('Error', 'No tenant selected');
      return;
    }

    setIsSearching(true);
    try {
      const sample = await sampleService.searchSampleByBarcode(currentTenant.id, barcodeOrNumber);
      
      if (sample) {
        toast.success('Sample Found', `Sample ${sample.sampleNumber} found`);
        navigate(`/samples/${sample.id}`);
      } else {
        toast.error('Not Found', `No sample found with barcode/number: ${barcodeOrNumber}`);
      }
    } catch (error) {
      toast.error('Search Error', 'Failed to search for sample');
      console.error('Sample search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBarcodeResult = async (barcode: string) => {
    setManualInput(barcode);
    await searchSample(barcode);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      await searchSample(manualInput.trim());
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scan Sample</h1>
            <p className="text-gray-600 mt-2">Scan QR code or enter barcode manually</p>
          </div>
          <button
            onClick={() => navigate('/samples')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Samples
          </button>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isNativePlatform ? 'Barcode Scanner' : 'QR Code Scanner'}
        </h2>

        {!isScanning ? (
          <div className="text-center py-12">
            {isNativePlatform ? (
              <>
                <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Scan barcode or QR code on sample containers</p>
                <button
                  onClick={() => setIsBarcodeScanning(true)}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Camera className="h-5 w-5" />
                  Start Barcode Scanner
                </button>
              </>
            ) : (
              <>
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Click below to start scanning</p>
                <button
                  onClick={() => setIsScanning(true)}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Camera className="h-5 w-5" />
                  Start QR Scanner
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <div
              id="qr-reader"
              className="w-full rounded-lg overflow-hidden"
              style={{ minHeight: '400px' }}
            ></div>
            <button
              onClick={() => {
                setIsScanning(false);
                barcodeScanner.stopScan();
              }}
              className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Position the QR code within the frame
            </p>
          </div>
        )}
      </div>

      {/* Manual Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Manual Entry</h2>
        <form onSubmit={handleManualSubmit}>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter barcode or sample number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSearching || !manualInput.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">Scan Result</h3>
          <pre className="text-xs text-green-700 overflow-auto">
            {JSON.stringify(scanResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Native Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isBarcodeScanning}
        onClose={() => setIsBarcodeScanning(false)}
        onScan={handleBarcodeResult}
        supportedFormats={[
          'CODE128',
          'CODE39',
          'EAN13',
          'EAN8',
          'QR_CODE',
          'DATA_MATRIX',
          'CODE93',
          'CODABAR',
        ]}
      />
    </div>
  );
};

export default SampleScanPage;
